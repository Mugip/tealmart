// app/api/webhooks/stripe/route.ts - FINAL FIX using VID instead of SKU
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import Stripe from "stripe"
import { getCJToken } from "@/lib/cjToken"
import countries from "i18n-iso-countries"
import { sendOrderConfirmationEmail } from '@/lib/email'

countries.registerLocale(require("i18n-iso-countries/langs/en.json"))

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
})

const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"

function getCountryCode(countryName: string): string {
  if (countryName.length === 2) {
    return countryName.toUpperCase()
  }
  
  const code = countries.getAlpha2Code(countryName, "en")
  
  if (code) {
    console.log(`✅ Mapped ${countryName} → ${code}`)
    return code
  }
  
  const variations: Record<string, string> = {
    "USA": "US",
    "United States of America": "US",
    "U.S.A.": "US",
    "U.S.": "US",
    "UK": "GB",
    "United Kingdom of Great Britain and Northern Ireland": "GB",
    "England": "GB",
    "Scotland": "GB",
    "Wales": "GB",
    "Northern Ireland": "GB",
  }
  
  const variationCode = variations[countryName]
  if (variationCode) {
    console.log(`✅ Mapped variation ${countryName} → ${variationCode}`)
    return variationCode
  }
  
  console.warn(`⚠️ Country code not found for: "${countryName}", defaulting to US`)
  return "US"
}

async function forwardOrderToCJ(order: any) {
  try {
    const token = await getCJToken()

    // Build products array - Use variant VID (the UUID), NOT the SKU
    const products = order.items.map((item: any) => {
      const product = item.product
      let vid = product.externalId // Default to product PID
      let vidSource = "product PID"
      
      console.log(`🔍 Processing product:`, {
        productId: product.id,
        externalId: product.externalId,
        title: product.title,
        hasVariants: !!product.variants,
      })
      
      // If product has variants, use the first variant's VID (the UUID id field, NOT sku)
      if (product.variants && typeof product.variants === 'object') {
        const variantsData = product.variants as any
        
        console.log(`📦 Variants data:`, variantsData)
        
        if (variantsData.items && Array.isArray(variantsData.items) && variantsData.items.length > 0) {
          const firstVariant = variantsData.items[0]
          // CRITICAL: Use the 'id' field (UUID), NOT the 'sku' field
          vid = firstVariant.id // This is the VID (UUID format like 05EDFE5D-1909-4317-A888-F5AABC5267B7)
          vidSource = "variant VID (UUID)"
          console.log(`✅ Using variant VID (UUID): ${vid} instead of product PID ${product.externalId}`)
          console.log(`ℹ️ Variant SKU was: ${firstVariant.sku} (NOT used for CJ API)`)
        } else {
          console.log(`⚠️ Product has variants object but no items array`)
        }
      } else {
        console.log(`ℹ️ Product has no variants, using product externalId as VID`)
      }
      
      if (!vid) {
        throw new Error(`Product ${product.id} (${product.title}) has no valid VID`)
      }
      
      return {
        vid: String(vid), // Send the UUID variant ID
        quantity: parseInt(item.quantity),
      }
    })

    const countryCode = getCountryCode(order.shippingCountry)

    const payload = {
      orderNumber: order.orderNumber,
      shippingZip: order.shippingZip,
      shippingCountry: order.shippingCountry,
      shippingCountryCode: countryCode,
      shippingProvince: order.shippingState,
      shippingCity: order.shippingCity,
      shippingPhone: order.shippingPhone || "0000000000",
      shippingCustomerName: order.shippingName,
      shippingAddress: order.shippingAddress,
      remark: `TealMart Order ${order.orderNumber}`,
      logisticName: "YunExpress",
      fromCountryCode: "CN",
      products: products,
    }

    console.log(`📤 Forwarding to CJ:`, JSON.stringify(payload, null, 2))

    const response = await fetch(`${CJ_API_URL}/shopping/order/createOrderV2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CJ-Access-Token": token,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    console.log(`📥 CJ Response:`, JSON.stringify(data, null, 2))

    if (data.code === 200 || data.result === true) {
      console.log(`✅ CJ Order created successfully`)
      
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PROCESSING" },
      })

      return { success: true, cjOrderNumber: data.data?.orderNum }
    } else {
      console.error(`❌ CJ API error:`, data)
      console.error(`📋 Full product info:`, order.items.map((i: any) => ({
        productId: i.product.id,
        externalId: i.product.externalId,
        title: i.product.title,
        hasVariants: !!i.product.variants,
        variantsData: i.product.variants,
      })))
      
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PENDING" },
      })

      return { success: false, error: data.message }
    }
  } catch (error: any) {
    console.error(`❌ Error forwarding to CJ:`, error)
    
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "PENDING" },
    })

    return { success: false, error: error.message }
  }
}

// After creating order, add:
await sendOrderConfirmationEmail({
  to: order.email,
  orderNumber: order.orderNumber,
  customerName: order.shippingName,
  orderDate: new Date().toLocaleDateString(),
  items: order.items.map(item => ({
    name: item.product.title,
    quantity: item.quantity,
    price: item.price,
    image: item.product.images[0] || '',
  })),
  subtotal: order.subtotal,
  shipping: order.shipping,
  tax: order.tax,
  total: order.total,
  shippingAddress: {
    name: order.shippingName,
    address: order.shippingAddress,
    city: order.shippingCity,
    state: order.shippingState,
    zip: order.shippingZip,
    country: order.shippingCountry,
    phone: order.shippingPhone,
  },
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get("stripe-signature")

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error(`❌ Webhook signature verification failed:`, err.message)
      return NextResponse.json({ error: err.message }, { status: 400 })
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      console.log(`✅ Payment successful: ${session.id}`)

      const order = await prisma.order.findFirst({
        where: { paymentId: session.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      if (!order) {
        console.error(`❌ Order not found for session ${session.id}`)
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { 
          status: "PROCESSING",
          paidAt: new Date(),
        },
      })

      console.log(`📦 Processing order ${order.orderNumber} with ${order.items.length} items`)

      const result = await forwardOrderToCJ(order)

      if (result.success) {
        console.log(`✅ Order ${order.orderNumber} forwarded to CJ: ${result.cjOrderNumber}`)
      } else {
        console.error(`❌ Failed to forward order ${order.orderNumber}: ${result.error}`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("❌ Webhook error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

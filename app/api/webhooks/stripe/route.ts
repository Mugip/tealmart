// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import Stripe from "stripe"
import { getCJToken } from "@/lib/cjToken"
import countries from "i18n-iso-countries"

// Register English locale
countries.registerLocale(require("i18n-iso-countries/langs/en.json"))

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
})

const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"

function getCountryCode(countryName: string): string {
  // Already a 2-letter code
  if (countryName.length === 2) {
    return countryName.toUpperCase()
  }
  
  // Try to get code from country name
  const code = countries.getAlpha2Code(countryName, "en")
  
  if (code) {
    console.log(`✅ Mapped ${countryName} → ${code}`)
    return code
  }
  
  // Try common variations
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

    const products = order.items.map((item: any) => ({
      vid: item.product.externalId,
      quantity: String(item.quantity),
    }))

    const countryCode = getCountryCode(order.shippingCountry)

    const payload = {
      orderNumber: order.orderNumber,
      shippingZip: order.shippingZip,
      countryCode: countryCode,
      shippingCountry: order.shippingCountry,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
      shippingAddress: order.shippingAddress,
      shippingCustomerName: order.shippingName,
      shippingPhone: order.shippingPhone || "0000000000",
      remark: `TealMart Order ${order.orderNumber}`,
      products: products,
    }

    console.log(`📤 Forwarding to CJ:`, JSON.stringify(payload, null, 2))

    const response = await fetch(`${CJ_API_URL}/shopping/order/createOrder`, {
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
      console.log(`✅ CJ Order created`)
      
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PROCESSING" },
      })

      return { success: true, cjOrderNumber: data.data?.orderNum }
    } else {
      console.error(`❌ CJ API error:`, data)
      
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
      console.error(`Webhook signature verification failed:`, err.message)
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
        console.error(`Order not found for session ${session.id}`)
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { 
          status: "PROCESSING",
          paidAt: new Date(),
        },
      })

      const result = await forwardOrderToCJ(order)

      if (result.success) {
        console.log(`✅ Order ${order.orderNumber} forwarded to CJ`)
      } else {
        console.error(`❌ Failed to forward: ${result.error}`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// app/api/checkout/flutterwave/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Standard exchange rate to convert USD base prices to UGX for Flutterwave
const USD_TO_UGX_RATE = 3800;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.FLUTTERWAVE_SECRET_KEY) {
      return NextResponse.json({ error: "Payment gateway is currently misconfigured." }, { status: 500 })
    }

    const body = await req.json()
    const { items, email, shippingAddress, discountAmount, discountCode } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    if (!shippingAddress || typeof shippingAddress !== 'object') {
      return NextResponse.json({ error: "Shipping address is required" }, { status: 400 })
    }

    const requiredFields = ['name', 'address1', 'city', 'zip', 'phone']
    for (const field of requiredFields) {
      if (!shippingAddress[field]) {
        return NextResponse.json({ error: `${field} is required in shipping address` }, { status: 400 })
      }
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    const productIds = items.map(item => item.id.split('-')[0])
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    })

    if (products.length === 0) {
      return NextResponse.json({ error: "No valid products found" }, { status: 400 })
    }

    const productMap = new Map(products.map(p => [p.id, p]))
    const validatedItems: any[] =[]
    let subtotal = 0

    for (const item of items) {
      const baseProductId = item.id.split('-')[0]
      const variantId = item.id.includes('-') ? item.id.split('-')[1] : null
      const product = productMap.get(baseProductId)
      
      if (!product) continue

      let dbPrice = product.price
      if (variantId && product.variants && typeof product.variants === 'object') {
        const variantsData = product.variants as any
        if (variantsData.items && Array.isArray(variantsData.items)) {
          const variant = variantsData.items.find((v: any) => v.id === variantId)
          if (variant && variant.price) {
            dbPrice = variant.price
          }
        }
      }

      const quantity = item.quantity || 1
      validatedItems.push({
        productId: product.id,
        quantity,
        price: dbPrice,
        title: item.title || product.title,
      })
      subtotal += dbPrice * quantity
    }

    let finalDiscountAmount = discountAmount || 0;
    if (finalDiscountAmount > subtotal) finalDiscountAmount = subtotal; 
    
    const shipping = subtotal >= 50 ? 0 : 9.99
    const tax = 0 
    const total = subtotal + shipping + tax - finalDiscountAmount

    if (total <= 0) {
      return NextResponse.json({ error: "Order total must be greater than 0" }, { status: 400 })
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create Order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        email,
        shippingName: shippingAddress.name,
        shippingAddress: shippingAddress.address1,
        shippingCity: shippingAddress.city,
        shippingState: shippingAddress.state || "",
        shippingZip: shippingAddress.zip,
        shippingCountry: shippingAddress.country || "UG",
        shippingPhone: shippingAddress.phone,
        paymentMethod: "flutterwave",
        status: "PENDING",
        subtotal,
        tax,
        shipping,
        total,
        discountCode: discountCode || null,
        discountAmount: finalDiscountAmount,
        items: {
          create: validatedItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      }
    })

    // FLUTTERWAVE LOCALIZATION FIX:
    // If the country is Uganda (UG), pass UGX and convert the total. This forces Mobile Money options to appear.
    const isUganda = shippingAddress.country === 'UG' || shippingAddress.country === 'Uganda';
    const chargeCurrency = isUganda ? 'UGX' : 'USD';
    const chargeAmount = isUganda ? Math.round(order.total * USD_TO_UGX_RATE) : Number(order.total.toFixed(2));

    // IMPORTANT: Redirect to the unified Checkout Success page
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/checkout/success?order=${order.orderNumber}`

    const flutterwaveResponse = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tx_ref: order.orderNumber,
        amount: chargeAmount,
        currency: chargeCurrency,
        // Explicitly request all African payment forms
        payment_options: "card, mobilemoneyuganda, mobilemoneyghana, mobilemoneyrwanda, mobilemoneyzambia, mobilemoneyfranco, mpesa, ussd",
        redirect_url: redirectUrl,
        customer: {
          email: email,
          phonenumber: shippingAddress.phone,
          name: shippingAddress.name
        },
        customizations: {
          title: "TealMart Checkout",
          description: `Order ${order.orderNumber}`
        }
      })
    })

    const fwData = await flutterwaveResponse.json()

    if (fwData.status === 'success' && fwData.data && fwData.data.link) {
      return NextResponse.json({ url: fwData.data.link })
    } else {
      console.error("❌ Flutterwave API Error:", fwData)
      throw new Error(fwData.message || "Failed to generate payment link")
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Checkout failed" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

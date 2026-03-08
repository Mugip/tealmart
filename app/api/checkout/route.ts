// app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import Stripe from "stripe"

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, email, shippingAddress } = body

    console.log('📦 Checkout request:', { items: items?.length, email, hasAddress: !!shippingAddress })

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    if (!shippingAddress || typeof shippingAddress !== 'object') {
      return NextResponse.json({ error: "Shipping address is required" }, { status: 400 })
    }

    const requiredFields = ['name', 'address1', 'city', 'state', 'zip', 'phone']
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
    const validatedItems: any[] = []
    let subtotal = 0

    for (const item of items) {
      const baseProductId = item.id.split('-')[0]
      const product = productMap.get(baseProductId)
      if (!product) continue

      const price = item.price || product.price
      const quantity = item.quantity || 1

      validatedItems.push({
        productId: product.id,
        quantity,
        price,
        title: item.title || product.title,
      })

      subtotal += price * quantity
    }

    if (validatedItems.length === 0) {
      return NextResponse.json({ error: "No valid products in cart" }, { status: 400 })
    }

    const shipping = subtotal >= 50 ? 0 : 9.99
    const tax = subtotal * 0.1
    const total = subtotal + shipping + tax

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: validatedItems.map(item => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.title },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
      customer_email: email,
    })

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const order = await prisma.order.create({
      data: {
        orderNumber,
        email,
        shippingName: shippingAddress.name,
        shippingAddress: shippingAddress.address1,
        shippingCity: shippingAddress.city,
        shippingState: shippingAddress.state,
        shippingZip: shippingAddress.zip,
        shippingCountry: shippingAddress.country || "US",
        paymentMethod: "stripe",
        paymentId: session.id,
        status: "PENDING",
        subtotal,
        tax,
        shipping,
        total,
        items: {
          create: validatedItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    })

    console.log(`✅ Order created: ${order.orderNumber}`)

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      orderId: order.id,
      orderNumber: order.orderNumber,
    })
  } catch (error: any) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: error.message || "Checkout failed" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

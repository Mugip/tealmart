// app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import Stripe from "stripe"

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover", // Fixed version
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, email, shippingAddress } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      )
    }

    if (!email || !shippingAddress) {
      return NextResponse.json(
        { error: "Email and shipping address are required" },
        { status: 400 }
      )
    }

    // Validate and fetch all products from database
    const productIds = items.map(item => {
      // Extract base product ID (remove variant suffix if present)
      const baseId = item.id.split('-')[0]
      return baseId
    })

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        }
      }
    })

    if (products.length === 0) {
      return NextResponse.json(
        { error: "No valid products found in cart" },
        { status: 400 }
      )
    }

    // Create a map for quick lookup
    const productMap = new Map(products.map(p => [p.id, p]))

    // Validate each cart item and calculate totals
    const validatedItems: Array<{
      productId: string
      quantity: number
      price: number
      title: string
      variantId?: string
    }> = []

    let subtotal = 0

    for (const item of items) {
      // Extract base product ID and variant ID
      const parts = item.id.split('-')
      const baseProductId = parts[0]
      const variantId = parts.length > 1 ? parts.slice(1).join('-') : undefined

      const product = productMap.get(baseProductId)

      if (!product) {
        console.warn(`Product ${baseProductId} not found, skipping`)
        continue
      }

      // Use item price or product price
      const price = item.price || product.price
      const quantity = item.quantity || 1

      validatedItems.push({
        productId: product.id,
        quantity,
        price,
        title: item.title || product.title,
        variantId,
      })

      subtotal += price * quantity
    }

    if (validatedItems.length === 0) {
      return NextResponse.json(
        { error: "No valid products in cart" },
        { status: 400 }
      )
    }

    // Calculate shipping and tax
    const shipping = subtotal >= 50 ? 0 : 9.99
    const tax = subtotal * 0.1 // 10% tax
    const total = subtotal + shipping + tax

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: validatedItems.map(item => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.title,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
      customer_email: email,
      metadata: {
        email,
        shippingAddress: JSON.stringify(shippingAddress),
        items: JSON.stringify(validatedItems),
      },
    })

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create order in database (pending payment)
    const order = await prisma.order.create({
      data: {
        orderNumber,
        email,
        shippingName: shippingAddress.name || "Customer",
        shippingAddress: shippingAddress.address1 || shippingAddress.line1 || "",
        shippingCity: shippingAddress.city || "",
        shippingState: shippingAddress.state || "",
        shippingZip: shippingAddress.zip || shippingAddress.postalCode || "",
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
      include: {
        items: {
          include: {
            product: true,
          },
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
    return NextResponse.json(
      { error: error.message || "Checkout failed" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

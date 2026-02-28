import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customer, total, subtotal, tax, shipping } = body

    // Generate order number
    const orderNumber = `TM${Date.now()}`

    // Create order in database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        email: customer.email,
        status: 'PENDING',
        total,
        subtotal,
        tax,
        shipping,
        shippingName: customer.name,
        shippingAddress: customer.address,
        shippingCity: customer.city,
        shippingState: customer.state,
        shippingZip: customer.zip,
        shippingCountry: customer.country,
        paymentMethod: 'stripe',
        items: {
          create: items.map((item: any) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    })

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.title,
            images: [item.image],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?order=${orderNumber}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
      customer_email: customer.email,
      metadata: {
        orderId: order.id,
        orderNumber,
      },
    })

    // Update order with Stripe session ID
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentId: session.id },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Checkout failed' },
      { status: 500 }
    )
  }
}

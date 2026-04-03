// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import Stripe from "stripe"
import { sendOrderConfirmationEmail } from '@/lib/email'
import { pushOrderToCJ } from '@/lib/cj/orders' // ✅ Our new, clean helper

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
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
      console.log(`✅ Stripe Payment successful: ${session.id}`)

      const order = await prisma.order.findFirst({
        where: { paymentId: session.id },
        include: {
          items: {
            include: { product: true },
          },
        },
      })

      if (!order) {
        console.error(`❌ Order not found for session ${session.id}`)
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      // 1. Mark Order as Paid
      await prisma.order.update({
        where: { id: order.id },
        data: { 
          status: "PROCESSING",
          paidAt: new Date(),
        },
      })

      // 2. Automatically Push to CJ Dropshipping
      try {
        console.log(`📦 Pushing order ${order.orderNumber} to CJ Dropshipping...`)
        const cjOrder = await pushOrderToCJ(order.id)
        console.log(`✅ Order ${order.orderNumber} successfully forwarded to CJ! (CJ ID: ${cjOrder.cjOrderNumber})`)
      } catch (err: any) {
        console.error(`❌ Failed to forward order ${order.orderNumber} to CJ:`, err.message)
        // Note: We don't throw an error here. If CJ fails, we still want to send the customer 
        // their receipt. You can manually retry failed CJ orders in your Admin Panel later.
      }

      // 3. Send Order Confirmation Email to Customer
      try {
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
          },
        })
        console.log(`📧 Order confirmation email sent to ${order.email}`)
      } catch (emailError: any) {
        console.error(`❌ Failed to send confirmation email:`, emailError.message)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("❌ Stripe Webhook error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

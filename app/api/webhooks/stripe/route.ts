// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import Stripe from "stripe"
import { getCJToken } from "@/lib/cjToken"

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover", // Fixed version
})

const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"

// Forward order to CJ Dropshipping
async function forwardOrderToCJ(order: any) {
  try {
    const token = await getCJToken()

    // Build CJ order payload
    const products = order.items.map((item: any) => ({
      productId: item.product.externalId, // CJ product ID
      quantity: item.quantity,
      variantId: "", // Add variant support if needed
    }))

    const payload = {
      orderNumber: order.orderNumber,
      shippingMethod: "standard",
      products,
      shippingAddress: {
        firstName: order.shippingName.split(' ')[0] || "Customer",
        lastName: order.shippingName.split(' ').slice(1).join(' ') || "",
        address1: order.shippingAddress,
        address2: "",
        city: order.shippingCity,
        state: order.shippingState,
        zip: order.shippingZip,
        country: order.shippingCountry,
        phone: order.phone || "",
        email: order.email,
      },
    }

    console.log(`📤 Forwarding order ${order.orderNumber} to CJ:`, payload)

    const response = await fetch(`${CJ_API_URL}/shopping/order/createOrderV2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CJ-Access-Token": token,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (data.code === 200) {
      console.log(`✅ CJ Order created: ${data.data?.orderNumber}`)
      
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PROCESSING",
        },
      })

      return { success: true, cjOrderNumber: data.data?.orderNumber }
    } else {
      console.error(`❌ CJ API error:`, data)
      
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
        },
      })

      return { success: false, error: data.message }
    }
  } catch (error: any) {
    console.error(`❌ Error forwarding order to CJ:`, error)
    
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
      },
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

    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      console.log(`✅ Payment successful: ${session.id}`)

      // Find the order
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

      // Update order status to processing
      await prisma.order.update({
        where: { id: order.id },
        data: { 
          status: "PROCESSING",
          paidAt: new Date(),
        },
      })

      // Forward order to CJ Dropshipping
      const result = await forwardOrderToCJ(order)

      if (result.success) {
        console.log(`✅ Order ${order.orderNumber} forwarded to CJ: ${result.cjOrderNumber}`)
      } else {
        console.error(`❌ Failed to forward order ${order.orderNumber} to CJ: ${result.error}`)
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

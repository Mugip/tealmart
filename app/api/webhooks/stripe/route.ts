// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import Stripe from "stripe"
import { getCJToken } from "@/lib/cjToken"

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
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
      variantId: item.variantId || "",
    }))

    const shippingAddress = typeof order.shippingAddress === 'string' 
      ? JSON.parse(order.shippingAddress) 
      : order.shippingAddress

    const payload = {
      orderNumber: order.id,
      shippingMethod: "standard",
      products,
      shippingAddress: {
        firstName: shippingAddress.firstName || shippingAddress.name?.split(' ')[0] || "Customer",
        lastName: shippingAddress.lastName || shippingAddress.name?.split(' ').slice(1).join(' ') || "",
        address1: shippingAddress.address1 || shippingAddress.line1 || "",
        address2: shippingAddress.address2 || shippingAddress.line2 || "",
        city: shippingAddress.city || "",
        state: shippingAddress.state || shippingAddress.region || "",
        zip: shippingAddress.zip || shippingAddress.postalCode || "",
        country: shippingAddress.country || "US",
        phone: shippingAddress.phone || "",
        email: order.customerEmail,
      },
    }

    console.log(`📤 Forwarding order ${order.id} to CJ:`, payload)

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
      
      // Update order with CJ order number
      await prisma.order.update({
        where: { id: order.id },
        data: {
          cjOrderNumber: data.data?.orderNumber,
          cjOrderId: data.data?.orderId,
          status: "processing",
        },
      })

      return { success: true, cjOrderNumber: data.data?.orderNumber }
    } else {
      console.error(`❌ CJ API error:`, data)
      
      // Update order with error
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "failed",
          notes: `CJ API Error: ${data.message || data.code}`,
        },
      })

      return { success: false, error: data.message }
    }
  } catch (error: any) {
    console.error(`❌ Error forwarding order to CJ:`, error)
    
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "failed",
        notes: `Forwarding error: ${error.message}`,
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
      const order = await prisma.order.findUnique({
        where: { stripeSessionId: session.id },
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

      // Update order status to paid
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "paid" },
      })

      // Forward order to CJ Dropshipping
      const result = await forwardOrderToCJ(order)

      if (result.success) {
        console.log(`✅ Order ${order.id} forwarded to CJ: ${result.cjOrderNumber}`)
      } else {
        console.error(`❌ Failed to forward order ${order.id} to CJ: ${result.error}`)
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

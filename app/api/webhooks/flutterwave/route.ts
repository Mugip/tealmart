// app/api/webhooks/flutterwave/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { sendOrderConfirmationEmail } from '@/lib/email'
import { pushOrderToCJ } from '@/lib/cj/orders'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Flutterwave Secret Hash
    // You MUST set FLUTTERWAVE_WEBHOOK_HASH in your .env and in the Flutterwave Dashboard
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_HASH
    const signature = req.headers.get('verif-hash')

    if (!secretHash || signature !== secretHash) {
      console.error("❌ Flutterwave webhook signature missing or invalid")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await req.json()
    console.log(`✅ Flutterwave Webhook received:`, payload.event)

    // 2. Process Successful Payment
    if (payload.event === "charge.completed" && payload.data.status === "successful") {
      const orderNumber = payload.data.tx_ref // Flutterwave uses tx_ref for your order number

      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
          items: {
            include: { product: true },
          },
        },
      })

      if (!order) {
        console.error(`❌ Order not found for tx_ref: ${orderNumber}`)
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      // Prevent duplicate processing
      if (order.status !== "PENDING") {
        return NextResponse.json({ message: "Order already processed" })
      }

      // 3. Mark Order as Paid
      await prisma.order.update({
        where: { id: order.id },
        data: { 
          status: "PROCESSING",
          paidAt: new Date(),
        },
      })

      // 4. Automatically Push to CJ Dropshipping
      try {
        console.log(`📦 Pushing order ${order.orderNumber} to CJ Dropshipping...`)
        const cjOrder = await pushOrderToCJ(order.id)
        console.log(`✅ Order ${order.orderNumber} successfully forwarded to CJ! (CJ ID: ${cjOrder.cjOrderNumber})`)
      } catch (err: any) {
        console.error(`❌ Failed to forward order ${order.orderNumber} to CJ:`, err.message)
      }

      // 5. Send Order Confirmation Email
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
            name: order.shippingName, address: order.shippingAddress,
            city: order.shippingCity, state: order.shippingState,
            zip: order.shippingZip, country: order.shippingCountry,
          },
        })
      } catch (emailError: any) {
        console.error(`❌ Failed to send confirmation email:`, emailError.message)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("❌ Flutterwave Webhook error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

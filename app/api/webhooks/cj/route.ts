// app/api/webhooks/cj/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CJWebhookPayload } from '@/lib/cj/types'

export async function POST(request: NextRequest) {
  try {
    const payload: CJWebhookPayload = await request.json()

    // 1. Log the webhook securely for Admin audits
    await prisma.cJWebhookLog.create({
      data: {
        type: payload.type || 'UNKNOWN',
        event: payload.event || 'UNKNOWN',
        payload: payload as any,
        processed: false,
      },
    })

    const orderNumber = payload.data?.orderNumber || payload.data?.orderNum

    if (!orderNumber) {
      return NextResponse.json({ received: true, note: "No order number provided" })
    }

    // 2. Find the associated order
    const cjOrder = await prisma.cJOrder.findUnique({
      where: { cjOrderNumber: String(orderNumber) },
      include: { order: true }
    })

    if (!cjOrder) {
      return NextResponse.json({ received: true, note: "Order not found in our system" })
    }

    // 3. Process Logic based on Event Type
    if (payload.type === 'ORDER') {
      const status = payload.data.status || payload.data.orderStatus
      
      await prisma.cJOrder.update({
        where: { id: cjOrder.id },
        data: { cjStatus: status, updatedAt: new Date() },
      })
      
      // Sync main order status if it's shipped or completed
      if (status === 'SHIPPED') {
        await prisma.order.update({ where: { id: cjOrder.orderId }, data: { status: 'SHIPPED' } })
      } else if (status === 'COMPLETED' || status === 'FINISHED') {
        await prisma.order.update({ where: { id: cjOrder.orderId }, data: { status: 'DELIVERED' } })
      }
    } 
    else if (payload.type === 'LOGISTIC') {
      const tracking = payload.data.trackingNumber || payload.data.trackNumber
      const carrier = payload.data.logisticName
      
      if (tracking) {
        await prisma.cJOrder.update({
          where: { id: cjOrder.id },
          data: { trackingNumber: tracking, carrier, status: 'SHIPPED', updatedAt: new Date() },
        })
        
        await prisma.order.update({
          where: { id: cjOrder.orderId },
          data: { trackingNumber: tracking, trackingCarrier: carrier, status: 'SHIPPED' }
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ CJ Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

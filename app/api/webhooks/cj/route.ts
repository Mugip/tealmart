// app/api/webhooks/cj/route.ts
// CJ Dropshipping sends POST notifications when order status changes.
// Register this URL in your CJ seller dashboard under Settings → Webhooks.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendShippingConfirmationEmail } from '@/lib/email'

// CJ signs requests with a shared secret — verify it to avoid spoofed webhooks.
// Set CJ_WEBHOOK_SECRET in your Vercel env vars (get it from CJ dashboard).
function verifyCJSignature(req: NextRequest, body: string): boolean {
  const secret = process.env.CJ_WEBHOOK_SECRET
  if (!secret) {
    // No secret configured — allow in dev, warn in prod
    if (process.env.NODE_ENV === 'production') {
      console.warn('[CJ webhook] CJ_WEBHOOK_SECRET not set — requests unverified')
    }
    return true
  }
  const signature = req.headers.get('x-cj-signature') || req.headers.get('signature') || ''
  // CJ uses HMAC-SHA256 of the raw body
  const crypto = require('crypto')
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return signature === expected
}

// Map CJ status codes to our OrderStatus enum
function mapCJStatus(cjStatus: string): string | null {
  const map: Record<string, string> = {
    // CJ order statuses (vary by API version)
    'CREATED':          'PROCESSING',
    'IN_PROCESSING':    'PROCESSING',
    'PROCESSING':       'PROCESSING',
    'SHIPPED':          'SHIPPED',
    'SHIPPING':         'SHIPPED',
    'PARTIALLY_SHIPPED':'SHIPPED',
    'DELIVERED':        'DELIVERED',
    'COMPLETED':        'DELIVERED',
    'CANCELLED':        'CANCELLED',
    'VOID':             'CANCELLED',
    'REFUNDED':         'REFUNDED',
  }
  return map[cjStatus?.toUpperCase()] || null
}

export async function POST(req: NextRequest) {
  let rawBody = ''
  try {
    rawBody = await req.text()
  } catch {
    return NextResponse.json({ error: 'Failed to read body' }, { status: 400 })
  }

  if (!verifyCJSignature(req, rawBody)) {
    console.error('[CJ webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  console.log('[CJ webhook] Received:', JSON.stringify(payload).slice(0, 500))

  // CJ payload shape (v2):
  // { orderNumber, cjOrderId, status, trackingNumber, shippingCarrier, ... }
  const {
    orderNumber,
    cjOrderId,
    status: cjStatus,
    trackingNumber,
    shippingCarrier,
    logisticsTrackingNumber, // alternate field name CJ uses
    logisticsName,           // alternate carrier field
  } = payload

  if (!orderNumber && !cjOrderId) {
    console.warn('[CJ webhook] Missing orderNumber and cjOrderId')
    return NextResponse.json({ ok: true }) // Acknowledge but don't error
  }

  // Find order — try by orderNumber first, then by cjOrderId
  let order = null
  if (orderNumber) {
    order = await prisma.order.findFirst({
      where: { orderNumber: String(orderNumber) },
      include: { items: { include: { product: { select: { title: true, images: true } } } } },
    })
  }
  if (!order && cjOrderId) {
    order = await prisma.order.findFirst({
      where: { cjOrderId: String(cjOrderId) },
      include: { items: { include: { product: { select: { title: true, images: true } } } } },
    })
  }

  if (!order) {
    console.warn(`[CJ webhook] Order not found: orderNumber=${orderNumber}, cjOrderId=${cjOrderId}`)
    return NextResponse.json({ ok: true }) // Acknowledge
  }

  const newStatus = mapCJStatus(cjStatus)
  const finalTrackingNumber = trackingNumber || logisticsTrackingNumber || order.trackingNumber
  const finalCarrier = shippingCarrier || logisticsName || order.trackingCarrier

  // Build update — only change what's provided
  const updateData: any = { updatedAt: new Date() }
  if (newStatus && newStatus !== order.status) updateData.status = newStatus
  if (finalTrackingNumber) updateData.trackingNumber = String(finalTrackingNumber)
  if (finalCarrier) updateData.trackingCarrier = String(finalCarrier)
  if (cjOrderId && !order.cjOrderId) updateData.cjOrderId = String(cjOrderId)

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: updateData,
  })

  console.log(`[CJ webhook] Updated order ${order.orderNumber}: ${order.status} → ${updatedOrder.status}`)

  // Send shipping email when order transitions to SHIPPED
  if (newStatus === 'SHIPPED' && order.status !== 'SHIPPED' && finalTrackingNumber) {
    try {
      await sendShippingConfirmationEmail({
        to: order.email,
        orderNumber: order.orderNumber,
        customerName: order.shippingName,
        trackingNumber: String(finalTrackingNumber),
        carrier: String(finalCarrier || 'your carrier'),
        estimatedDelivery: '7-15 business days',
        items: order.items.map(i => ({ name: i.product.title, quantity: i.quantity })),
        shippingAddress: {
          name: order.shippingName,
          address: order.shippingAddress,
          city: order.shippingCity,
          state: order.shippingState,
          zip: order.shippingZip,
          country: order.shippingCountry,
        },
      })
      console.log(`[CJ webhook] Shipping email sent to ${order.email}`)
    } catch (err) {
      console.error('[CJ webhook] Failed to send shipping email:', err)
    }
  }

  return NextResponse.json({ ok: true, orderId: order.id, newStatus: updatedOrder.status })
}

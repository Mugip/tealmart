// app/api/webhooks/cj/route.ts
//
// CJ pushes POST requests here for order and logistics events.
// Register this URL once via /api/admin/cj/register-webhook (see that file).
//
// Key facts from CJ docs:
//  - No signature header — CJ does not sign requests
//  - Must respond 200 within 3 seconds — do DB work async or keep it fast
//  - Payload shape: { messageId, type, messageType, params }
//  - type = "ORDER" | "LOGISTIC" | "STOCK" | "PRODUCT" | "VARIANT" | "ORDERSPLIT"

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendShippingConfirmationEmail } from '@/lib/email'

// ── CJ Order Status → our OrderStatus ───────────────────────────────────────
//
// CJ statuses observed in the wild (params.orderStatus on ORDER messages):
//   CREATED          → order received by CJ
//   IN_PROCESSING    → being processed / waiting for payment confirmation
//   UNPAID           → CJ waiting for payment from us
//   PAYING           → payment in progress
//   WAITREVIEW       → under review
//   REVIEWED         → reviewed, preparing to ship
//   SHIPPED          → handed to carrier
//   FINISHED         → delivered / completed
//   ABNORMAL         → has an issue
//   CANCELLED / VOID → cancelled
//
function mapOrderStatus(cjStatus: string | undefined): string | null {
  if (!cjStatus) return null
  switch (cjStatus.toUpperCase()) {
    case 'CREATED':
    case 'UNPAID':
    case 'PAYING':
      return 'PROCESSING'
    case 'IN_PROCESSING':
    case 'WAITREVIEW':
    case 'REVIEWED':
      return 'PROCESSING'
    case 'SHIPPED':
      return 'SHIPPED'
    case 'FINISHED':
    case 'COMPLETED':
      return 'DELIVERED'
    case 'CANCELLED':
    case 'VOID':
    case 'ABNORMAL':
      return 'CANCELLED'
    default:
      return null
  }
}

// ── CJ Tracking Status → human label ────────────────────────────────────────
// Used only for logging; actual status mapping uses trackingStatus number.
function trackingStatusToOrderStatus(trackingStatus: number): string | null {
  // 12 = Delivered, 14 = Return, anything 4+ means it's shipped
  if (trackingStatus === 12) return 'DELIVERED'
  if (trackingStatus === 14) return 'CANCELLED' // returned
  if (trackingStatus >= 1)   return 'SHIPPED'   // left warehouse
  return null
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let payload: any

  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { messageId, type, messageType, params } = payload || {}

  console.log(`[CJ webhook] ${type}/${messageType} messageId=${messageId}`)

  // Always acknowledge quickly — CJ retries if we don't respond within 3s
  // We do the actual processing inline since Vercel serverless functions
  // don't support background tasks. All DB ops here are fast single-row updates.

  try {
    if (type === 'ORDER') {
      await handleOrderMessage(params, messageType)
    } else if (type === 'LOGISTIC') {
      await handleLogisticMessage(params)
    } else if (type === 'STOCK') {
      await handleStockMessage(params)
    }
    // PRODUCT, VARIANT, ORDERSPLIT — log and ignore for now
  } catch (err) {
    console.error(`[CJ webhook] Error processing ${type}/${messageType}:`, err)
    // Still return 200 so CJ doesn't keep retrying for our internal errors
  }

  return NextResponse.json({ success: true })
}

// ── ORDER message ─────────────────────────────────────────────────────────────
// Payload: params.orderNumber, params.cjOrderId, params.orderStatus,
//          params.trackNumber, params.logisticName
async function handleOrderMessage(params: any, messageType: string) {
  if (!params) return

  const {
    orderNumber,
    orderNum,        // deprecated field — fallback
    cjOrderId,
    orderStatus,
    trackNumber,
    logisticName,
    trackingUrl,
  } = params

  const ourOrderNumber = orderNumber || orderNum
  if (!ourOrderNumber && !cjOrderId) {
    console.warn('[CJ webhook] ORDER message missing orderNumber and cjOrderId')
    return
  }

  // Find our order
  const order = await prisma.order.findFirst({
    where: ourOrderNumber
      ? { orderNumber: String(ourOrderNumber) }
      : { cjOrderId: String(cjOrderId) },
    include: {
      items: {
        include: { product: { select: { title: true } } },
      },
    },
  })

  if (!order) {
    console.warn(`[CJ webhook] Order not found: orderNumber=${ourOrderNumber} cjOrderId=${cjOrderId}`)
    return
  }

  const newStatus = mapOrderStatus(orderStatus)
  const updateData: Record<string, any> = { updatedAt: new Date() }

  if (newStatus && newStatus !== order.status) {
    updateData.status = newStatus
  }
  if (cjOrderId && !(order as any).cjOrderId) {
    updateData.cjOrderId = String(cjOrderId)
  }
  if (trackNumber && !(order as any).trackingNumber) {
    updateData.trackingNumber = String(trackNumber)
  }
  if (logisticName && !(order as any).trackingCarrier) {
    updateData.trackingCarrier = String(logisticName)
  }

  if (Object.keys(updateData).length > 1) { // more than just updatedAt
    await prisma.order.update({ where: { id: order.id }, data: updateData })
    console.log(`[CJ webhook] Order ${order.orderNumber}: status=${order.status}→${newStatus ?? '(unchanged)'}`)
  }

  // Send shipping email when order first becomes SHIPPED and has a tracking number
  const trackingNum = trackNumber || (order as any).trackingNumber
  if (newStatus === 'SHIPPED' && order.status !== 'SHIPPED' && trackingNum) {
    sendShippingEmail(order, String(trackingNum), String(logisticName || '')).catch(err =>
      console.error('[CJ webhook] Shipping email failed:', err)
    )
  }
}

// ── LOGISTIC message ──────────────────────────────────────────────────────────
// Payload: params.orderId (= cjOrderId), params.trackingNumber,
//          params.trackingStatus (int), params.logisticName, params.trackingUrl
async function handleLogisticMessage(params: any) {
  if (!params) return

  const {
    orderId,          // this is the CJ order id
    trackingNumber,
    trackingStatus,
    logisticName,
    trackingUrl,
    logisticsTrackEvents,
  } = params

  if (!orderId) {
    console.warn('[CJ webhook] LOGISTIC message missing orderId')
    return
  }

  // Find our order by cjOrderId
  const order = await prisma.order.findFirst({
    where: { cjOrderId: String(orderId) },
    include: {
      items: { include: { product: { select: { title: true } } } },
    },
  })

  if (!order) {
    console.warn(`[CJ webhook] Order not found for cjOrderId=${orderId}`)
    return
  }

  const newStatus = trackingStatusToOrderStatus(Number(trackingStatus))
  const updateData: Record<string, any> = { updatedAt: new Date() }

  if (newStatus && newStatus !== order.status) {
    updateData.status = newStatus
  }
  if (trackingNumber) {
    updateData.trackingNumber = String(trackingNumber)
  }
  if (logisticName) {
    updateData.trackingCarrier = String(logisticName)
  }

  if (Object.keys(updateData).length > 1) {
    await prisma.order.update({ where: { id: order.id }, data: updateData })
    console.log(`[CJ webhook] Logistics update for order ${order.orderNumber}: tracking=${trackingNumber} status=${trackingStatus}`)
  }

  // Send shipping email the first time we get a tracking number
  const wasAlreadyShipped = order.status === 'SHIPPED' || order.status === 'DELIVERED'
  if (!wasAlreadyShipped && trackingNumber) {
    sendShippingEmail(order, String(trackingNumber), String(logisticName || '')).catch(err =>
      console.error('[CJ webhook] Shipping email failed:', err)
    )
  }
}

// ── STOCK message ─────────────────────────────────────────────────────────────
// Update product stock in our DB when CJ stock changes.
// params is a map of vid → [{ vid, areaId, areaEn, countryCode, storageNum }]
async function handleStockMessage(params: any) {
  if (!params || typeof params !== 'object') return

  for (const [vid, stockEntries] of Object.entries(params)) {
    if (!Array.isArray(stockEntries)) continue

    // Sum stock across all warehouses for this variant
    const totalStock = (stockEntries as any[]).reduce(
      (sum, entry) => sum + (Number(entry.storageNum) || 0),
      0
    )

    // Find product by externalId (which is the vid/pid)
    try {
      await prisma.product.updateMany({
        where: { externalId: vid },
        data: { stock: totalStock },
      })
      console.log(`[CJ webhook] Stock updated: vid=${vid} stock=${totalStock}`)
    } catch {
      // Variant might not exist in our catalog — ignore
    }
  }
}

// ── Email helper ──────────────────────────────────────────────────────────────
async function sendShippingEmail(order: any, trackingNumber: string, carrier: string) {
  await sendShippingConfirmationEmail({
    to: order.email,
    orderNumber: order.orderNumber,
    customerName: order.shippingName,
    trackingNumber,
    carrier: carrier || 'your carrier',
    estimatedDelivery: '7–15 business days',
    items: order.items.map((i: any) => ({
      name: i.product?.title || 'Item',
      quantity: i.quantity,
    })),
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
      }

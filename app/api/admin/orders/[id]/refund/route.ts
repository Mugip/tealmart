// app/api/admin/orders/[id]/refund/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/adminAuth'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover' as any,
})

async function requireAdmin() {
  const token = cookies().get('admin-auth')?.value
  return !!token && (await verifyAdminToken(token))
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (order.status === 'REFUNDED') {
    return NextResponse.json({ error: 'Order already refunded' }, { status: 400 })
  }

  if (!order.paymentId) {
    return NextResponse.json({ error: 'No payment ID found — cannot issue refund' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const { amount, reason = 'requested_by_customer' } = body

  // paymentId may be a PaymentIntent ID (pi_...) or a Charge ID (ch_...)
  let chargeId = order.paymentId

  // If it's a PaymentIntent, retrieve the charge ID
  if (order.paymentId.startsWith('pi_')) {
    const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentId)
    const latestCharge = paymentIntent.latest_charge
    if (!latestCharge) {
      return NextResponse.json({ error: 'No charge found on this payment intent' }, { status: 400 })
    }
    chargeId = typeof latestCharge === 'string' ? latestCharge : latestCharge.id
  }

  // Issue refund — partial if amount provided, full otherwise
  const refundParams: Stripe.RefundCreateParams = {
    charge: chargeId,
    reason: reason as Stripe.RefundCreateParams.Reason,
  }
  if (amount && amount > 0) {
    refundParams.amount = Math.round(amount * 100) // Stripe uses cents
  }

  const refund = await stripe.refunds.create(refundParams)

  // Update order status
  const updatedOrder = await prisma.order.update({
    where: { id: params.id },
    data: { status: 'REFUNDED', updatedAt: new Date() },
  })

  console.log(`[Refund] Order ${order.orderNumber} refunded. Refund ID: ${refund.id}`)

  return NextResponse.json({
    ok: true,
    refundId: refund.id,
    refundAmount: refund.amount / 100,
    status: refund.status,
    order: updatedOrder,
  })
}

// app/api/orders/[id]/tracking/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { fetchOrderTracking } from '@/lib/cj/tracking'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Make sure the user actually owns this order!
    const order = await prisma.order.findFirst({
      where: { orderNumber: params.id, email: session.user.email! },
      select: { id: true, status: true, trackingNumber: true }
    })

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const cjOrder = await prisma.cJOrder.findUnique({
      where: { orderId: order.id }
    })

    if (!cjOrder || !cjOrder.cjOrderNumber) {
      return NextResponse.json({ events: [], status: order.status, trackingNumber: order.trackingNumber })
    }

    // Fetch live from CJ
    const trackingInfo = await fetchOrderTracking(cjOrder.cjOrderNumber)

    return NextResponse.json({
      events: trackingInfo?.events || [],
      carrier: trackingInfo?.carrier || cjOrder.carrier,
      trackingNumber: trackingInfo?.trackingNumber || cjOrder.trackingNumber,
      status: trackingInfo?.status || cjOrder.status,
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

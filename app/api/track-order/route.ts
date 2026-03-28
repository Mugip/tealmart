// app/api/track-order/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const email = url.searchParams.get('email')
  const orderNumber = url.searchParams.get('orderNumber')

  if (!email || !orderNumber) {
    return NextResponse.json({ error: 'Email and Order Number required' }, { status: 400 })
  }

  const order = await prisma.order.findFirst({
    where: { 
      email: email.toLowerCase().trim(), 
      orderNumber: orderNumber.trim() 
    },
    select: {
      status: true,
      trackingNumber: true,
      trackingCarrier: true,
      createdAt: true,
    }
  })

  if (!order) {
    return NextResponse.json({ error: 'We could not find an order with that email and order number.' }, { status: 404 })
  }

  return NextResponse.json(order)
}

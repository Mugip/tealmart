// app/api/orders/[id]/route.ts
// AUTH ON ALL METHODS

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/adminAuth'
import { sendOrderUpdate } from '@/lib/email/sendOrderUpdate'

async function requireAdmin() {
  const token = cookies().get('admin-auth')?.value
  return !!token && (await verifyAdminToken(token))
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { status, trackingNumber } = await request.json()

    const validStatuses = [
      'PENDING',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'REFUNDED',
    ]

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const currentOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    if (currentOrder.status !== status) {
      try {
        await sendOrderUpdate({
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          customerEmail: updatedOrder.email,
          customerName: updatedOrder.shippingName,
          status,
          trackingNumber: trackingNumber || undefined,
          total: updatedOrder.total,
          items: updatedOrder.items.map((item) => ({
            product: {
              title: item.product.title,
              price: item.product.price,
            },
            quantity: item.quantity,
            price: item.price,
          })),
        })
      } catch (emailError) {
        console.error(
          'Failed to send status update email:',
          emailError
        )
      }
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Order updated successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      order,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to cancel order' },
      { status: 500 }
    )
  }
        }

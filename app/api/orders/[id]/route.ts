// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { sendOrderUpdate } from '@/lib/email/sendOrderUpdate'

// GET - Get order details
export async function GET(
  request: NextRequest,                                 { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })
                                                          if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })                                   }
                                                          return NextResponse.json(order)
  } catch (error) {
    console.error('Get order error:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

// PUT - Update order status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const cookieStore = cookies()
    const adminAuth = cookieStore.get('admin-auth')

    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }                                                 
    const { status, trackingNumber } = await request.json()

    // Validate status
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']
    if (!validStatuses.includes(status)) {                  return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get current order
    const currentOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }                                                 
    // Update order                                       const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    console.log(`✅ Order ${updatedOrder.orderNumber} status updated to ${status}`)

    // Send email notification if status changed
    if (currentOrder.status !== status) {                   try {
        await sendOrderUpdate({                                 orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,                customerEmail: updatedOrder.email,
          customerName: updatedOrder.shippingName,
          status,
          trackingNumber: trackingNumber || undefined,
          total: updatedOrder.total,
          items: updatedOrder.items.map(item => ({                product: {
              title: item.product.title,
              price: item.product.price,                          },
            quantity: item.quantity,                              price: item.price,
          })),
        })
        console.log(`📧 Status update email sent to ${updatedOrder.email}`)
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError)
        // Don't fail the update if email fails             }
    }                                                 
    return NextResponse.json({                              success: true,
      order: updatedOrder,                                  message: 'Order updated successfully'
    })
  } catch (error: any) {
    console.error('Update order error:', error)           return NextResponse.json({
      error: error.message || 'Failed to update order'
    }, { status: 500 })                                 }
}                                                     
// DELETE - Cancel order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const cookieStore = cookies()
    const adminAuth = cookieStore.get('admin-auth')

    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',                                  updatedAt: new Date(),
      },
    })

    console.log(`✅ Order ${order.orderNumber} cancelled`)
                                                          return NextResponse.json({ success: true, order })
  } catch (error: any) {
    console.error('Cancel order error:', error)
    return NextResponse.json({
      error: error.message || 'Failed to cancel order'                                                          }, { status: 500 })
  }
}

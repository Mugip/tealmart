// app/api/admin/notifications/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { getAdminSession } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const token = cookies().get('admin-auth')?.value
  const session = token ? await getAdminSession(token) : null
  
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Check for things requiring Admin attention
    const [pendingDisputes, pendingOrders, failedIngestions] = await Promise.all([
      prisma.dispute.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'PENDING', paymentStatus: 'completed' } }),
      prisma.ingestionLog.count({ where: { status: 'failed' }, take: 1 })
    ])

    const notifications = []

    if (pendingDisputes > 0) {
      notifications.push({
        id: 'disputes',
        message: `${pendingDisputes} new return request(s) need review.`,
        link: '/admin/disputes',
        color: 'red'
      })
    }

    if (pendingOrders > 0) {
      notifications.push({
        id: 'orders',
        message: `${pendingOrders} paid order(s) waiting for fulfillment.`,
        link: '/admin/orders',
        color: 'tiffany'
      })
    }

    if (failedIngestions > 0) {
      notifications.push({
        id: 'logs',
        message: `An ingestion or webhook sync recently failed.`,
        link: '/admin/logs',
        color: 'orange'
      })
    }

    return NextResponse.json({
      count: notifications.length,
      items: notifications
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

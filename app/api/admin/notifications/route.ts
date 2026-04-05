// app/api/admin/notifications/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { getAdminSession } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const token = cookies().get('admin-auth')?.value
    const session = token ? await getAdminSession(token) : null
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pendingDisputes = await prisma.dispute.count({ 
      where: { status: 'PENDING' } 
    }).catch(err => {
      console.error('[NOTIFICATIONS] Error fetching disputes:', err.message);
      return 0;
    });

    const pendingOrders = await prisma.order.count({ 
      where: { 
        status: 'PENDING', 
        paidAt: { not: null } 
      } 
    }).catch(err => {
      console.error('[NOTIFICATIONS] Error fetching orders:', err.message);
      return 0; 
    });

    const failedIngestions = await prisma.ingestionLog.count({ 
      where: { status: 'failed' }, 
      take: 1 
    }).catch(err => {
      console.error('[NOTIFICATIONS] Error fetching logs:', err.message);
      return 0;
    });

    const notifications = []

    if (pendingDisputes > 0) {
      notifications.push({
        id: 'disputes',
        count: pendingDisputes, // ✅ Added raw count for frontend logic
        message: `${pendingDisputes} new return request(s) need review.`,
        link: '/admin/disputes',
      })
    }

    if (pendingOrders > 0) {
      notifications.push({
        id: 'orders',
        count: pendingOrders, // ✅ Added raw count
        message: `${pendingOrders} paid order(s) waiting for fulfillment.`,
        link: '/admin/orders',
      })
    }

    if (failedIngestions > 0) {
      notifications.push({
        id: 'logs',
        count: failedIngestions, // ✅ Added raw count
        message: `An ingestion or webhook sync recently failed.`,
        link: '/admin/logs',
      })
    }

    return NextResponse.json({
      total: notifications.length,
      items: notifications
    })

  } catch (error: any) {
    console.error('[CRITICAL_NOTIFICATIONS_ERROR]', error.message)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

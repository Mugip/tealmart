// app/api/admin/notifications/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { getAdminSession } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('[NOTIFICATIONS] API called. Verifying session...');
    
    const token = cookies().get('admin-auth')?.value
    const session = token ? await getAdminSession(token) : null
    
    if (!session) {
      console.warn('[NOTIFICATIONS] Unauthorized access attempt.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[NOTIFICATIONS] Session valid for ${session.email}. Fetching data...`);

    // 1. Fetch data with safe fallbacks in case tables are missing/empty
    const pendingDisputes = await prisma.dispute.count({ 
      where: { status: 'PENDING' } 
    }).catch(err => {
      console.error('[NOTIFICATIONS] Error fetching disputes:', err.message);
      return 0; // Fallback to 0 if table fails
    });

    const pendingOrders = await prisma.order.count({ 
      where: { status: 'PENDING', paymentStatus: 'completed' } 
    }).catch(err => {
      console.error('[NOTIFICATIONS] Error fetching orders:', err.message);
      return 0; // Fallback
    });

    const failedIngestions = await prisma.ingestionLog.count({ 
      where: { status: 'failed' }, 
      take: 1 
    }).catch(err => {
      console.error('[NOTIFICATIONS] Error fetching logs:', err.message);
      return 0; // Fallback
    });

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

    console.log(`[NOTIFICATIONS] Successfully returning ${notifications.length} alerts.`);

    return NextResponse.json({
      count: notifications.length,
      items: notifications
    })

  } catch (error: any) {
    // 🚨 This will finally print the exact crash reason to your Vercel logs!
    console.error('[CRITICAL_NOTIFICATIONS_ERROR]', error.message, error.stack)
    
    return NextResponse.json({ 
      error: 'Failed to fetch notifications',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 })
  }
}

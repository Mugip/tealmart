// app/api/admin/cj/sync-tracking/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cjClient } from '@/lib/cj/client'
import { cookies } from 'next/headers'
import { getAdminSession } from '@/lib/adminAuth'

export const maxDuration = 60; // Allow 60 seconds for bulk syncing
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1. Verify Admin Permissions
  const token = cookies().get('admin-auth')?.value
  const session = token ? await getAdminSession(token) : null
  
  if (!session || (!session.permissions.includes('all') && !session.permissions.includes('orders'))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    // 2. Find active CJ Orders that haven't been delivered or cancelled yet
    const activeOrders = await prisma.cJOrder.findMany({
      where: {
        status: { notIn: ['DELIVERED', 'CANCELLED', 'REFUNDED'] },
        cjOrderNumber: { not: '' }
      }
    })

    if (activeOrders.length === 0) {
      return NextResponse.json({ message: "No active orders require syncing." })
    }

    let updatedCount = 0;
    const logs = [];

    // 3. Check CJ API for tracking updates
    for (const order of activeOrders) {
      try {
        const tracking = await cjClient.getTracking(order.cjOrderNumber)
        
        if (tracking && tracking.trackingNumber && tracking.trackingNumber !== order.trackingNumber) {
          // Update CJOrder table
          await prisma.cJOrder.update({
            where: { id: order.id },
            data: { 
              trackingNumber: tracking.trackingNumber, 
              carrier: tracking.carrier,
              status: tracking.status === 'DELIVERED' ? 'DELIVERED' : 'SHIPPED',
              updatedAt: new Date()
            }
          })

          // Update main Order table so customer sees it
          await prisma.order.update({
            where: { id: order.orderId },
            data: { 
              trackingNumber: tracking.trackingNumber, 
              trackingCarrier: tracking.carrier,
              status: tracking.status === 'DELIVERED' ? 'DELIVERED' : 'SHIPPED',
            }
          })

          updatedCount++;
          logs.push(`Synced tracking for ${order.cjOrderNumber}: ${tracking.trackingNumber}`);
        }
      } catch (err: any) {
        console.error(`Failed to sync ${order.cjOrderNumber}:`, err.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${updatedCount} orders.`,
      updatedCount,
      logs
    })

  } catch (error: any) {
    console.error('[CJ_SYNC_ERROR]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/adminAuth'

async function requireAdmin() {
  const token = cookies().get('admin-auth')?.value
  return !!token && (await verifyAdminToken(token))
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    let settings = await (prisma as any).adminSettings.findFirst()
    if (!settings) {
      settings = await (prisma as any).adminSettings.create({ data: {} })
    }
    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const data = await request.json()

    const allowedFields = [
      'storeName', 'storeEmail', 'storePhone', 'currency',
      'orderNotifications', 'lowStockAlerts', 'dailyReports', 'customerMessages',
      'maintenanceMode', 'allowGuestCheckout', 'requireEmailVerification', 'autoApproveReviews',
    ]

    const updateData: Record<string, any> = {}
    for (const field of allowedFields) {
      if (data[field] !== undefined) updateData[field] = data[field]
    }

    let settings = await (prisma as any).adminSettings.findFirst()
    if (settings) {
      settings = await (prisma as any).adminSettings.update({
        where: { id: settings.id },
        data: updateData,
      })
    } else {
      settings = await (prisma as any).adminSettings.create({ data: updateData })
    }

    // ── Write maintenance flag into a cookie so Edge middleware can read it ──
    // Middleware cannot do self-fetch on Vercel Edge — the cookie is the only
    // reliable cross-runtime signal between the settings API and middleware.
    const cookieStore = cookies()
    const maintenanceOn = updateData.maintenanceMode === true ||
      (updateData.maintenanceMode === undefined && settings.maintenanceMode === true)

    if (maintenanceOn) {
      cookieStore.set('tealmart-maintenance', '1', {
        httpOnly: false,   // Must be readable by client JS too (for the banner)
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year — cleared explicitly when turned off
      })
    } else {
      cookieStore.delete('tealmart-maintenance')
    }

    return NextResponse.json({ success: true, settings })
  } catch (error: any) {
    console.error('Save settings error:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
        }

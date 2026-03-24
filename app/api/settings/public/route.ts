// app/api/settings/public/route.ts
// Kept for backwards compatibility — the banner and middleware now read the
// tealmart-maintenance cookie directly and no longer need this endpoint.
// Safe to leave in place; it does no harm.
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const settings = await (prisma as any).adminSettings.findFirst({
      select: { maintenanceMode: true },
    })
    return NextResponse.json({ maintenanceMode: settings?.maintenanceMode ?? false })
  } catch {
    return NextResponse.json({ maintenanceMode: false })
  }
}

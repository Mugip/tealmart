// app/api/settings/public/route.ts
// Unauthenticated — only exposes the minimum the middleware needs.
// Never expose sensitive settings (email, passwords, etc.) here.
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs' // Prisma needs Node, not Edge

export async function GET() {
  try {
    const settings = await (prisma as any).adminSettings.findFirst({
      select: { maintenanceMode: true },
    })
    return NextResponse.json(
      { maintenanceMode: settings?.maintenanceMode ?? false },
      {
        headers: {
          // Short cache — middleware refreshes every 30s anyway
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=10',
        },
      }
    )
  } catch {
    // If AdminSettings table doesn't exist yet, default to not in maintenance
    return NextResponse.json({ maintenanceMode: false })
  }
}

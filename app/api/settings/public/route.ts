// app/api/settings/public/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// ✅ Force dynamic so Next.js never caches this response!
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const settings = await prisma.adminSettings.findFirst({
      select: { maintenanceMode: true },
    })
    return NextResponse.json({ maintenanceMode: settings?.maintenanceMode ?? false })
  } catch {
    return NextResponse.json({ maintenanceMode: false })
  }
}

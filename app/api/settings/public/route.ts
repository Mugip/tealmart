// app/api/settings/public/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const settings = await prisma.adminSettings.findFirst({
      select: { 
        maintenanceMode: true,
        allowGuestCheckout: true
      },
    })
    
    return NextResponse.json({ 
      maintenanceMode: settings?.maintenanceMode ?? false,
      allowGuestCheckout: settings?.allowGuestCheckout ?? true // Defaults to true if missing
    })
  } catch {
    return NextResponse.json({ 
      maintenanceMode: false, 
      allowGuestCheckout: true 
    })
  }
}

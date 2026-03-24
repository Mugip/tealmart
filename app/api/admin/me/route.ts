// app/api/admin/me/route.ts

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  getAdminEmailFromToken,
  verifyAdminToken,
} from '@/lib/adminAuth'

export async function GET() {
  const cookieStore = cookies()
  const token = cookieStore.get('admin-auth')?.value

  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const email = await getAdminEmailFromToken(token)

  return NextResponse.json({
    email: email ?? process.env.ADMIN_EMAIL ?? 'admin@tealmart.com',
  })
}

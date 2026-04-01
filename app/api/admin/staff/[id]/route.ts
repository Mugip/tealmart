// app/api/admin/staff/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { getAdminSession } from '@/lib/adminAuth'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = cookies().get('admin-auth')?.value
  const session = token ? await getAdminSession(token) : null
  
  if (!session || !session.permissions.includes('all')) {
    return NextResponse.json({ error: 'Only Super Admins can delete staff' }, { status: 401 })
  }

  try {
    await prisma.staff.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 })
  }
}

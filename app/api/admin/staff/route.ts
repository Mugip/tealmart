// app/api/admin/staff/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { getAdminSession } from '@/lib/adminAuth'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const token = cookies().get('admin-auth')?.value
  const session = token ? await getAdminSession(token) : null
  
  if (!session || (!session.permissions.includes('all') && !session.permissions.includes('staff'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const staff = await prisma.staff.findMany({
    select: { id: true, name: true, email: true, permissions: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  })
  
  return NextResponse.json(staff)
}

export async function POST(req: NextRequest) {
  const token = cookies().get('admin-auth')?.value
  const session = token ? await getAdminSession(token) : null
  
  if (!session || !session.permissions.includes('all')) {
    return NextResponse.json({ error: 'Only Super Admins can create staff' }, { status: 401 })
  }

  try {
    const { name, email, password, permissions } = await req.json()

    if (!name || !email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const exists = await prisma.staff.findUnique({ where: { email: email.toLowerCase() } })
    if (exists) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })

    const hashedPassword = await bcrypt.hash(password, 10)

    const newStaff = await prisma.staff.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        permissions: permissions || [],
      },
      select: { id: true, name: true, email: true, permissions: true, isActive: true }
    })

    return NextResponse.json(newStaff)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

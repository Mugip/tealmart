// app/api/admin/login/route.ts
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { createAdminToken } from '@/lib/adminAuth'
import { prisma } from '@/lib/db' // ✅ Import Prisma

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@tealmart.com'
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH

    // 1. CHECK SUPER ADMIN (from .env)
    if (email === ADMIN_EMAIL) {
      if (!ADMIN_PASSWORD_HASH) {
        return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
      }

      const passwordMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH)
      if (passwordMatch) {
        const token = await createAdminToken(email, 'admin', ['all']) // Super admin gets 'all'
        
        cookies().set('admin-auth', token, {
          httpOnly: true, secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
        })
        return NextResponse.json({ success: true })
      }
    }

    // 2. CHECK STAFF ACCOUNTS (from Database)
    const staff = await prisma.staff.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (staff && staff.isActive) {
      const passwordMatch = await bcrypt.compare(password, staff.password)
      if (passwordMatch) {
        const token = await createAdminToken(staff.email, 'staff', staff.permissions)
        
        cookies().set('admin-auth', token, {
          httpOnly: true, secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
        })
        return NextResponse.json({ success: true })
      }
    }

    // Fallback if neither matched
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  } catch (error: any) {
    console.error('💥 Login error:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

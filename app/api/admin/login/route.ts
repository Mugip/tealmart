// app/api/admin/login/route.ts
// SECURE WITH JWT

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { createAdminToken } from '@/lib/adminAuth'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@tealmart.com'
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH

    if (email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (!ADMIN_PASSWORD_HASH) {
      console.error('❌ ADMIN_PASSWORD_HASH not set in environment variables!')

      return NextResponse.json(
        { error: 'Server configuration error. Contact administrator.' },
        { status: 500 }
      )
    }

    const passwordMatch = await bcrypt.compare(
      password,
      ADMIN_PASSWORD_HASH
    )

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create signed JWT token
    const token = await createAdminToken(email)

    // Set secure httpOnly cookie with JWT
    const cookieStore = cookies()
    cookieStore.set('admin-auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('💥 Login error:', error.message)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
    }

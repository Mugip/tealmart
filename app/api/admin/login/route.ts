// app/api/admin/login/route.ts - SECURE WITH JWT
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { createAdminToken } from '@/lib/adminAuth'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Get admin credentials from environment variables
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@tealmart.com'
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH

    console.log('🔐 Login attempt:', { email })

    // Validate credentials
    if (email !== ADMIN_EMAIL) {
      console.log('❌ Email mismatch')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (!ADMIN_PASSWORD_HASH) {
      console.error('❌ ADMIN_PASSWORD_HASH not set!')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const passwordMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH)

    if (!passwordMatch) {
      console.log('❌ Password mismatch')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('✅ Login successful')

    // Create signed JWT token
    const token = await createAdminToken(email)

    // Set secure cookie with JWT
    const cookieStore = cookies()
    cookieStore.set('admin-auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('💥 Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

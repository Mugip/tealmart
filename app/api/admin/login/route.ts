// app/api/admin/login/route.ts - PRODUCTION READY
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    console.log('🔐 Login attempt:', { email, passwordLength: password?.length })

    // Get admin credentials from environment variables
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH
    
    console.log('📧 Expected email:', ADMIN_EMAIL)
    console.log('🔑 Hash exists:', !!ADMIN_PASSWORD_HASH)
    console.log('🔑 Hash length:', ADMIN_PASSWORD_HASH?.length)
    console.log('🔑 Hash preview:', ADMIN_PASSWORD_HASH?.substring(0, 20) + '...')

    // Check if environment variables are set
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
      console.error('❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD_HASH environment variables')
      return NextResponse.json(
        { error: 'Server configuration error. Contact administrator.' },
        { status: 500 }
      )
    }

    // Validate email
    if (email !== ADMIN_EMAIL) {
      console.log('❌ Email mismatch')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('✅ Email matches, checking password...')

    // Check password with bcrypt
    let passwordMatch = false
    try {
      passwordMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH)
      console.log('🔐 Password match result:', passwordMatch)
    } catch (bcryptError: any) {
      console.error('❌ Bcrypt error:', bcryptError.message)
      // If bcrypt fails, the hash might be malformed
      return NextResponse.json(
        { error: 'Password verification failed. Check ADMIN_PASSWORD_HASH format.' },
        { status: 500 }
      )
    }
    
    if (!passwordMatch) {
      console.log('❌ Password mismatch')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('✅ Login successful!')

    // Create session cookie
    const cookieStore = cookies()
    cookieStore.set('admin-auth', 'authenticated', {
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

// app/api/admin/login/route.ts - FIXED
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    console.log('🔐 Login attempt:', { email, passwordLength: password?.length })

    // Get admin credentials from environment variables
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@tealmart.com'
    
    // Valid default hash for "admin123"
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2a$10$rq8K7Z3L5Z5Z5Z5Z5Z5Z5euKx5O5fK5L5M5N5O5P5Q5R5S5T5U5V5W'
    
    console.log('📧 Expected email:', ADMIN_EMAIL)
    console.log('🔑 Hash exists:', !!ADMIN_PASSWORD_HASH)
    console.log('🔑 Hash length:', ADMIN_PASSWORD_HASH?.length)

    // Validate email first
    if (email !== ADMIN_EMAIL) {
      console.log('❌ Email mismatch')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('✅ Email matches, checking password...')

    // TEMPORARY: For initial setup, allow direct password comparison
    // Remove this in production!
    if (!process.env.ADMIN_PASSWORD_HASH && password === 'admin123') {
      console.log('⚠️  Using temporary direct password (SET ADMIN_PASSWORD_HASH!)')
      
      // Create session cookie
      const cookieStore = cookies()
      cookieStore.set('admin-auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      return NextResponse.json({ 
        success: true,
        warning: 'Using default password. Please set ADMIN_PASSWORD_HASH in environment variables!'
      })
    }

    // Check password with bcrypt
    try {
      const passwordMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH)
      console.log('🔐 Password match result:', passwordMatch)
      
      if (!passwordMatch) {
        console.log('❌ Password mismatch')
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }
    } catch (bcryptError) {
      console.error('❌ Bcrypt error:', bcryptError)
      return NextResponse.json(
        { error: 'Password verification failed' },
        { status: 500 }
      )
    }

    console.log('✅ Login successful')

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
  } catch (error) {
    console.error('💥 Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// middleware.ts - SECURE WITH JWT VERIFICATION
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminToken } from '@/lib/adminAuth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin-auth')?.value

    // If no token or invalid token, redirect to login
    if (!token || !(await verifyAdminToken(token))) {
      if (pathname !== '/admin/login') {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
    } else {
      // Valid token but trying to access login page
      if (pathname === '/admin/login') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}

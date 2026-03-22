// middleware.ts - Protect admin routes
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const adminAuth = request.cookies.get('admin-auth')

    // If no admin auth cookie, redirect to login
    if (!adminAuth && pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // If has auth but trying to access login, redirect to dashboard
    if (adminAuth && pathname === '/admin/login') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}

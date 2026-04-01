// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'

const locales = ['en', 'fr', 'es', 'sw']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  // ── 1. 🔐 ADMIN & RBAC CHECK ──
  const adminToken = request.cookies.get('admin-auth')?.value
  const adminSession = adminToken ? await getAdminSession(adminToken) : null
  const isAdmin = !!adminSession

  if (pathname.startsWith('/admin')) {
    if (!isAdmin && pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Strict Role-Based Access Control (RBAC) Enforced on URLs
    if (isAdmin && pathname !== '/admin' && pathname !== '/admin/login') {
      const requiredPermission = pathname.replace('/admin/', '').split('/')[0]
      const hasAccess = 
        adminSession.permissions.includes('all') || 
        adminSession.permissions.includes(requiredPermission)

      if (!hasAccess) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }

    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // ── 2. 🌍 i18n DETECTION ──
  let locale = request.cookies.get('NEXT_LOCALE')?.value
  if (!locale) {
    const acceptLang = request.headers.get('accept-language')
    if (acceptLang) {
      const detected = acceptLang.split(',')[0].split('-')[0]
      locale = locales.includes(detected) ? detected : 'en'
    } else {
      locale = 'en'
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  if (!request.cookies.get('NEXT_LOCALE')) {
    response.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 31536000 })
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.svg).*)'],
}

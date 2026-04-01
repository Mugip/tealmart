// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'

let _settingsCache: any = null
let _settingsCacheExpiry: number = 0

const locales = ['en', 'fr', 'es', 'sw']

async function getPublicSettings(request: NextRequest) {
  const now = Date.now()
  if (now < _settingsCacheExpiry && _settingsCache) return _settingsCache

  try {
    const url = new URL('/api/settings/public', request.url)
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (res.ok) {
      _settingsCache = await res.json()
    }
  } catch (err) {}

  _settingsCacheExpiry = now + 10000
  return _settingsCache || { maintenanceMode: false, allowGuestCheckout: true } // Default open
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  const adminToken = request.cookies.get('admin-auth')?.value
  const adminSession = adminToken ? await getAdminSession(adminToken) : null
  const isAdmin = !!adminSession

  // 1. ADMIN CHECK
  if (pathname.startsWith('/admin')) {
    if (!isAdmin && pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    if (isAdmin && pathname !== '/admin' && pathname !== '/admin/login') {
      const requiredPermission = pathname.replace('/admin/', '').split('/')[0]
      const hasAccess = adminSession.permissions.includes('all') || adminSession.permissions.includes(requiredPermission)
      if (!hasAccess) return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  const isExempt = pathname.startsWith('/api/') || pathname.startsWith('/maintenance') || 
                   pathname.startsWith('/auth/') || pathname.includes('_next') ||
                   pathname.includes('favicon.ico') || pathname.includes('logo.svg')

  const settings = await getPublicSettings(request)

  // 2. MAINTENANCE MODE
  if (!isExempt && !isAdmin) {
    if (settings.maintenanceMode) {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
  }

  // 3. GUEST CHECKOUT PROTECTION
  if (pathname === '/checkout' && !isExempt) {
    const sessionToken = request.cookies.get('next-auth.session-token') || request.cookies.get('__Secure-next-auth.session-token')
    
    // If they have no session, and guest checkout is FALSE, boot them to login
    if (!sessionToken && settings.allowGuestCheckout === false) {
      return NextResponse.redirect(new URL('/auth/signin?callbackUrl=/checkout', request.url))
    }
  }

  // 4. i18n
  let locale = request.cookies.get('NEXT_LOCALE')?.value
  if (!locale) {
    const acceptLang = request.headers.get('accept-language')
    locale = acceptLang ? (locales.includes(acceptLang.split(',')[0].split('-')[0]) ? acceptLang.split(',')[0].split('-')[0] : 'en') : 'en'
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

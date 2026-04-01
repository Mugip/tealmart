// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'

let _maintenanceCache: boolean = false
let _maintenanceCacheExpiry: number = 0

const locales = ['en', 'fr', 'es', 'sw']

async function getMaintenanceMode(request: NextRequest): Promise<boolean> {
  // 1. Admin Override Cookie (Fast path for admins)
  const maintenanceCookie = request.cookies.get('tealmart-maintenance')?.value
  if (maintenanceCookie === '1') return true

  // 2. Memory Cache (Prevents spamming the DB on every single image/page load)
  const now = Date.now()
  if (now < _maintenanceCacheExpiry) return _maintenanceCache

  // 3. ✅ FIXED: Universal Database Fallback for Visitors
  try {
    const url = new URL('/api/settings/public', request.url)
    const res = await fetch(url, { next: { revalidate: 0 } })
    
    if (res.ok) {
      const data = await res.json()
      _maintenanceCache = data.maintenanceMode === true
    }
  } catch (err) {
    // Silent fail, keep previous cache state
  }

  _maintenanceCacheExpiry = now + 10000 // Cache for 10 seconds
  return _maintenanceCache
}

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

  // ── 2. 🏗️ MAINTENANCE MODE ──
  const isExempt = 
    pathname.startsWith('/api/') || pathname.startsWith('/maintenance') || 
    pathname.startsWith('/auth/') || pathname.includes('_next') ||
    pathname.includes('favicon.ico') || pathname.includes('logo.svg')

  if (!isExempt && !isAdmin) {
    const maintenance = await getMaintenanceMode(request)
    if (maintenance) {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
  }

  // ── 3. 🌍 i18n DETECTION ──
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

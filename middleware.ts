// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth' // ✅ Changed to getAdminSession

let _maintenanceCache: boolean = false
let _maintenanceCacheExpiry: number = 0

const locales = ['en', 'fr', 'es', 'sw']

async function getMaintenanceMode(request: NextRequest): Promise<boolean> {
  const maintenanceCookie = request.cookies.get('tealmart-maintenance')?.value
  if (maintenanceCookie === '1') return true

  const now = Date.now()
  if (now < _maintenanceCacheExpiry) return _maintenanceCache

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) return false
    
    const url = `${supabaseUrl}/rest/v1/AdminSettings?select=maintenanceMode&limit=1`
    const res = await fetch(url, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Accept: 'application/json' },
      next: { revalidate: 0 }
    })
    
    if (res.ok) {
      const rows = await res.json()
      if (rows && rows.length > 0) {
        _maintenanceCache = rows[0].maintenanceMode === true
      }
    }
  } catch (err) { }

  _maintenanceCacheExpiry = now + 10000
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

    // ✅ NEW: Strict Role-Based Access Control (RBAC) Enforced on URLs
    if (isAdmin && pathname !== '/admin' && pathname !== '/admin/login') {
      const requiredPermission = pathname.replace('/admin/', '').split('/')[0] // e.g., 'orders' from '/admin/orders/123'
      
      const hasAccess = 
        adminSession.permissions.includes('all') || 
        adminSession.permissions.includes(requiredPermission)

      if (!hasAccess) {
        // Redirect unauthorized staff back to the main admin dashboard
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

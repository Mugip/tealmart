// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminToken } from '@/lib/adminAuth'

let _maintenanceCache: boolean = false
let _maintenanceCacheExpiry: number = 0

// Supported languages
const locales = ['en', 'fr', 'es', 'sw']

async function getMaintenanceMode(request: NextRequest): Promise<boolean> {
  // 1. ⚡ FAST CHECK: Check for the maintenance cookie first (Set by your settings API)
  const maintenanceCookie = request.cookies.get('tealmart-maintenance')?.value
  if (maintenanceCookie === '1') return true

  // 2. 🧠 CACHED CHECK: Check local memory cache
  const now = Date.now()
  if (now < _maintenanceCacheExpiry) return _maintenanceCache

  // 3. 🗄️ DB FALLBACK: Fetch from Supabase
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) return false
    
    // Note: We use AdminSettings (PascalCase) to match your Prisma schema
    const url = `${supabaseUrl}/rest/v1/AdminSettings?select=maintenanceMode&limit=1`
    const res = await fetch(url, {
      headers: { 
        apikey: supabaseKey, 
        Authorization: `Bearer ${supabaseKey}`, 
        Accept: 'application/json' 
      },
      next: { revalidate: 0 } // Ensure we don't cache stale "OFF" states
    })
    
    if (res.ok) {
      const rows = await res.json()
      // Strict check: ensures we actually got a row back
      if (rows && rows.length > 0) {
        _maintenanceCache = rows[0].maintenanceMode === true
      }
    }
  } catch (err) { 
    console.error('CRITICAL: Middleware maintenance fetch failed', err) 
  }

  _maintenanceCacheExpiry = now + 10000 // 10s TTL
  return _maintenanceCache
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestHeaders = new Headers(request.headers)
  
  // Set pathname header for Server Components
  requestHeaders.set('x-pathname', pathname)

  // ── 1. 🔐 ADMIN CHECK (Priority) ──
  const adminToken = request.cookies.get('admin-auth')?.value
  const isAdmin = adminToken ? await verifyAdminToken(adminToken) : false

  // If trying to access /admin
  if (pathname.startsWith('/admin')) {
    if (!isAdmin && pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    return response
  }

  // ── 2. 🏗️ MAINTENANCE MODE ──
  // Rule: If Maintenance is ON and user is NOT an Admin and path is NOT exempt
  const isExempt = 
    pathname.startsWith('/api/') || 
    pathname.startsWith('/maintenance') || 
    pathname.startsWith('/auth/') ||
    pathname.includes('_next') ||
    pathname.includes('favicon.ico') ||
    pathname.includes('logo.svg')

  if (!isExempt && !isAdmin) {
    const maintenance = await getMaintenanceMode(request)
    if (maintenance) {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
  }

  // ── 3. 🌍 i18n DETECTION (Passive) ──
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

  // Final Response logic
  const response = NextResponse.next({
    request: { headers: requestHeaders }
  })

  // Set locale cookie if missing
  if (!request.cookies.get('NEXT_LOCALE')) {
    response.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 31536000 })
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.svg
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.svg).*)',
  ],
    }

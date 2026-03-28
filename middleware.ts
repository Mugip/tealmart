// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server' // FIXED: Changed from 'next/request'
import { verifyAdminToken } from '@/lib/adminAuth'

// ── Maintenance mode cache (Local memory cache for Edge runtime) ─────────────
let _maintenanceCache: boolean = false
let _maintenanceCacheExpiry: number = 0

async function getMaintenanceMode(): Promise<boolean> {
  const now = Date.now()
  // Return cached value if it's less than 10 seconds old
  if (now < _maintenanceCacheExpiry) return _maintenanceCache

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      // If environment variables are missing, assume maintenance is OFF 
      // but cache this result for 1 minute to reduce log noise
      _maintenanceCache = false
      _maintenanceCacheExpiry = now + 60000
      return false
    }

    // Using the REST API of Supabase to check the toggle
    const url = `${supabaseUrl}/rest/v1/AdminSettings?select=maintenanceMode&limit=1`
    const res = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json',
      },
      next: { revalidate: 10 } // Hint for Vercel Data Cache
    })

    if (res.ok) {
      const rows = await res.json()
      _maintenanceCache = rows[0]?.maintenanceMode === true
    }
  } catch (err) {
    console.error('[MAINTENANCE_FETCH_ERROR]', err)
    // Fallback to false so the site doesn't break if the DB is down
    _maintenanceCache = false
  }

  _maintenanceCacheExpiry = now + 10000 // 10s local TTL
  return _maintenanceCache
}

// ── Main Middleware ──────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Create standard request headers to pass pathname to Server Components
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  // 1. 🔐 Admin Route Security
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin-auth')?.value
    const isValid = token ? await verifyAdminToken(token) : false

    // Redirect to login if trying to access admin without valid JWT
    if (!isValid && pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    
    // Redirect to dashboard if already logged in and visiting login page
    if (isValid && pathname === '/admin/login') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    
    return NextResponse.next({
      request: { headers: requestHeaders }
    })
  }

  // 2. 🏗️ Maintenance Mode Logic
  // Exempt essential paths: API routes, Maintenance page itself, Admin panel, and static assets
  const isExempt = 
    pathname.startsWith('/api/') || 
    pathname.startsWith('/maintenance') || 
    pathname.startsWith('/admin') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') // matches favicon.ico, logo.svg, etc.

  if (!isExempt) {
    const maintenance = await getMaintenanceMode()
    if (maintenance) {
      // Redirect to the maintenance landing page
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders }
  })
}

// Ensure the middleware only runs on relevant paths to save execution time
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

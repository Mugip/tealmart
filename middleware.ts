// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminToken } from '@/lib/adminAuth'
import createMiddleware from 'next-intl/middleware'

// 1. Setup Internationalization Middleware
const i18nMiddleware = createMiddleware({
  locales: ['en', 'fr', 'es', 'sw'],
  defaultLocale: 'en',
  // ✅ IMPORTANT: This keeps your URLs exactly as they are (e.g., /cart stays /cart)
  // while still allowing the code to detect the user's language.
  localePrefix: 'never' 
})

let _maintenanceCache: boolean = false
let _maintenanceCacheExpiry: number = 0

async function getMaintenanceMode(): Promise<boolean> {
  const now = Date.now()
  if (now < _maintenanceCacheExpiry) return _maintenanceCache
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) return false
    
    const url = `${supabaseUrl}/rest/v1/AdminSettings?select=maintenanceMode&limit=1`
    const res = await fetch(url, {
      headers: { 
        apikey: supabaseKey, 
        Authorization: `Bearer ${supabaseKey}`, 
        Accept: 'application/json' 
      },
    })
    
    if (res.ok) {
      const rows = await res.json()
      _maintenanceCache = rows[0]?.maintenanceMode === true
    }
  } catch (err) { 
    console.error('Maintenance check failed:', err) 
  }
  _maintenanceCacheExpiry = now + 10000
  return _maintenanceCache
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── A. ADMIN SECURITY ──
  // Check admin routes first. We use NextResponse.next() here to skip i18n for admin.
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin-auth')?.value
    const isValid = token ? await verifyAdminToken(token) : false
    
    if (!isValid && pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    
    const response = NextResponse.next()
    response.headers.set('x-pathname', pathname)
    return response
  }

  // ── B. MAINTENANCE MODE ──
  // Don't block API, maintenance page, or static files
  const isExempt = 
    pathname.startsWith('/api/') || 
    pathname.startsWith('/maintenance') || 
    pathname.includes('.')

  if (!isExempt) {
    const maintenance = await getMaintenanceMode()
    if (maintenance) {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
  }

  // ── C. i18n & STOREFRONT ──
  // This handles the language detection and storefront routing
  const response = i18nMiddleware(request)
  
  // ✅ IMPORTANT: Pass the pathname to our ConditionalShell (Header/Footer logic)
  response.headers.set('x-pathname', pathname)
  
  return response
}

export const config = {
  // Match all paths except for api, _next, and static assets
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.svg).*)']
}

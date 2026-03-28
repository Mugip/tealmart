// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminToken } from '@/lib/adminAuth'
import createMiddleware from 'next-intl/middleware'

// 1. Setup Internationalization Middleware
const i18nMiddleware = createMiddleware({
  locales: ['en', 'fr', 'es', 'sw'], // English, French, Spanish, Swahili
  defaultLocale: 'en'
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
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Accept: 'application/json' },
    })
    if (res.ok) {
      const rows = await res.json()
      _maintenanceCache = rows[0]?.maintenanceMode === true
    }
  } catch (err) { console.error(err) }
  _maintenanceCacheExpiry = now + 10000
  return _maintenanceCache
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // A. Admin Security First
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin-auth')?.value
    const isValid = token ? await verifyAdminToken(token) : false
    if (!isValid && pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // B. Maintenance Mode
  const isExempt = pathname.startsWith('/api/') || pathname.startsWith('/maintenance') || pathname.includes('.')
  if (!isExempt) {
    const maintenance = await getMaintenanceMode()
    if (maintenance) {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
  }

  // C. Execute i18n Redirection
  return i18nMiddleware(request)
}

export const config = {
  // Pattern matches everything except static files and api
  matcher: ['/((?!api|_next|.*\\..*).*)']
}

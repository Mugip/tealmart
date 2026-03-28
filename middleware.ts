// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/request'
import { verifyAdminToken } from '@/lib/adminAuth'

let _maintenanceCache: boolean = false
let _maintenanceCacheExpiry: number = 0

async function getMaintenanceMode(): Promise<boolean> {
  const now = Date.now()
  if (now < _maintenanceCacheExpiry) return _maintenanceCache

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      _maintenanceCacheExpiry = now + 60000 // Cache "off" for 1 min if misconfigured
      return false
    }

    const url = `${supabaseUrl}/rest/v1/AdminSettings?select=maintenanceMode&limit=1`
    const res = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json',
      },
    })

    if (res.ok) {
      const rows = await res.json()
      _maintenanceCache = rows[0]?.maintenanceMode === true
    }
  } catch (err) {
    console.error('[MAINTENANCE_FETCH_ERROR]', err)
  }

  _maintenanceCacheExpiry = now + 10000 // 10s local cache
  return _maintenanceCache
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  // 1. Admin Security
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin-auth')?.value
    const isValid = token ? await verifyAdminToken(token) : false

    if (!isValid && pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    if (isValid && pathname === '/admin/login') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // 2. Maintenance Mode
  const isExempt = 
    pathname.startsWith('/api/') || 
    pathname.startsWith('/maintenance') || 
    pathname.startsWith('/admin') ||
    pathname.startsWith('/_next/')

  if (!isExempt) {
    const maintenance = await getMaintenanceMode()
    if (maintenance) {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)'],
}

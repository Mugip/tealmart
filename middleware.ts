// middleware.ts
// Three responsibilities:
//   1. Inject x-pathname header so ConditionalShell suppresses store Header/Footer on /admin
//   2. Protect /admin routes with JWT verification
//   3. Enforce maintenance mode — redirects all store visitors to /maintenance
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminToken } from '@/lib/adminAuth'

// Module-level cache so we don't hit the DB on every request
let maintenanceCacheValue = false
let maintenanceCacheExpiry = 0

async function isMaintenanceMode(origin: string): Promise<boolean> {
  const now = Date.now()
  if (now < maintenanceCacheExpiry) return maintenanceCacheValue

  try {
    const res = await fetch(`${origin}/api/settings/public`, { cache: 'no-store' })
    maintenanceCacheValue = res.ok ? (await res.json()).maintenanceMode === true : false
  } catch {
    maintenanceCacheValue = false
  }
  maintenanceCacheExpiry = now + 30_000
  return maintenanceCacheValue
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Inject pathname so server components (ConditionalShell) can read it
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  // ── Admin protection ──────────────────────────────────────────────────────
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

  // ── Maintenance mode (skip for API, maintenance page, and static assets) ──
  const isExempt =
    pathname.startsWith('/api/') ||
    pathname.startsWith('/maintenance') ||
    pathname.startsWith('/_next/')

  if (!isExempt) {
    const maintenance = await isMaintenanceMode(request.nextUrl.origin)
    if (maintenance) {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)'],
}

// middleware.ts
// Three responsibilities:
//   1. Inject x-pathname header so ConditionalShell suppresses store Header/Footer on /admin
//   2. Protect /admin routes with JWT verification
//   3. Enforce maintenance mode by reading a cookie — NOT a self-fetch
//      (self-fetch is unreliable on Vercel Edge: cold starts, no loopback)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminToken } from '@/lib/adminAuth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always inject pathname so ConditionalShell (server component) can
  // suppress the store Header/Footer on /admin routes without client JS.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  // ── Admin route protection ────────────────────────────────────────────────
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

  // ── Maintenance mode ──────────────────────────────────────────────────────
  // Read the cookie written by PUT /api/admin/settings when the admin saves.
  // This works reliably on Vercel Edge because cookies are in the request —
  // no network call needed, no loopback fetch, no cold-start race condition.
  const isExempt =
    pathname.startsWith('/api/') ||
    pathname.startsWith('/maintenance') ||
    pathname.startsWith('/_next/')

  if (!isExempt) {
    const maintenanceCookie = request.cookies.get('tealmart-maintenance')?.value
    if (maintenanceCookie === '1') {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)'],
}

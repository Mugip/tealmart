// middleware.ts
// Responsibilities:
//   1. Inject x-pathname header for ConditionalShell (Header/Footer suppression on /admin)
//   2. Protect /admin routes with JWT verification
//   3. Enforce maintenance mode via Supabase REST API — the ONLY approach that
//      works reliably on Vercel Edge across ALL visitors.
//
// WHY NOT A COOKIE: The tealmart-maintenance cookie is set in the ADMIN's browser
// when they save settings. Visitor browsers never have that cookie, so middleware
// can never read it from request.cookies for a visitor. Cookies are per-browser.
//
// WHY SUPABASE REST: Supabase exposes a PostgREST endpoint at
// https://<project>.supabase.co/rest/v1/ that is reachable from Vercel Edge.
// We query the AdminSettings table directly, cache the result for 10 seconds
// in a module-level variable (per Edge worker instance), so we hit Supabase
// at most once every 10s per warm worker — not on every request.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminToken } from '@/lib/adminAuth'

// ── Maintenance mode cache ─────────────────────────────────────────────────
let _maintenanceCache: boolean = false
let _maintenanceCacheExpiry: number = 0

async function getMaintenanceMode(): Promise<boolean> {
  const now = Date.now()
  if (now < _maintenanceCacheExpiry) return _maintenanceCache

  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      extractSupabaseUrl(process.env.DATABASE_URL ?? '')

    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      _maintenanceCache = false
      _maintenanceCacheExpiry = now + 10_000
      return false
    }

    const res = await fetch(
      `${supabaseUrl}/rest/v1/AdminSettings?select=maintenanceMode&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Accept: 'application/json',
        },
      }
    )

    if (res.ok) {
      const rows: Array<{ maintenanceMode: boolean }> = await res.json()
      _maintenanceCache = rows[0]?.maintenanceMode === true
    } else {
      _maintenanceCache = false
    }
  } catch {
    _maintenanceCache = false
  }

  _maintenanceCacheExpiry = now + 10_000
  return _maintenanceCache
}

// Extract the Supabase project URL from the DATABASE_URL connection string
function extractSupabaseUrl(dbUrl: string): string {
  try {
    const match = dbUrl.match(/postgres\.([\w]+)@/)
    if (match) return `https://${match[1]}.supabase.co`
  } catch {}

  return ''
}

// ── Middleware ──────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Inject pathname so ConditionalShell can suppress Header/Footer on /admin
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
  const isExempt =
    pathname.startsWith('/api/') ||
    pathname.startsWith('/maintenance') ||
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
  matcher: [
    '/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
        }

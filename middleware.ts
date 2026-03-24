// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminToken } from '@/lib/adminAuth'

// ── Maintenance mode cache (per Edge worker instance, 10s TTL) ─────────────
let _maintenanceCache: boolean = false
let _maintenanceCacheExpiry: number = 0

function getSupabaseUrl(): string {
  // Try explicit env var first
  if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) return process.env.NEXT_PUBLIC_SUPABASE_URL

  // Auto-extract from DATABASE_URL
  // Format: postgresql://postgres.PROJECTREF:PASSWORD@HOST/postgres
  const dbUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? ''
  const match = dbUrl.match(/postgres\.([a-zA-Z0-9]+)[:@]/)
  if (match?.[1]) return `https://${match[1]}.supabase.co`

  // Auto-extract from DIRECT_URL as fallback
  const directUrl = process.env.DIRECT_URL ?? ''
  const match2 = directUrl.match(/postgres\.([a-zA-Z0-9]+)[:@]/)
  if (match2?.[1]) return `https://${match2[1]}.supabase.co`

  return ''
}

async function getMaintenanceMode(): Promise<boolean> {
  const now = Date.now()
  if (now < _maintenanceCacheExpiry) return _maintenanceCache

  try {
    const supabaseUrl = getSupabaseUrl()
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[maintenance] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
      _maintenanceCache = false
      _maintenanceCacheExpiry = now + 10_000
      return false
    }

    // Prisma stores camelCase model names with quoted identifiers in Postgres.
    // The table is "AdminSettings" and the column is "maintenanceMode" —
    // both must be URL-encoded double-quoted for PostgREST.
    const url = `${supabaseUrl}/rest/v1/%22AdminSettings%22?select=%22maintenanceMode%22&limit=1`

    const res = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json',
      },
    })

    if (res.ok) {
      const rows: Array<{ maintenanceMode: boolean }> = await res.json()
      _maintenanceCache = rows[0]?.maintenanceMode === true
    } else {
      const text = await res.text()
      console.error('[maintenance] Supabase query failed:', res.status, text)
      _maintenanceCache = false
    }
  } catch (err) {
    console.error('[maintenance] fetch error:', err)
    _maintenanceCache = false
  }

  _maintenanceCacheExpiry = now + 10_000
  return _maintenanceCache
}

// ── Middleware ──────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)'],
}

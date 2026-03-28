// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminToken } from '@/lib/adminAuth'

let _maintenanceCache: boolean = false
let _maintenanceCacheExpiry: number = 0

// Supported languages
const locales = ['en', 'fr', 'es', 'sw']

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
  const requestHeaders = new Headers(request.headers)
  
  // 1. 📍 Pass pathname to Server Components (for Header/Footer logic)
  requestHeaders.set('x-pathname', pathname)

  // 2. 🔐 ADMIN SECURITY
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin-auth')?.value
    const isValid = token ? await verifyAdminToken(token) : false
    
    if (!isValid && pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    
    return NextResponse.next({
      request: { headers: requestHeaders }
    })
  }

  // 3. 🏗️ MAINTENANCE MODE
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

  // 4. 🌍 i18n DETECTION (Passive Mode)
  // We detect the language but we DO NOT redirect the user.
  // This prevents the 404 errors.
  let locale = request.cookies.get('NEXT_LOCALE')?.value

  if (!locale) {
    // Detect from browser headers
    const acceptLang = request.headers.get('accept-language')
    if (acceptLang) {
      const detected = acceptLang.split(',')[0].split('-')[0]
      locale = locales.includes(detected) ? detected : 'en'
    } else {
      locale = 'en'
    }
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders }
  })

  // Set the locale cookie so the i18n engine can read it on the next page load
  response.cookies.set('NEXT_LOCALE', locale)

  return response
}

export const config = {
  // Pattern matches everything except static assets and internal next files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.svg).*)']
}

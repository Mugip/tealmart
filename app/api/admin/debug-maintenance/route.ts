// app/api/admin/debug-maintenance/route.ts
// TEMPORARY DEBUG ENDPOINT — DELETE THIS FILE AFTER CONFIRMING MAINTENANCE WORKS
// Visit: /api/admin/debug-maintenance to see exactly what middleware sees
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/adminAuth'

export async function GET() {
  // Auth check
  const token = cookies().get('admin-auth')?.value
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  function getSupabaseUrl(): string {
    if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) return process.env.NEXT_PUBLIC_SUPABASE_URL
    const dbUrl = process.env.DATABASE_URL ?? ''
    const match = dbUrl.match(/postgres\.([a-zA-Z0-9]+)[:@]/)
    if (match?.[1]) return `https://${match[1]}.supabase.co`
    const directUrl = process.env.DIRECT_URL ?? ''
    const match2 = directUrl.match(/postgres\.([a-zA-Z0-9]+)[:@]/)
    if (match2?.[1]) return `https://${match2[1]}.supabase.co`
    return ''
  }

  const supabaseUrl = getSupabaseUrl()
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const dbUrl = process.env.DATABASE_URL ?? ''

  const diagnostics: Record<string, any> = {
    supabaseUrl: supabaseUrl || 'NOT DETECTED',
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    keyUsed: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon',
    databaseUrlPrefix: dbUrl.substring(0, 50) + '...',
  }

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      ...diagnostics,
      error: 'Missing Supabase URL or key — maintenance check will always fail',
      fix: 'Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to Vercel env vars',
    })
  }

  // Test 1: quoted table name (what middleware uses)
  const url1 = `${supabaseUrl}/rest/v1/%22AdminSettings%22?select=%22maintenanceMode%22&limit=1`
  let result1: any = null
  let error1: string | null = null
  try {
    const r = await fetch(url1, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Accept: 'application/json' },
    })
    result1 = { status: r.status, body: await r.text() }
    if (!r.ok) error1 = `HTTP ${r.status}: ${result1.body}`
  } catch (e: any) {
    error1 = e.message
  }

  // Test 2: lowercase table name (alternative Prisma naming)
  const url2 = `${supabaseUrl}/rest/v1/admin_settings?select=maintenance_mode&limit=1`
  let result2: any = null
  try {
    const r = await fetch(url2, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Accept: 'application/json' },
    })
    result2 = { status: r.status, body: await r.text() }
  } catch (e: any) {
    result2 = { error: e.message }
  }

  // Test 3: list all tables to find the correct name
  const url3 = `${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`
  let tableList: string | null = null
  try {
    const r = await fetch(url3, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    })
    tableList = await r.text()
  } catch {}

  return NextResponse.json({
    ...diagnostics,
    test1_quotedName: { url: url1, result: result1, error: error1 },
    test2_snakeCase: { url: url2, result: result2 },
    test3_tableList: tableList?.substring(0, 500),
    instructions: error1
      ? 'Test 1 failed — check test2 and test3 to find the correct table name'
      : 'Test 1 passed — middleware should work',
  })
}

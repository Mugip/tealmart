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
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
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

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    Accept: 'application/json',
  }

  // Test 1: plain table name — what middleware now uses (no %22 encoding)
  const url1 = `${supabaseUrl}/rest/v1/AdminSettings?select=maintenanceMode&limit=1`
  let result1: any = null
  let error1: string | null = null
  try {
    const r = await fetch(url1, { headers })
    result1 = { status: r.status, body: await r.text() }
    if (!r.ok) error1 = `HTTP ${r.status}: ${result1.body}`
  } catch (e: any) {
    error1 = e.message
  }

  // Test 2: old broken URL with %22 encoding — kept for comparison
  const url2 = `${supabaseUrl}/rest/v1/%22AdminSettings%22?select=%22maintenanceMode%22&limit=1`
  let result2: any = null
  try {
    const r = await fetch(url2, { headers })
    result2 = { status: r.status, body: await r.text() }
  } catch (e: any) {
    result2 = { error: e.message }
  }

  // Test 3: list all tables visible to PostgREST to confirm schema cache
  const url3 = `${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`
  let tableList: string | null = null
  try {
    const r = await fetch(url3, { headers })
    tableList = await r.text()
  } catch {}

  // Parse table names from swagger paths for easier reading
  let visibleTables: string[] = []
  try {
    const swagger = JSON.parse(tableList ?? '{}')
    visibleTables = Object.keys(swagger.paths ?? {})
      .filter((p) => p !== '/')
      .map((p) => p.replace(/^\//, ''))
  } catch {}

  return NextResponse.json({
    ...diagnostics,
    test1_correctUrl: {
      url: url1,
      result: result1,
      error: error1,
      verdict: !error1 ? '✅ PASS — middleware URL is correct' : '❌ FAIL — see error',
    },
    test2_oldBrokenUrl: {
      url: url2,
      result: result2,
      verdict: result2?.status === 404 ? '404 as expected (this URL was the bug)' : 'unexpected',
    },
    test3_visibleTables: visibleTables.length > 0 ? visibleTables : tableList?.substring(0, 500),
    conclusion: !error1
      ? '✅ Middleware fix confirmed. Delete this debug route.'
      : '❌ Still failing — check RLS policies on AdminSettings in Supabase dashboard',
  })
                                       }
    

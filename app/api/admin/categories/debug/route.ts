// app/api/admin/categories/debug/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const queryKey = url.searchParams.get('key')
  const headerKey = req.headers.get('x-api-key')
  const cookieKey = req.cookies.get('admin-auth')?.value

  return NextResponse.json({
    message: 'Debug info for authentication',
    headers: { 'x-api-key': headerKey },
    query: { key: queryKey },
    cookies: { 'admin-auth': cookieKey },
    info: {
      note: 'This is temporary. Only for debugging why /remap returns unauthorized.',
      tip: 'Check your browser console and network tab to see cookies and headers sent.',
    },
  })
}

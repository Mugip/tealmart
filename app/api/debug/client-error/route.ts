import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('%c[Client Error]', 'color: red; font-weight: bold;', body)
    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.error('%c[Client Error Logging Failed]', 'color: red; font-weight: bold;', err)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}

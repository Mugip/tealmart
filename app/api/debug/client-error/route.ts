import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    console.error("🚨 CLIENT ERROR REPORT")
    console.error("Time:", new Date().toISOString())
    console.error("Message:", body.message)
    console.error("Stack:", body.stack)
    console.error("URL:", body.url)
    console.error("UserAgent:", body.userAgent)
    console.error("Extra:", body.extra)

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("❌ Debug logging failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

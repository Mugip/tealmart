import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const data = await req.json()

    console.error("🚨 CLIENT ERROR CAPTURED")
    console.error("Context:", data.context)
    console.error("Error:", data.error)
    console.error("Stack:", data.stack)
    console.error("URL:", data.url)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Debug logger failure:", err)
    return NextResponse.json({ ok: false })
  }
}

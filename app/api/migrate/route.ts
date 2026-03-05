import { NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-api-key")
  
  if (key !== process.env.INGESTION_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { stdout, stderr } = await execAsync("npx prisma db push --skip-generate --accept-data-loss")
    
    return NextResponse.json({
      success: true,
      output: stdout,
      errors: stderr
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      stack: err.stack
    }, { status: 500 })
  }
      }

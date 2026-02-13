import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // Call ingestion service
    const response = await fetch(`${process.env.INGESTION_SERVICE_URL || 'http://localhost:8000'}/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.INGESTION_API_KEY!,
      },
      body: JSON.stringify({
        sources: ['mock', 'ebay', 'aliexpress'],
        count_per_source: 10,
      }),
    })

    const result = await response.json()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    })
  } catch (error: any) {
    console.error('Cron ingestion error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// app/api/img-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  
  if (!url) {
    return new NextResponse('Missing image URL', { status: 400 })
  }

  try {
    // Fetch the image from CJ masking as a normal Google Chrome browser
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      }
    })

    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)

    const buffer = await response.arrayBuffer()
    const headers = new Headers()
    
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg')
    // Cache the image heavily on Vercel's Edge Network so we only fetch from CJ once
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')

    return new NextResponse(buffer, { headers })
  } catch (error) {
    console.error('Image Proxy Error:', error)
    return new NextResponse('Error loading image', { status: 500 })
  }
}

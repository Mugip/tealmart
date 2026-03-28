// app/api/search/suggestions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { fetchWithCache } from '@/lib/redis'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.toLowerCase()

  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  try {
    // Break search into individual terms for fuzzy matching (e.g. "wireless earbuds")
    const searchTerms = q.split(' ').filter(term => term.length > 0)

    // Build the query to check if title contains the words
    const OR = searchTerms.map(term => ({
      title: { contains: term, mode: 'insensitive' as const }
    }))

    // Use Redis Cache so thousands of keystrokes don't melt the DB
    const results = await fetchWithCache(`search:suggest:${q}`, async () => {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: OR
        },
        select: {
          id: true,
          title: true,
          price: true,
          images: true,
          category: true,
          views: true,
        },
        orderBy: { views: 'desc' }, // Show most popular matches first
        take: 6, // Limit to 6 suggestions for a clean UI
      })

      return products.map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        image: p.images[0] || '',
        category: p.category,
      }))
    }, 3600) // Cache this specific search query for 1 hour

    return NextResponse.json(results)
  } catch (error) {
    console.error("Search API Error:", error)
    return NextResponse.json([], { status: 500 })
  }
}

// app/api/products/upsell/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cartIds = searchParams.get('cartIds')?.split(',') || []

  try {
    // Fetch top-rated featured products that are NOT already in the cart
    const upsells = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { notIn: cartIds }
      },
      take: 4,
      orderBy: [
        { isFeatured: 'desc' },
        { rating: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        price: true,
        images: true,
        category: true
      }
    })

    return NextResponse.json(upsells)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch upsells' }, { status: 500 })
  }
}

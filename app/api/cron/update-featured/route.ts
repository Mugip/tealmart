import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // Unfeature all products
    await prisma.product.updateMany({
      where: { isFeatured: true },
      data: { isFeatured: false },
    })

    // Feature top products by conversion rate
    const topProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        views: { gt: 10 },
      },
      orderBy: [
        { conversions: 'desc' },
        { rating: 'desc' },
      ],
      take: 8,
    })

    const updatedIds = topProducts.map(p => p.id)

    await prisma.product.updateMany({
      where: { id: { in: updatedIds } },
      data: { isFeatured: true },
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      featuredCount: updatedIds.length,
    })
  } catch (error: any) {
    console.error('Cron featured products error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

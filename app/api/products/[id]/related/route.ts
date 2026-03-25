// app/api/products/[id]/related/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: { category: true, tags: true },
  })

  if (!product) return NextResponse.json([], { status: 200 })

  // Get related by category
  const related = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: params.id },
      category: product.category,
    },
    select: {
      id: true, title: true, price: true, compareAtPrice: true,
      images: true, rating: true, reviewCount: true,
    },
    orderBy: [{ isFeatured: 'desc' }, { views: 'desc' }],
    take: 8,
  })

  // If not enough, pad with popular products from any category
  if (related.length < 4) {
    const extra = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { notIn: [params.id, ...related.map(r => r.id)] },
      },
      select: {
        id: true, title: true, price: true, compareAtPrice: true,
        images: true, rating: true, reviewCount: true,
      },
      orderBy: { views: 'desc' },
      take: 8 - related.length,
    })
    return NextResponse.json([...related, ...extra])
  }                                                   
  return NextResponse.json(related)
}

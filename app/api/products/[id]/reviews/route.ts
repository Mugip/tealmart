// app/api/products/[id]/reviews/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 10
  const skip = (page - 1) * limit

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId: params.id },
      include: {
        user: { select: { name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { productId: params.id } }),
  ])

  // Rating breakdown
  const breakdown = await prisma.review.groupBy({
    by: ['rating'],
    where: { productId: params.id },
    _count: { rating: true },
  })

  const ratingMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  breakdown.forEach(b => { ratingMap[b.rating] = b._count.rating })

  return NextResponse.json({
    reviews,
    total,
    page,
    pages: Math.ceil(total / limit),
    ratingBreakdown: ratingMap,
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'You must be signed in to leave a review' }, { status: 401 })
  }

  const { rating, title, comment } = await req.json()

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
  }

  // Check product exists
  const product = await prisma.product.findUnique({ where: { id: params.id } })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  // One review per user per product
  const existing = await prisma.review.findFirst({
    where: { productId: params.id, userId: session.user.id },
  })
  if (existing) {
    return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 })
  }

  const review = await prisma.review.create({
    data: {
      productId: params.id,
      userId: session.user.id,
      rating,
      title: title?.trim().slice(0, 100) || null,
      comment: comment?.trim().slice(0, 1000) || null,
      verified: false,
    },
    include: {
      user: { select: { name: true, image: true } },
    },
  })

  // Update product aggregate rating
  const allReviews = await prisma.review.findMany({
    where: { productId: params.id },
    select: { rating: true },
  })
  const avgRating = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length

  await prisma.product.update({
    where: { id: params.id },
    data: {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length,
    },
  })

  return NextResponse.json(review, { status: 201 })
}

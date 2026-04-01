// app/api/products/[id]/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadToR2 } from '@/lib/r2'
import { isLikelyFakeReview } from '@/lib/fakeReview'

// GET: Fetch reviews with pagination and rating summary
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 5
  const skip = (page - 1) * limit

  try {
    const [reviews, total, aggregate] = await Promise.all([
      prisma.review.findMany({
        where: { productId: params.id },
        include: { 
          user: { select: { name: true, image: true } } 
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { productId: params.id } }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { productId: params.id },
        _count: { rating: true },
      }),
    ])

    // Initialize 1-5 star breakdown
    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    aggregate.forEach((item) => {
      breakdown[item.rating] = item._count.rating
    })

    return NextResponse.json({
      reviews,
      total,
      pages: Math.ceil(total / limit),
      page,
      ratingBreakdown: breakdown,
    })
  } catch (error) {
    console.error('[REVIEWS_GET_ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

// POST: Submit a new review
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'You must be signed in to leave a review' }, { status: 401 })
  }

  try {
    const { rating, title, comment, images } = await req.json()

    // ✅ NEW: Combine title and comment and run them through the AI Filter
    const combinedReviewText = `${title || ''}. ${comment || ''}`.trim();
    const isFake = await isLikelyFakeReview(combinedReviewText);

    if (isFake) {
      return NextResponse.json(
        { error: 'Your review was flagged by our automated spam filter. Please remove any links or promotional text.' }, 
        { status: 400 }
      )
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id: params.id } })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const existing = await prisma.review.findFirst({
      where: { productId: params.id, userId: session.user.id },
    })

    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 })
    }

    // Image Upload Logic
    const uploadedImages: string[] = []
    if (Array.isArray(images)) {
      for (const base64 of images) {
        const matches = base64.match(/^data:(.+);base64,(.+)$/)
        if (!matches) continue
        const contentType = matches[1]
        const buffer = Buffer.from(matches[2], 'base64')
        const key = `reviews/${params.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`
        try {
          const url = await uploadToR2(buffer, key, contentType)
          uploadedImages.push(url)
        } catch (err) {
          console.error('R2 upload failed:', err)
        }
      }
    }

    const review = await prisma.review.create({
      data: {
        productId: params.id,
        userId: session.user.id,
        rating,
        title: title?.trim().slice(0, 100) || null,
        comment: comment?.trim().slice(0, 1000) || null,
        images: uploadedImages,
        verified: false,
      },
      include: { user: { select: { name: true, image: true } } },
    })

    // Update Product Average Rating
    const allReviews = await prisma.review.findMany({
      where: { productId: params.id },
      select: { rating: true },
    })
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    await prisma.product.update({
      where: { id: params.id },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: allReviews.length,
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('[REVIEW_POST_ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
      }

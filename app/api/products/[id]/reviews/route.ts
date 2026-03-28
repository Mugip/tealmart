// app/api/products/[id]/reviews/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadToR2 } from '@/lib/r2' // ✅ IMPORTANT

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'You must be signed in to leave a review' },
      { status: 401 }
    )
  }

  const { rating, title, comment, images } = await req.json()

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: 'Rating must be between 1 and 5' },
      { status: 400 }
    )
  }

  // Check product exists
  const product = await prisma.product.findUnique({
    where: { id: params.id },
  })

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Prevent duplicate review
  const existing = await prisma.review.findFirst({
    where: {
      productId: params.id,
      userId: session.user.id,
    },
  })

  if (existing) {
    return NextResponse.json(
      { error: 'You have already reviewed this product' },
      { status: 400 }
    )
  }

  // ✅ NEW: Upload images to R2
  const uploadedImages: string[] = []

  if (Array.isArray(images)) {
    for (const base64 of images) {
      const matches = base64.match(/^data:(.+);base64,(.+)$/)
      if (!matches) continue

      const contentType = matches[1]
      const buffer = Buffer.from(matches[2], 'base64')

      const key = `reviews/${params.id}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}.jpg`

      try {
        const url = await uploadToR2(buffer, key, contentType)
        uploadedImages.push(url)
      } catch (err) {
        console.error('R2 upload failed:', err)
      }
    }
  }

  // Create review
  const review = await prisma.review.create({
    data: {
      productId: params.id,
      userId: session.user.id,
      rating,
      title: title?.trim().slice(0, 100) || null,
      comment: comment?.trim().slice(0, 1000) || null,
      images: uploadedImages, // ✅ USE URLs now
      verified: false,
    },
    include: {
      user: { select: { name: true, image: true } },
    },
  })

  // Update product rating
  const allReviews = await prisma.review.findMany({
    where: { productId: params.id },
    select: { rating: true },
  })

  const avgRating =
    allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

  await prisma.product.update({
    where: { id: params.id },
    data: {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length,
    },
  })

  return NextResponse.json(review, { status: 201 })
                   }

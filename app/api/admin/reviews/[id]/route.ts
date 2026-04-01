// app/api/admin/reviews/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/adminAuth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Verify Admin Auth
  const token = cookies().get('admin-auth')?.value
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 2. Find the review to get the productId
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      select: { productId: true }
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // 3. Delete the review
    await prisma.review.delete({
      where: { id: params.id }
    })

    // 4. Recalculate product rating & review count
    const remainingReviews = await prisma.review.findMany({
      where: { productId: review.productId },
      select: { rating: true }
    })

    const newReviewCount = remainingReviews.length
    const newAvgRating = newReviewCount > 0 
      ? remainingReviews.reduce((sum, r) => sum + r.rating, 0) / newReviewCount 
      : null

    await prisma.product.update({
      where: { id: review.productId },
      data: {
        rating: newAvgRating ? Math.round(newAvgRating * 10) / 10 : null,
        reviewCount: newReviewCount,
      }
    })

    return NextResponse.json({ success: true, newReviewCount, newAvgRating })
  } catch (error) {
    console.error('[ADMIN_REVIEW_DELETE_ERROR]', error)
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
  }
}

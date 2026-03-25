// components/products/ReviewSection.tsx

'use client'

import { useEffect, useState } from 'react'
import { Star, ThumbsUp, User, Loader2, ChevronDown } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Review {
  id: string
  rating: number
  title?: string | null
  comment?: string | null
  verified: boolean
  helpful: number
  createdAt: string
  user: { name?: string | null; image?: string | null }
}

interface ReviewData {
  reviews: Review[]
  total: number
  pages: number
  page: number
  ratingBreakdown: Record<number, number>
}

interface Props {
  productId: string
  productRating?: number | null
  reviewCount: number
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={28}
            className={i <= (hovered || value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  )
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-8 text-right text-gray-600 font-medium">{label}</span>
      <Star size={12} className="fill-yellow-400 text-yellow-400 flex-shrink-0" />
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-gray-500 text-xs">{count}</span>
    </div>
  )
}

export default function ReviewSection({ productId, productRating, reviewCount }: Props) {
  const { data: session } = useSession()
  const [data, setData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  // Form state
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const fetchReviews = (p = 1) => {
    setLoading(true)
    fetch(`/api/products/${productId}/reviews?page=${p}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchReviews(page) }, [productId, page])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating) { toast.error('Please select a star rating'); return }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, title, comment }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || 'Failed to submit review')
        if (result.error?.includes('already reviewed')) setHasReviewed(true)
      } else {
        toast.success('Review submitted! Thank you.')
        setRating(0); setTitle(''); setComment('')
        setHasReviewed(true)
        setShowForm(false)
        fetchReviews(1)
        setPage(1)
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const total = data?.total ?? reviewCount
  const breakdown = data?.ratingBreakdown ?? {}
  const avgRating = productRating ?? 0

  return (
    <section className="mt-12 border-t pt-10">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Reviews</h2>

      {/* Summary */}
      <div className="bg-gray-50 rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          {/* Big rating number */}
          <div className="text-center flex-shrink-0">
            <div className="text-5xl font-bold text-gray-900">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</div>
            <div className="flex justify-center my-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className={i < Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 fill-gray-200'} />
              ))}
            </div>
            <div className="text-sm text-gray-500">{total} review{total !== 1 ? 's' : ''}</div>
          </div>

          {/* Breakdown bars */}
          <div className="flex-1 w-full space-y-2">
            {[5, 4, 3, 2, 1].map(star => (
              <RatingBar key={star} label={`${star}`} count={breakdown[star] ?? 0} total={total} />
            ))}
          </div>

          {/* Write review CTA */}
          <div className="flex-shrink-0 text-center">
            {session ? (
              hasReviewed ? (
                <div className="text-sm text-green-600 font-medium">✓ You've reviewed this</div>
              ) : (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-tiffany-500 hover:bg-tiffany-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                >
                  Write a Review
                </button>
              )
            ) : (
              <Link
                href={`/auth/signin?callbackUrl=/products/${productId}`}
                className="bg-tiffany-500 hover:bg-tiffany-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors inline-block"
              >
                Sign in to Review
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Review Form */}
      {showForm && !hasReviewed && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Your Review</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
            <StarRating value={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Review Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={100}
              placeholder="Summarize your experience"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500 outline-none"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Tell others about your experience with this product..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500 outline-none resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/1000</p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || !rating}
              className="flex items-center gap-2 bg-tiffany-500 hover:bg-tiffany-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Submit Review
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Review List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-28 animate-pulse" />
          ))}
        </div>
      ) : !data?.reviews.length ? (
        <div className="text-center py-12 text-gray-500">
          <Star size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-medium">No reviews yet</p>
          <p className="text-sm mt-1">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {data.reviews.map(review => (
            <div key={review.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {review.user.image ? (
                    <img src={review.user.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-tiffany-100 flex items-center justify-center">
                      <User size={18} className="text-tiffany-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900">
                      {review.user.name || 'Anonymous'}
                    </span>
                    {review.verified && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        Verified Purchase
                      </span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Stars */}
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 fill-gray-200'} />
                    ))}
                  </div>

                  {review.title && (
                    <p className="font-semibold text-gray-900 text-sm mb-1">{review.title}</p>
                  )}
                  {review.comment && (
                    <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                  )}

                  {/* Helpful */}
                  {review.helpful > 0 && (
                    <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                      <ThumbsUp size={12} />
                      <span>{review.helpful} found this helpful</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {page > 1 && (
                <button
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
              )}
              <span className="px-4 py-2 text-sm text-gray-600 font-medium">
                Page {page} of {data.pages}
              </span>
              {page < data.pages && (
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  More reviews <ChevronDown size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

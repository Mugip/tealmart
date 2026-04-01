// components/products/ReviewSection.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { Star, ThumbsUp, User, Loader2, Camera, X, CheckCircle, Trash2 } from 'lucide-react' // ✅ Added Trash2
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface Review {
  id: string; rating: number; title?: string | null; comment?: string | null;
  images?: string[]; verified: boolean; helpful: number; helpfulUsers: string[];
  createdAt: string; user: { name?: string | null; image?: string | null }
}

interface ReviewData {
  reviews: Review[]; total: number; pages: number; page: number; ratingBreakdown: Record<number, number>
}

interface Props {
  productId: string; productRating?: number | null; reviewCount: number
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i} type="button" onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star size={28} className={i <= (hovered || value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
        </button>
      ))}
    </div>
  )
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-12 text-gray-600 font-medium">{label} Stars</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div className="bg-yellow-400 h-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-xs text-gray-400 text-right">{pct}%</span>
    </div>
  )
}

export default function ReviewSection({ productId, productRating, reviewCount }: Props) {
  const { data: session } = useSession()
  const [data, setData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  
  // ✅ NEW: Admin State
  const [isAdmin, setIsAdmin] = useState(false)

  const fetchReviews = async (p = 1) => {
    setLoading(true)
    try {
      const r = await fetch(`/api/products/${productId}/reviews?page=${p}`)
      const d = await r.json()
      setData(d)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    fetchReviews(page) 
    
    // ✅ NEW: Check if the user is an Admin
    fetch('/api/admin/me')
      .then(res => { if (res.ok) setIsAdmin(true) })
      .catch(() => {})
  }, [productId, page])

  const handleHelpful = async (reviewId: string) => {
    if (!session) return toast.error('Sign in to vote')
    try {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, { method: 'POST' })
      if (res.ok) {
        toast.success('Feedback recorded')
        fetchReviews(page)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to vote')
      }
    } catch { toast.error('Connection error') }
  }

  // ✅ NEW: Admin Delete Function
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Review deleted successfully')
        fetchReviews(page) // Refresh the list
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to delete review')
      }
    } catch { 
      toast.error('Connection error') 
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating) return toast.error('Please select a star rating')
    setSubmitting(true)
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, title, comment, images }),
      })
      if (res.ok) {
        toast.success('Review submitted!')
        setShowForm(false); setRating(0); setTitle(''); setComment(''); setImages([]);
        fetchReviews(1)
      } else {
        const err = await res.json()
        toast.error(err.error)
      }
    } finally { setSubmitting(false) }
  }

  return (
    <section className="mt-16 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
          <div className="flex items-center gap-4 mt-2">
            <div className="text-4xl font-black text-gray-900">{(data?.total ? productRating : 0)?.toFixed(1)}</div>
            <div>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className={i < Math.floor(productRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                ))}
              </div>
              <p className="text-sm text-gray-500">Based on {data?.total || 0} reviews</p>
            </div>
          </div>
        </div>
        {!showForm && (
          <button 
            onClick={() => session ? setShowForm(true) : toast.error('Please sign in first')}
            className="btn-primary"
          >
            Write a Review
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map(s => (
            <RatingBar key={s} label={s.toString()} count={data?.ratingBreakdown[s] || 0} total={data?.total || 0} />
          ))}
        </div>

        <div className="lg:col-span-2 space-y-8">
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl p-6 border border-gray-200 animate-in fade-in slide-in-from-top-4">
              <h3 className="font-bold mb-4">Share your thoughts</h3>
              <StarRating value={rating} onChange={setRating} />
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Review title (optional)" className="input-field mt-4 bg-white" />
              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="What did you like or dislike?" rows={4} className="input-field mt-3 bg-white" />
              <button type="submit" disabled={submitting} className="btn-primary w-full mt-4 flex justify-center items-center gap-2">
                {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Post Review'}
              </button>
            </form>
          )}

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-tiffany-500" /></div>
          ) : data?.reviews.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No reviews yet. Be the first to review!</div>
          ) : (
            data?.reviews.map(r => (
              <div key={r.id} className="border-b border-gray-100 pb-8 last:border-0 relative">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-tiffany-100 flex items-center justify-center text-tiffany-700 font-bold uppercase">
                      {r.user.image ? <img src={r.user.image} className="rounded-full" alt="User" /> : r.user.name?.[0]}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{r.user.name}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => <Star key={i} size={12} className={i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />)}
                        </div>
                        <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  {r.verified && <span className="flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full"><CheckCircle size={12}/> Verified</span>}
                </div>
                {r.title && <h4 className="font-bold text-gray-900 mb-1">{r.title}</h4>}
                <p className="text-gray-600 leading-relaxed text-sm">{r.comment}</p>
                
                <div className="flex items-center gap-4 mt-4">
                  <button onClick={() => handleHelpful(r.id)} className={`flex items-center gap-1.5 text-xs transition-colors ${r.helpfulUsers.includes(session?.user?.id || '') ? 'text-tiffany-600 font-bold' : 'text-gray-400 hover:text-tiffany-600'}`}>
                    <ThumbsUp size={14} /> Helpful ({r.helpful})
                  </button>

                  {/* ✅ NEW: Admin Delete Button */}
                  {isAdmin && (
                    <button 
                      onClick={() => handleDeleteReview(r.id)}
                      className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-semibold transition-colors ml-auto bg-red-50 px-3 py-1.5 rounded-lg"
                    >
                      <Trash2 size={14} /> Delete as Admin
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
    }

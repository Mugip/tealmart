// components/products/ReviewSection.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { Star, ThumbsUp, User, Loader2, ChevronDown, Camera, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Review {
  id: string
  rating: number
  title?: string | null
  comment?: string | null
  images?: string[]
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

// ⭐ Star selector
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

// 📊 Rating bar
function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-8 text-right">{label}</span>
      <Star size={12} className="fill-yellow-400 text-yellow-400" />
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-xs">{count}</span>
    </div>
  )
}

// 🖼 Image compression
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = (event) => {
      const img = new window.Image()
      img.src = event.target?.result as string

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 800
        const scale = MAX_WIDTH / img.width

        canvas.width = MAX_WIDTH
        canvas.height = img.height * scale

        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
    }
  })
}

export default function ReviewSection({ productId, productRating, reviewCount }: Props) {
  const { data: session } = useSession()

  const [data, setData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchReviews = (p = 1) => {
    setLoading(true)
    fetch(`/api/products/${productId}/reviews?page=${p}`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchReviews(page)
  }, [productId, page])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (images.length + files.length > 3) {
      toast.error('Max 3 images allowed')
      return
    }

    toast.loading('Processing...', { id: 'img' })
    const compressed = await Promise.all(files.map(compressImage))
    setImages(prev => [...prev, ...compressed])
    toast.success('Added!', { id: 'img' })
  }

  const removeImage = (i: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating) return toast.error('Select rating')

    setSubmitting(true)

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, title, comment, images }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error)
      } else {
        toast.success('Review submitted!')
        setRating(0)
        setTitle('')
        setComment('')
        setImages([])
        setShowForm(false)
        setHasReviewed(true)
        fetchReviews(1)
      }
    } catch {
      toast.error('Error')
    } finally {
      setSubmitting(false)
    }
  }

  const total = data?.total ?? reviewCount
  const breakdown = data?.ratingBreakdown ?? {}
  const avg = productRating ?? 0

  return (
    <section className="mt-12 border-t pt-10">
      <h2 className="text-xl font-bold mb-6">Customer Reviews</h2>

      {/* SUMMARY */}
      <div className="mb-6">
        <div className="text-3xl font-bold">{avg.toFixed(1)}</div>
        {[5,4,3,2,1].map(s => (
          <RatingBar key={s} label={`${s}`} count={breakdown[s] || 0} total={total} />
        ))}
      </div>

      {/* CTA */}
      {session && !hasReviewed && (
        <button onClick={() => setShowForm(true)} className="mb-4 bg-black text-white px-4 py-2 rounded">
          Write Review
        </button>
      )}

      {/* FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 border p-4 rounded">
          <StarRating value={rating} onChange={setRating} />

          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="block w-full mt-2 border p-2" />

          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Comment" className="block w-full mt-2 border p-2" />

          {/* IMAGES */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative">
                <img src={img} className="w-20 h-20 object-cover rounded" />
                <button type="button" onClick={() => removeImage(i)} className="absolute top-0 right-0 bg-red-500 text-white">
                  <X size={12} />
                </button>
              </div>
            ))}

            {images.length < 3 && (
              <button type="button" onClick={() => fileInputRef.current?.click()}>
                <Camera />
              </button>
            )}
          </div>

          <input type="file" ref={fileInputRef} hidden multiple accept="image/*" onChange={handleImageUpload} />

          <button type="submit" disabled={submitting} className="mt-3 bg-green-600 text-white px-4 py-2 rounded">
            {submitting ? <Loader2 className="animate-spin" /> : 'Submit'}
          </button>
        </form>
      )}

      {/* LIST */}
      {!loading && data?.reviews.map(r => (
        <div key={r.id} className="border p-4 mb-3 rounded">
          <div className="font-bold">{r.user.name}</div>
          <div>{r.comment}</div>

          {/* SHOW IMAGES */}
          {r.images && (
            <div className="flex gap-2 mt-2">
              {r.images.map((img, i) => (
                <img key={i} src={img} className="w-20 h-20 object-cover rounded" />
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  )
                  }

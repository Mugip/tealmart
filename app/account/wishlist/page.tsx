// app/account/wishlist/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react'
import { useWishlist } from '@/lib/contexts/WishlistContext'
import { useCart } from '@/lib/contexts/CartContext'
import toast from 'react-hot-toast'

interface WishlistProduct {
  id: string
  productId: string
  product: {
    id: string
    title: string
    price: number
    compareAtPrice?: number | null
    images: string[]
    rating?: number | null
    reviewCount: number
    isActive: boolean
  }
}

export default function WishlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toggle, wishlistIds } = useWishlist()
  const { addItem } = useCart()
  const [items, setItems] = useState<WishlistProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/account/wishlist')
    }
  }, [status, router])

  useEffect(() => {
    if (!session?.user?.id) return
    fetch('/api/wishlist')
      .then(r => r.json())
      .then(data => {
        setItems(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [session?.user?.id])

  // Keep list in sync with context toggles
  useEffect(() => {
    setItems(prev => prev.filter(item => wishlistIds.has(item.productId)))
  }, [wishlistIds])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-2xl aspect-[3/4] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/account" className="flex items-center gap-2 text-gray-500 hover:text-tiffany-600 text-sm mb-2 transition-colors">
              <ArrowLeft size={16} /> Back to Account
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Heart size={24} className="text-red-500 fill-red-500" />
              My Wishlist
            </h1>
            <p className="text-sm text-gray-500 mt-1">{items.length} saved item{items.length !== 1 ? 's' : ''}</p>
          </div>
          {items.length > 0 && (
            <Link
              href="/products"
              className="text-sm font-semibold text-tiffany-600 hover:text-tiffany-700 transition-colors"
            >
              Continue Shopping →
            </Link>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <Heart size={56} className="mx-auto text-gray-200 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 text-sm mb-6">Save products you love by tapping the heart icon</p>
            <Link
              href="/products"
              className="inline-block bg-tiffany-500 hover:bg-tiffany-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(({ product }) => {
              const discount = product.compareAtPrice
                ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
                : 0

              return (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow">
                  <Link href={`/products/${product.id}`} className="block">
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                      <Image
                        src={product.images[0] || '/placeholder.png'}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                      {discount > 0 && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          -{discount}%
                        </div>
                      )}
                      {!product.isActive && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full">Unavailable</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-3">
                    <Link href={`/products/${product.id}`}>
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-tiffany-600 transition-colors leading-snug mb-2">
                        {product.title}
                      </h3>
                    </Link>

                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="font-bold text-gray-900">${product.price.toFixed(2)}</span>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <span className="text-xs text-gray-400 line-through">${product.compareAtPrice.toFixed(2)}</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          addItem({
                            id: product.id,
                            title: product.title,
                            price: product.price,
                            image: product.images[0] || '/placeholder.png',
                          })
                        }}
                        disabled={!product.isActive}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-tiffany-500 hover:bg-tiffany-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                      >
                        <ShoppingCart size={13} />
                        Add
                      </button>
                      <button
                        onClick={() => toggle(product.id, product.title)}
                        className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// app/recently-viewed/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, ArrowRight, Trash2, ShoppingBag } from 'lucide-react'
import { getSecureImageUrl } from '@/lib/imageUrl'
import { useCurrency } from '@/lib/contexts/CurrencyContext'

const KEY = 'tealmart-recently-viewed'

interface RecentProduct {
  id: string
  title: string
  price: number
  image: string
}

export default function RecentlyViewedPage() {
  const [products, setProducts] = useState<RecentProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { formatPrice } = useCurrency()

  useEffect(() => {
    try {
      const stored: RecentProduct[] = JSON.parse(localStorage.getItem(KEY) || '[]')
      setProducts(stored)
    } catch {}
    setIsLoading(false)
  }, [])

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your browsing history?')) {
      localStorage.removeItem(KEY)
      setProducts([])
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-tiffany-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-10 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-tiffany-50 rounded-2xl flex items-center justify-center">
                <Clock size={24} className="text-tiffany-600" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Browsing History</h1>
                <p className="text-gray-500 font-medium">You recently viewed {products.length} item{products.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {products.length > 0 && (
                <button 
                  onClick={handleClearHistory}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold rounded-xl transition-colors text-sm"
                >
                  <Trash2 size={16} /> Clear History
                </button>
              )}
              <Link 
                href="/products"
                className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white hover:bg-black font-bold rounded-xl transition-colors text-sm"
              >
                All Products <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={40} className="text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No history yet</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Your recently viewed products will appear here. Start browsing to discover amazing deals!
            </p>
            <Link 
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-4 bg-tiffany-600 text-white hover:bg-tiffany-700 font-black rounded-xl transition-colors shadow-lg hover:shadow-xl"
            >
              Start Shopping <ArrowRight size={20} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group relative h-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:border-tiffany-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative aspect-square overflow-hidden bg-gray-50 flex-shrink-0">
                  <Image
                    src={getSecureImageUrl(product.image)}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  />
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <p 
                    className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-tiffany-600 transition-colors duration-200 leading-snug"
                    style={{ minHeight: '2.8em' }}
                  >
                    {product.title}
                  </p>

                  <div className="mt-auto pt-3 border-t border-gray-100">
                    <p className="text-lg font-black text-gray-900">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

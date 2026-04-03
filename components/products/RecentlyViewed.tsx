// components/products/RecentlyViewed.tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, ChevronRight } from 'lucide-react'
import { getSecureImageUrl } from '@/lib/imageUrl'
import { useCurrency } from '@/lib/contexts/CurrencyContext' // ✅ Added Currency Context

const KEY = 'tealmart-recently-viewed'
const MAX = 12

export interface RecentProduct {
  id: string
  title: string
  price: number
  image: string
}

export function recordRecentlyViewed(product: RecentProduct) {
  try {
    const stored: RecentProduct[] = JSON.parse(localStorage.getItem(KEY) || '[]')
    const filtered = stored.filter(p => p.id !== product.id)
    const updated = [product, ...filtered].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(updated))
  } catch {}
}

interface Props {
  excludeId?: string
}

export default function RecentlyViewed({ excludeId }: Props) {
  const [products, setProducts] = useState<RecentProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { formatPrice } = useCurrency() // ✅ Get dynamic currency formatter

  useEffect(() => {
    try {
      const stored: RecentProduct[] = JSON.parse(localStorage.getItem(KEY) || '[]')
      setProducts(stored.filter(p => p.id !== excludeId).slice(0, 8))
    } catch {}
    setIsLoading(false)
  }, [excludeId])

  if (!isLoading && !products.length) return null

  return (
    <section className="relative py-12 border-t border-gray-200 mt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-tiffany-50">
            <Clock size={20} className="text-tiffany-600" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Continue Shopping
            </h2>
            <p className="text-sm text-gray-500 mt-0.5 font-medium">Items you recently viewed</p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex-shrink-0 w-[140px] sm:w-[160px] animate-pulse">
              <div className="aspect-square rounded-2xl bg-gray-200 mb-3" />
              <div className="h-3 bg-gray-200 rounded mb-2" />
              <div className="h-2.5 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Horizontal scroll container */}
          <div className="group relative">
            
            {/* Scrollable items */}
            <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
              <div className="flex gap-3 sm:gap-4 min-w-min">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="snap-center flex-shrink-0 w-[140px] sm:w-[160px] group/item transition-all duration-300"
                  >
                    {/* Card container */}
                    <div className="relative h-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:border-tiffany-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      
                      {/* Image container */}
                      <div className="relative aspect-square overflow-hidden bg-gray-50 flex-shrink-0">
                        {/* ✅ Passes cleanly through our idempotent secure image URL */}
                        <Image
                          src={getSecureImageUrl(product.image)}
                          alt={product.title}
                          fill
                          className="object-cover group-hover/item:scale-110 transition-transform duration-500"
                          sizes="(max-width: 768px) 140px, 160px"
                        />
                      </div>

                      {/* Content section */}
                      <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 group-hover/item:text-tiffany-600 transition-colors duration-200 leading-snug">
                          {product.title}
                        </p>

                        <div className="mt-3 pt-2 border-t border-gray-100">
                          <p className="text-sm sm:text-base font-black text-gray-900">
                            {formatPrice(product.price)} {/* ✅ Properly formatted currency */}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}

                {/* Browse all CTA */}
                <Link
                  href="/recently-viewed"
                  className="snap-center flex-shrink-0 w-[140px] sm:w-[160px] group/cta"
                >
                  <div className="h-full min-h-[220px] flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 hover:border-tiffany-400 hover:bg-tiffany-50 transition-all duration-300">
                    <div className="flex flex-col items-center gap-2 text-center p-4">
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center group-hover/cta:scale-110 transition-transform">
                        <ChevronRight size={20} className="text-tiffany-600" />
                      </div>
                      <span className="text-sm font-bold text-gray-600 group-hover/cta:text-tiffany-700 transition-colors">
                        View All
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
          }

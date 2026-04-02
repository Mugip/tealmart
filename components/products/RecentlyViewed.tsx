'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, ChevronRight, ArrowRight } from 'lucide-react'
import { getSecureImageUrl } from '@/lib/imageUrl'

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

  useEffect(() => {
    try {
      const stored: RecentProduct[] = JSON.parse(localStorage.getItem(KEY) || '[]')
      setProducts(stored.filter(p => p.id !== excludeId).slice(0, 8))
    } catch {}
    setIsLoading(false)
  }, [excludeId])

  if (!isLoading && !products.length) return null

  return (
    <section className="relative py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-teal-500/20">
            <Clock size={20} className="text-teal-400" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Continue Shopping
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">Items you were viewing</p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[140px] sm:w-[160px] animate-pulse"
            >
              <div className="aspect-square rounded-2xl bg-gray-700 mb-3" />
              <div className="h-3 bg-gray-700 rounded mb-2" />
              <div className="h-2.5 bg-gray-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Horizontal scroll container */}
          <div className="group relative">
            {/* Fade gradients */}
            <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none bg-gradient-to-r from-slate-900 to-transparent" />
            <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none bg-gradient-to-l from-slate-900 to-transparent" />

            {/* Scrollable items */}
            <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
              <div className="flex gap-3 sm:gap-4 pb-2 min-w-min">
                {products.map((product, idx) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="snap-center flex-shrink-0 w-[140px] sm:w-[160px] group/item transition-all duration-300 hover:scale-105"
                    style={{ animationDelay: `${idx * 20}ms` }}
                  >
                    {/* Card container */}
                    <div className="relative h-full flex flex-col bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-gray-700 hover:border-teal-400/50 transition-all duration-300">
                      {/* Image container */}
                      <div className="relative aspect-square overflow-hidden bg-gray-950 flex-shrink-0">
                        <Image
                          src={getSecureImageUrl(product.image)}
                          alt={product.title}
                          fill
                          className="object-cover group-hover/item:scale-110 transition-transform duration-500"
                          sizes="(max-width: 768px) 140px, 160px"
                        />

                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2">
                          <button className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs rounded-lg transition-colors duration-200 flex items-center gap-1">
                            <span>View</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Content section */}
                      <div className="flex-1 p-3 flex flex-col justify-between">
                        <p className="text-xs sm:text-sm font-bold text-white line-clamp-2 group-hover/item:text-teal-300 transition-colors duration-200 leading-tight">
                          {product.title}
                        </p>

                        <div className="mt-auto pt-2 border-t border-gray-700">
                          <p className="text-sm sm:text-base font-black text-teal-400">
                            ${product.price.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Hover glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-500/0 to-teal-500/0 group-hover/item:from-teal-500/10 group-hover/item:via-teal-500/5 group-hover/item:to-teal-500/10 transition-all duration-300 pointer-events-none" />
                    </div>
                  </Link>
                ))}

                {/* Browse all CTA */}
                <Link
                  href="/products"
                  className="snap-center flex-shrink-0 w-[140px] sm:w-[160px] group/cta"
                >
                  <div className="h-full flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-600 group-hover/cta:border-teal-400 transition-all duration-300 bg-gray-950/50 group-hover/cta:bg-teal-500/5">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <ChevronRight size={20} className="text-gray-500 group-hover/cta:text-teal-400 transition-colors" />
                      <span className="text-xs font-bold text-gray-400 group-hover/cta:text-teal-300 transition-colors">
                        View More
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Mobile hint */}
            <div className="sm:hidden mt-4 flex items-center justify-center gap-1 text-xs text-gray-500">
              <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
              <span>Swipe to explore</span>
              <div className="w-1 h-1 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        </>
      )}
    </section>
  )
}

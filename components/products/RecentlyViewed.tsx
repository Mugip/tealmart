// components/products/RecentlyViewed.tsx

'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock } from 'lucide-react'

const KEY = 'tealmart-recently-viewed'
const MAX = 8

export interface RecentProduct {
  id: string
  title: string
  price: number
  image: string
}

/** Call this on any product page to record the view */
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

  useEffect(() => {
    try {
      const stored: RecentProduct[] = JSON.parse(localStorage.getItem(KEY) || '[]')
      setProducts(stored.filter(p => p.id !== excludeId).slice(0, 6))
    } catch {}
  }, [excludeId])

  if (!products.length) return null

  return (
    <section className="mt-12 border-t pt-10">
      <div className="flex items-center gap-2 mb-6">
        <Clock size={20} className="text-tiffany-600" />
        <h2 className="text-xl font-bold text-gray-900">Recently Viewed</h2>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {products.map(product => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="group"
          >
            <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-2">
              <Image
                src={product.image}
                alt={product.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 768px) 33vw, 16vw"
              />
            </div>

            <p className="text-xs text-gray-700 font-medium line-clamp-2 group-hover:text-tiffany-600 transition-colors leading-snug">
              {product.title}
            </p>

            <p className="text-xs font-bold text-gray-900 mt-0.5">
              ${product.price.toFixed(2)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}

// components/products/RelatedProducts.tsx

'use client'

import { useEffect, useState } from 'react'
import ProductCard from './ProductCard'
import { formatCategoryName } from '@/lib/productClassifier'

interface Product {
  id: string
  title: string
  price: number
  compareAtPrice?: number | null
  images: string[]
  rating?: number | null
  reviewCount: number
}

interface Props {
  productId: string
  category: string
}

export default function RelatedProducts({ productId, category }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/products/${productId}/related`)
      .then(r => r.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [productId])

  if (loading) {
    return (
      <section className="mt-12 border-t pt-10">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl aspect-square animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (!products.length) return null

  return (
    <section className="mt-12 border-t pt-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          More in {formatCategoryName(category)}
        </h2>
        <a
          href={`/products?category=${encodeURIComponent(category)}`}
          className="text-sm font-semibold text-tiffany-600 hover:text-tiffany-700 transition-colors"
        >
          View all →
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

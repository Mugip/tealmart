'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Star } from 'lucide-react'
import { useCart } from '@/lib/contexts/CartContext'

type Product = {
  id: string
  title: string
  price: number
  compareAtPrice?: number | null
  images: string[]
  rating?: number | null
  reviewCount: number
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.images[0] || '/placeholder.png',
    })
  }

  return (
    <Link href={`/products/${product.id}`} className="card group">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <Image
          src={product.images[0] || '/placeholder.png'}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{discount}%
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-tiffany-600 transition-colors">
          {product.title}
        </h3>
        
        {product.rating && (
          <div className="flex items-center mb-2">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span className="text-sm text-gray-600 ml-1">
              {product.rating.toFixed(1)} ({product.reviewCount})
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </div>
            {product.compareAtPrice && (
              <div className="text-sm text-gray-500 line-through">
                ${product.compareAtPrice.toFixed(2)}
              </div>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            className="bg-tiffany-500 hover:bg-tiffany-600 text-white p-2 rounded-lg transition-colors"
            aria-label="Add to cart"
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </Link>
  )
}

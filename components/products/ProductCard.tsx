// components/products/ProductCard.tsx - COMPLETE VERSION
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Star, Heart } from 'lucide-react'
import { useCart } from '@/lib/contexts/CartContext'
import { useWishlist } from '@/lib/contexts/WishlistContext'
import { useCurrency } from '@/lib/contexts/CurrencyContext'

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
  const { toggle, isWishlisted } = useWishlist()
  const { formatPrice } = useCurrency()
  const wishlisted = isWishlisted(product.id)

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

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    toggle(product.id, product.title)
  }

  return (
    <Link href={`/products/${product.id}`} className="card group relative overflow-hidden bg-white">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <Image
          src={product.images[0] || '/placeholder.png'}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />

        {/* Discount badge */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full">
            -{discount}%
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className={`absolute top-2 right-2 p-1.5 rounded-full shadow-md transition-all ${
            wishlisted
              ? 'bg-red-500 text-white scale-110'
              : 'bg-white/90 text-gray-500 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={15} className={wishlisted ? 'fill-white' : ''} />
        </button>

        {/* Quick add to cart overlay */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
          <button
            onClick={handleAddToCart}
            className="w-full bg-tiffany-600/95 hover:bg-tiffany-700 text-white py-2 text-xs font-semibold flex items-center justify-center gap-1.5 backdrop-blur-sm"
          >
            <ShoppingCart size={14} />
            Quick Add
          </button>
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-tiffany-600 transition-colors text-xs sm:text-sm leading-snug">
          {product.title}
        </h3>

        {product.rating && (
          <div className="flex items-center mb-1.5 gap-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className={i < Math.round(product.rating!) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 fill-gray-200'}
                />
              ))}
            </div>
            <span className="text-[10px] text-gray-500">
              ({product.reviewCount})
            </span>
          </div>
        )}

        <div className="flex items-end flex-wrap gap-1.5">
          <div className="text-sm sm:text-base font-bold text-gray-900">
            {formatPrice(product.price)}
          </div>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <div className="text-[10px] sm:text-xs text-gray-400 line-through">
              {formatPrice(product.compareAtPrice)}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

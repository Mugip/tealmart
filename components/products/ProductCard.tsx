// components/products/ProductCard.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Star, Heart } from 'lucide-react'
import { useCart } from '@/lib/contexts/CartContext'
import { useWishlist } from '@/lib/contexts/WishlistContext'
import { useCurrency } from '@/lib/contexts/CurrencyContext'
import { getSecureImageUrl } from '@/lib/imageUrl'

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
      image: getSecureImageUrl(product.images[0]),
    })
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    toggle(product.id, product.title)
  }

  return (
    <Link 
      href={`/products/${product.id}`} 
      // ✅ FIXED: Added h-full and flex flex-col to force cards to stretch to the tallest item in the row
      className="card group/card relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-tiffany-300 transition-all h-full flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50 flex-shrink-0">
        <Image
          src={getSecureImageUrl(product.images[0])}
          alt={product.title}
          fill
          className="object-cover group-hover/card:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />

        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] sm:text-xs font-black px-2 py-1 rounded-md shadow-sm">
            -{discount}%
          </div>
        )}

        <button
          onClick={handleWishlist}
          className={`absolute top-2 right-2 p-2 rounded-full shadow-md transition-all z-10 ${
            wishlisted
              ? 'bg-red-500 text-white scale-110'
              : 'bg-white/90 text-gray-400 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover/card:opacity-100'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={16} className={wishlisted ? 'fill-white' : ''} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover/card:translate-y-0 transition-transform duration-300 z-10">
          <button
            onClick={handleAddToCart}
            className="w-full bg-tiffany-600/95 hover:bg-tiffany-700 text-white py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 backdrop-blur-sm transition-colors"
          >
            <ShoppingCart size={16} />
            Quick Add
          </button>
        </div>
      </div>

      {/* ✅ FIXED: flex-1 ensures this section expands. min-h controls title space */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        <h3 
          className="font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover/card:text-tiffany-600 transition-colors text-xs sm:text-sm leading-snug"
          // Force it to reserve space for exactly 2 lines (roughly 40px)
          style={{ minHeight: '2.8em' }}
        >
          {product.title}
        </h3>

        {product.rating && (
          <div className="flex items-center mb-2 gap-1.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={i < Math.round(product.rating!) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 fill-gray-200'}
                />
              ))}
            </div>
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
              ({product.reviewCount})
            </span>
          </div>
        )}

        {/* ✅ FIXED: mt-auto forces price to stick to the absolute bottom of the card */}
        <div className="flex items-baseline flex-wrap gap-1.5 mt-auto pt-1">
          <div className="text-sm sm:text-base font-black text-gray-900">
            {formatPrice(product.price)}
          </div>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <div className="text-[10px] sm:text-xs text-gray-400 line-through font-semibold">
              {formatPrice(product.compareAtPrice)}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
              }

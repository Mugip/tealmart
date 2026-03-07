// app/products/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Star, ShoppingCart, Truck, Shield, ArrowLeft } from 'lucide-react'
import { useCart } from '@/lib/contexts/CartContext'
import { useRouter } from 'next/navigation'

interface Variant {
  id: string
  sku: string
  name: string
  price: number
  costPrice?: number
  stock: number
  image?: string
  options: Record<string, string>
}

interface VariantData {
  options: string[]
  items: Variant[]
}

interface Product {
  id: string
  title: string
  description: string
  price: number
  compareAtPrice?: number
  images: string[]
  category: string
  tags: string[]
  rating?: number
  reviewCount: number
  stock: number
  variants?: VariantData
}

// Color mapping for common color names
const COLOR_MAP: Record<string, string> = {
  'red': '#EF4444',
  'blue': '#3B82F6',
  'green': '#10B981',
  'yellow': '#F59E0B',
  'orange': '#F97316',
  'purple': '#A855F7',
  'pink': '#EC4899',
  'black': '#000000',
  'white': '#FFFFFF',
  'gray': '#6B7280',
  'grey': '#6B7280',
  'brown': '#92400E',
  'navy': '#1E3A8A',
  'gold': '#D97706',
  'silver': '#9CA3AF',
  'beige': '#D4B896',
  'maroon': '#7C2D12',
  'teal': '#14B8A6',
  'cyan': '#06B6D4',
  'lime': '#84CC16',
  'indigo': '#6366F1',
  'chocolate': '#7B3F00',
  'coffee': '#6F4E37',
  'camel': '#C19A6B',
  'skyblue': '#38BDF8',
  'royalblue': '#4169E1',
  'olive': '#556B2F',
  'armygreen': '#4B5320',
  'mint': '#98FF98',
  'wine': '#722F37',
  'winered': '#8B0000',
  'ivory': '#FFFFF0',
  'cream': '#FFFDD0',
  'khaki': '#C3B091',
  'rosegold': '#B76E79',
  'bronze': '#CD7F32',
  'lavender': '#E6E6FA',
  'violet': '#8F00FF',
  'turquoise': '#40E0D0',
  'aqua': '#00FFFF'
}

function getColorHex(colorName: string): string | null {
  const normalized = colorName.toLowerCase().trim()
  return COLOR_MAP[normalized] || null
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { addItem } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data)
        if (data.variants?.items?.[0]) {
          setSelectedVariant(data.variants.items[0])
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-tiffany-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-6xl mb-4">😔</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
            <p className="text-gray-600 mb-6">This product may have been removed or is no longer available.</p>
            <button 
              onClick={() => router.push('/products')} 
              className="btn-primary px-8 py-3"
            >
              Browse All Products
            </button>
          </div>
        </div>
      </div>
    )
  }

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0

  const activePrice = selectedVariant?.price ?? product.price
  const activeStock = selectedVariant?.stock ?? product.stock
  const activeImage = selectedVariant?.image || product.images[selectedImage]
  const isInStock = activeStock > 0

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-tiffany-600 mb-8 transition-colors group"
        >
          <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-4">
              <div className="relative aspect-square">
                <Image
                  src={activeImage || '/placeholder.png'}
                  alt={product.title}
                  fill
                  className="object-cover"
                  priority
                />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {discount > 0 && (
                    <div className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                      -{discount}% OFF
                    </div>
                  )}
                  {!isInStock && (
                    <div className="bg-gray-800 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                      Out of Stock
                    </div>
                  )}
                </div>

                {/* Stock Badge */}
                {isInStock && activeStock < 10 && (
                  <div className="absolute bottom-4 left-4 bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                    Only {activeStock} left!
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail Grid */}
            {product.images?.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square bg-white rounded-lg overflow-hidden transition-all ${
                      selectedImage === index
                        ? 'ring-4 ring-tiffany-500 shadow-lg scale-105'
                        : 'ring-1 ring-gray-200 hover:ring-2 hover:ring-tiffany-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.title} - ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6 min-w-0">
            
            {/* Title */}
            <div className="break-words">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 break-words">{product.title}</h1>
              <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">
                {product.category}
              </p>
            </div>

            {/* Rating */}
            {product.rating && (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={
                        i < Math.floor(product.rating!)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }
                    />
                  ))}
                </div>
                <span className="text-gray-600 font-medium">
                  {product.rating.toFixed(1)}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  {product.reviewCount} reviews
                </span>
              </div>
            )}

            {/* Price */}
            <div className="bg-gradient-to-br from-tiffany-50 to-tiffany-100 rounded-2xl p-6 border border-tiffany-200">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-bold text-gray-900">
                  ${activePrice.toFixed(2)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > activePrice && (
                  <span className="text-xl sm:text-2xl text-gray-500 line-through">
                    ${product.compareAtPrice.toFixed(2)}
                  </span>
                )}
              </div>
              {discount > 0 && (
                <p className="text-green-700 font-medium mt-2">
                  You save ${(product.compareAtPrice! - activePrice).toFixed(2)}!
                </p>
              )}
            </div>

            {/* Horizontal Scrollable Variants */}
            {product.variants?.items && product.variants.items.length > 0 && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-4 break-words">
                  Select Variant {selectedVariant && `(${selectedVariant.name})`}
                </h3>
                
                <div className="relative -mx-2 px-2">
                  <div className="overflow-x-auto pb-2 scrollbar-hide">
                    <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
                      {product.variants.items.map((variant) => {
                        const isSelected = selectedVariant?.id === variant.id
                        const hasStock = variant.stock > 0
                        
                        const colorValue = variant.options['Color'] || variant.options['color']
                        const colorHex = colorValue ? getColorHex(colorValue) : null
                        
                        return (
                          <button
                            key={variant.id}
                            onClick={() => {
                              setSelectedVariant(variant)
                              if (variant.image && product.images.includes(variant.image)) {
                                setSelectedImage(product.images.indexOf(variant.image))
                              }
                            }}
                            disabled={!hasStock}
                            className={`flex-shrink-0 w-28 sm:w-32 p-3 rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'border-tiffany-500 bg-tiffany-50 shadow-md'
                                : hasStock
                                ? 'border-gray-200 hover:border-tiffany-300 hover:shadow-sm'
                                : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            {colorHex && (
                              <div className="flex justify-center mb-2">
                                <div 
                                  className="w-8 h-8 rounded-full border-2 border-gray-300"
                                  style={{ 
                                    backgroundColor: colorHex,
                                    boxShadow: colorHex === '#FFFFFF' ? 'inset 0 0 0 1px #e5e7eb' : 'none'
                                  }}
                                />
                              </div>
                            )}
                            
                            {variant.image && (
                              <div className="relative w-full aspect-square mb-2 rounded-lg overflow-hidden">
                                <Image
                                  src={variant.image}
                                  alt={variant.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            
                            <div className="text-xs font-semibold text-gray-900 truncate mb-1" title={Object.values(variant.options).join(' / ') || variant.name}>
                              {Object.values(variant.options).join(' / ') || variant.name}
                            </div>
                            <div className="text-sm font-bold text-tiffany-600">
                              ${variant.price.toFixed(2)}
                            </div>
                            <div className={`text-xs mt-1 ${hasStock ? 'text-green-600' : 'text-red-600'}`}>
                              {hasStock ? `${variant.stock} left` : 'Out of stock'}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  
                  {/* Scroll indicators */}
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                </div>

                {selectedVariant && (
                  <div className="mt-4 pt-4 border-t border-gray-200 text-sm">
                    <span className="text-gray-600">Stock:</span>
                    <span className={`ml-2 font-bold ${isInStock ? 'text-green-600' : 'text-red-600'}`}>
                      {isInStock ? `${activeStock} available` : 'Out of stock'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            {isInStock && (
              <div className="flex flex-wrap items-center gap-4">
                <label className="font-semibold text-gray-900">Quantity:</label>
                <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 font-bold transition"
                  >
                    -
                  </button>
                  <span className="px-6 py-2 font-bold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(activeStock, quantity + 1))}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 font-bold transition"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={() => {
                if (!isInStock) return
                
                for (let i = 0; i < quantity; i++) {
                  addItem({
                    id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
                    title: selectedVariant 
                      ? `${product.title} (${selectedVariant.name})` 
                      : product.title,
                    price: activePrice,
                    image: activeImage,
                  })
                }
              }}
              disabled={!isInStock}
              className={`w-full py-4 rounded-xl text-base sm:text-lg font-bold flex items-center justify-center gap-3 transition-all shadow-lg ${
                isInStock
                  ? 'bg-gradient-to-r from-tiffany-500 to-tiffany-600 hover:from-tiffany-600 hover:to-tiffany-700 text-white hover:shadow-xl hover:scale-[1.02]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ShoppingCart size={24} />
              {isInStock ? `Add ${quantity} to Cart` : 'Out of Stock'}
            </button>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <Truck className="text-tiffany-600 flex-shrink-0 mt-1" size={24} />
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900">Free Shipping</h3>
                  <p className="text-sm text-gray-600">On orders over $50</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <Shield className="text-tiffany-600 flex-shrink-0 mt-1" size={24} />
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900">Secure Payment</h3>
                  <p className="text-sm text-gray-600">100% secure checkout</p>
                </div>
              </div>
            </div>

            {/* Description - FIXED WRAPPING */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 overflow-hidden">
              <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-4">Product Details</h3>
              <div
                className="prose prose-sm max-w-none text-gray-700 break-words overflow-wrap-anywhere"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.filter(tag => !tag.includes('cj')).map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium break-all"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Force text wrapping in descriptions */
        .prose {
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
        }
        
        .prose * {
          max-width: 100%;
          overflow-wrap: break-word;
        }
        
        .prose pre {
          white-space: pre-wrap;
          word-break: break-all;
        }
        
        .prose table {
          display: block;
          overflow-x: auto;
        }
        
        /* Prevent horizontal overflow */
        .overflow-wrap-anywhere {
          overflow-wrap: anywhere;
        }
      `}</style>
    </div>
  )
}

// app/products/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Star, ShoppingCart, Truck, Shield, ArrowLeft, Check, Package } from 'lucide-react'
import { useCart } from '@/lib/contexts/CartContext'
import { useRouter } from 'next/navigation'

interface VariantOption {
  name: string
  value: string
}

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

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { addItem } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data)
        // Auto-select first variant if available
        if (data.variants?.items?.[0]) {
          setSelectedVariant(data.variants.items[0])
          setSelectedOptions(data.variants.items[0].options)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [params.id])

  // Find variant based on selected options
  const findMatchingVariant = (options: Record<string, string>) => {
    if (!product?.variants?.items) return null
    
    return product.variants.items.find(variant => {
      return Object.keys(options).every(key => variant.options[key] === options[key])
    })
  }

  // Handle option selection
  const handleOptionSelect = (optionName: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionName]: value }
    setSelectedOptions(newOptions)
    
    const matchingVariant = findMatchingVariant(newOptions)
    if (matchingVariant) {
      setSelectedVariant(matchingVariant)
      // Update image if variant has one
      if (matchingVariant.image && product) {
        const imgIndex = product.images.indexOf(matchingVariant.image)
        if (imgIndex >= 0) setSelectedImage(imgIndex)
      }
    }
  }

  // Get unique values for each option
  const getOptionValues = (optionName: string): string[] => {
    if (!product?.variants?.items) return []
    
    const values = new Set<string>()
    product.variants.items.forEach(variant => {
      if (variant.options[optionName]) {
        values.add(variant.options[optionName])
      }
    })
    return Array.from(values)
  }

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
        <div className="text-center max-w-md">
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-tiffany-600 mb-8 transition-colors group"
        >
          <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
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
          <div className="space-y-6">
            
            {/* Title */}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{product.title}</h1>
              <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">
                {product.category}
              </p>
            </div>

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-4">
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
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold text-gray-900">
                  ${activePrice.toFixed(2)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > activePrice && (
                  <span className="text-2xl text-gray-500 line-through">
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

            {/* Variant Selection */}
            {product.variants?.options && product.variants.options.length > 0 && (
              <div className="space-y-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 text-lg">Select Options</h3>
                
                {product.variants.options.map(optionName => {
                  const values = getOptionValues(optionName)
                  
                  return (
                    <div key={optionName}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {optionName}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {values.map(value => {
                          const isSelected = selectedOptions[optionName] === value
                          
                          return (
                            <button
                              key={value}
                              onClick={() => handleOptionSelect(optionName, value)}
                              className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                                isSelected
                                  ? 'border-tiffany-500 bg-tiffany-500 text-white shadow-md'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-tiffany-300 hover:bg-tiffany-50'
                              }`}
                            >
                              {value}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                
                {selectedVariant && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">SKU:</span>
                      <span className="font-mono text-gray-900">{selectedVariant.sku}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-600">Stock:</span>
                      <span className={`font-bold ${isInStock ? 'text-green-600' : 'text-red-600'}`}>
                        {isInStock ? `${activeStock} available` : 'Out of stock'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            {isInStock && (
              <div className="flex items-center gap-4">
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
                    id: product.id,
                    title: product.title,
                    price: activePrice,
                    image: activeImage,
                  })
                }
              }}
              disabled={!isInStock}
              className={`w-full py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-3 transition-all shadow-lg ${
                isInStock
                  ? 'bg-gradient-to-r from-tiffany-500 to-tiffany-600 hover:from-tiffany-600 hover:to-tiffany-700 text-white hover:shadow-xl hover:scale-[1.02]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ShoppingCart size={24} />
              {isInStock ? 'Add to Cart' : 'Out of Stock'}
            </button>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <Truck className="text-tiffany-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-bold text-gray-900">Free Shipping</h3>
                  <p className="text-sm text-gray-600">On orders over $50</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <Shield className="text-tiffany-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-bold text-gray-900">Secure Payment</h3>
                  <p className="text-sm text-gray-600">100% secure checkout</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Product Details</h3>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

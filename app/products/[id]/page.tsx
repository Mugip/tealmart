'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Star, ShoppingCart, Truck, Shield, ArrowLeft } from 'lucide-react'
import { useCart } from '@/lib/contexts/CartContext'
import { useRouter } from 'next/navigation'

interface Variant {
  sku?: string
  color?: string
  size?: string
  price?: number
  stock?: number
  image?: string
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { addItem } = useCart()

  const [product, setProduct] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data)
        setSelectedVariant(data?.variants?.[0] || null)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tiffany-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <button onClick={() => router.push('/products')} className="btn-primary">
            Back to Products
          </button>
        </div>
      </div>
    )
  }

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0

  const activePrice = selectedVariant?.price ?? product.price
  const activeImage = selectedVariant?.image || product.images[selectedImage]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-tiffany-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Images */}
          <div>
            <div className="bg-white rounded-lg overflow-hidden mb-4">
              <div className="relative aspect-square">
                <Image
                  src={activeImage || '/placeholder.png'}
                  alt={product.title}
                  fill
                  className="object-cover"
                  priority
                />
                {discount > 0 && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded">
                    -{discount}% OFF
                  </div>
                )}
              </div>
            </div>

            {product.images?.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImage(index)
                      setSelectedVariant(null)
                    }}
                    className={`relative aspect-square bg-white rounded-lg overflow-hidden ${
                      activeImage === image ? 'ring-2 ring-tiffany-500' : ''
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
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.title}</h1>

            {product.rating && (
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={
                        i < Math.floor(product.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }
                    />
                  ))}
                </div>
                <span className="ml-2 text-gray-600">
                  {product.rating.toFixed(1)} ({product.reviewCount} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-gray-900">
                  ${activePrice.toFixed(2)}
                </span>
                {product.compareAtPrice && (
                  <span className="text-2xl text-gray-500 line-through">
                    ${product.compareAtPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Variants</h3>
                <div className="grid grid-cols-2 gap-2">
                  {product.variants.map((variant: Variant, index: number) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedVariant(variant)
                        if (variant.image) {
                          const imageIndex = product.images.indexOf(variant.image)
                          if (imageIndex >= 0) setSelectedImage(imageIndex)
                        }
                      }}
                      className={`border rounded-lg p-3 text-left transition ${
                        selectedVariant === variant
                          ? 'border-tiffany-500 bg-tiffany-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="font-medium">
                        {variant.color || variant.size || variant.sku || 'Variant'}
                      </div>
                      {variant.price && (
                        <div className="text-sm text-gray-600">
                          ${variant.price.toFixed(2)}
                        </div>
                      )}
                      {variant.stock !== undefined && (
                        <div className="text-xs text-gray-500">
                          Stock: {variant.stock}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart (FIXED: no variant field) */}
            <button
              onClick={() =>
                addItem({
                  id: product.id,
                  title: product.title,
                  price: activePrice,
                  image: activeImage,
                })
              }
              className="btn-primary w-full py-4 text-lg mb-6 flex items-center justify-center gap-2"
            >
              <ShoppingCart size={24} />
              Add to Cart
            </button>

            {/* Trust Badges */}
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Truck className="text-tiffany-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-900">Free Shipping</h3>
                  <p className="text-sm text-gray-600">On orders over $50</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="text-tiffany-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-900">Secure Payment</h3>
                  <p className="text-sm text-gray-600">100% secure checkout</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
        }

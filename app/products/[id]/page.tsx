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

/* ---------------- COLOR SYSTEM UPGRADE ---------------- */

// Large professional ecommerce color map
const COLOR_MAP: Record<string, string> = {

  red:'#EF4444',
  blue:'#3B82F6',
  green:'#10B981',
  yellow:'#F59E0B',
  orange:'#F97316',
  purple:'#A855F7',
  pink:'#EC4899',

  black:'#000000',
  white:'#FFFFFF',
  gray:'#6B7280',
  grey:'#6B7280',
  silver:'#9CA3AF',
  gold:'#D97706',

  brown:'#92400E',
  chocolate:'#7B3F00',
  coffee:'#6F4E37',
  camel:'#C19A6B',

  navy:'#1E3A8A',
  skyblue:'#38BDF8',
  royalblue:'#4169E1',

  olive:'#556B2F',
  armygreen:'#4B5320',
  mint:'#98FF98',
  lime:'#84CC16',

  maroon:'#7C2D12',
  wine:'#722F37',
  winered:'#8B0000',

  ivory:'#FFFFF0',
  cream:'#FFFDD0',
  beige:'#D4B896',
  khaki:'#C3B091',

  rosegold:'#B76E79',
  bronze:'#CD7F32',

  lavender:'#E6E6FA',
  violet:'#8F00FF',

  teal:'#14B8A6',
  cyan:'#06B6D4',
  turquoise:'#40E0D0',
  aqua:'#00FFFF'
}

// Normalize color names like "Army Green" → "armygreen"
function normalizeColor(color:string){
  return color
    .toLowerCase()
    .replace(/\s+/g,'')
    .replace('-','')
}

// Smart color resolver
function getColorHex(colorName:string){

  const key = normalizeColor(colorName)

  if(COLOR_MAP[key]) return COLOR_MAP[key]

  // fallback color if unknown
  return '#9CA3AF'
}

/* ------------------------------------------------------ */

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

        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-tiffany-600 mb-8 transition-colors group"
        >
          <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Image section remains unchanged */}

          {/* ---------------- VARIANT SECTION ---------------- */}

          {product.variants?.items && product.variants.items.length > 0 && (

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">

              <h3 className="font-bold text-gray-900 text-lg mb-4">
                Select Variant {selectedVariant && `(${selectedVariant.name})`}
              </h3>

              <div className="relative">

                <div className="overflow-x-auto pb-2 scrollbar-hide">

                  <div className="flex gap-3" style={{ minWidth: 'min-content' }}>

                    {product.variants.items.map((variant) => {

                      const isSelected = selectedVariant?.id === variant.id
                      const hasStock = variant.stock > 0

                      const colorValue =
                        variant.options['Color'] ||
                        variant.options['color']

                      const colorHex =
                        colorValue
                          ? getColorHex(colorValue)
                          : null

                      return (

                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          disabled={!hasStock}
                          className={`flex-shrink-0 w-32 p-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-tiffany-500 bg-tiffany-50 shadow-md'
                              : hasStock
                              ? 'border-gray-200 hover:border-tiffany-300 hover:shadow-sm'
                              : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          }`}
                        >

                          {/* Color Circle */}

                          {colorHex && (

                            <div className="flex justify-center mb-2">

                              <div
                                className="w-8 h-8 rounded-full border-2 border-gray-300"
                                style={{
                                  backgroundColor: colorHex,
                                  boxShadow:
                                    colorHex === '#FFFFFF'
                                      ? 'inset 0 0 0 1px #e5e7eb'
                                      : 'none'
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

                          <div className="text-xs font-semibold text-gray-900 truncate mb-1">
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

              </div>

              {/* SKU REMOVED — only stock remains */}

              {selectedVariant && (

                <div className="mt-4 pt-4 border-t border-gray-200 text-sm">

                  <span className="text-gray-600">Stock:</span>

                  <span className={`ml-2 font-bold ${isInStock ? 'text-green-600' : 'text-red-600'}`}>

                    {isInStock
                      ? `${activeStock} available`
                      : 'Out of stock'}

                  </span>

                </div>

              )}

            </div>

          )}

        </div>

      </div>

    </div>
  )
  }

'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  Star, ShoppingCart, Truck, Shield, ArrowLeft,
  ChevronLeft, ChevronRight, X, ZoomIn, Heart, Share2, RotateCcw,
} from 'lucide-react'
import { useCart } from '@/lib/contexts/CartContext'
import { useWishlist } from '@/lib/contexts/WishlistContext'
import { useRouter } from 'next/navigation'
import RelatedProducts from '@/components/products/RelatedProducts'
import RecentlyViewed, { recordRecentlyViewed } from '@/components/products/RecentlyViewed'
import ReviewSection from '@/components/products/ReviewSection'
import SocialProof from '@/components/products/SocialProof'
import toast from 'react-hot-toast'

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

export default function ProductPageClient({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { addItem } = useCart()
  const { toggle, isWishlisted } = useWishlist()

  const [product, setProduct] = useState<Product | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isZoomed, setIsZoomed] = useState(false)
  const [allImages, setAllImages] = useState<string[]>([])
  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data)

        const productImages = data.images || []
        const variantImages = data.variants?.items
          ?.map((v: Variant) => v.image)
          ?.filter((img: string | undefined) => img && !productImages.includes(img)) || []

        const combinedImages = [...productImages, ...variantImages]
        setAllImages(combinedImages)

        if (data.variants?.items?.[0]) {
          setSelectedVariant(data.variants.items[0])
        }

        recordRecentlyViewed({
          id: data.id,
          title: data.title,
          price: data.price,
          image: data.images?.[0] || '',
        })

        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-gray-200 rounded-2xl aspect-square animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
              <div className="h-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
            </div>
          </div>
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
            <p className="text-gray-600 mb-6">
              This product may have been removed or is no longer available.
            </p>
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

  const wishlisted = isWishlisted(product.id)
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0

  const activePrice = selectedVariant?.price ?? product.price
  const activeStock = selectedVariant?.stock ?? product.stock
  const activeImage = allImages[selectedImage] || product.images[0]
  const isInStock = activeStock > 0

  const nextImage = () => setSelectedImage(prev => (prev + 1) % allImages.length)
  const prevImage = () => setSelectedImage(prev => (prev - 1 + allImages.length) % allImages.length)

  const handleAddToCart = () => {
    if (!isInStock) return
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
        title: selectedVariant ? `${product.title} (${selectedVariant.name})` : product.title,
        price: activePrice,
        image: activeImage,
      })
    }
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleShare = async () => {
    try {
      await navigator.share({ title: product.title, url: window.location.href })
    } catch {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden pb-24 lg:pb-0">
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

          {/* ── Image Gallery ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-4">
              <div className="relative aspect-square group">
                <Image
                  src={activeImage || '/placeholder.png'}
                  alt={product.title}
                  fill
                  className="object-cover cursor-pointer"
                  priority
                  onClick={() => setIsZoomed(true)}
                />

                {/* Zoom icon */}
                <button
                  onClick={() => setIsZoomed(true)}
                  className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <ZoomIn size={20} className="text-gray-700" />
                </button>

                {/* Prev / Next arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft size={24} className="text-gray-700" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight size={24} className="text-gray-700" />
                    </button>
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                      {selectedImage + 1} / {allImages.length}
                    </div>
                  </>
                )}

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

                {isInStock && activeStock < 10 && (
                  <div className="absolute bottom-4 left-4 bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                    Only {activeStock} left!
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex gap-2" style={{ minWidth: 'min-content' }}>
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 relative bg-white rounded-lg overflow-hidden transition-all ${
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
              </div>
            )}
          </div>

          {/* ── Product Info ── */}
          <SocialProof productId={product.id} stock={activeStock} />
          <div className="space-y-6 min-w-0">

            {/* Title + action buttons */}
            <div className="flex items-start justify-between gap-3">
              <div className="break-words flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 break-words">
                  {product.title}
                </h1>
                <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">
                  {product.category}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => toggle(product.id, product.title)}
                  className={`p-2.5 rounded-xl border-2 transition-all ${
                    wishlisted
                      ? 'border-red-500 bg-red-50 text-red-500'
                      : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400'
                  }`}
                  aria-label="Add to wishlist"
                >
                  <Heart size={20} className={wishlisted ? 'fill-red-500' : ''} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-xl border-2 border-gray-200 text-gray-400 hover:border-tiffany-300 hover:text-tiffany-500 transition-all"
                  aria-label="Share product"
                >
                  <Share2 size={20} />
                </button>
              </div>
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
                <span className="text-gray-600 font-medium">{product.rating.toFixed(1)}</span>
                <span className="text-gray-400">•</span>
                <a href="#reviews" className="text-tiffany-600 hover:underline text-sm font-medium">
                  {product.reviewCount} reviews
                </a>
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

            {/* Variants */}
            {product.variants?.items && product.variants.items.length > 0 && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-4 break-words">
                  Select Variant {selectedVariant && `(${selectedVariant.name})`}
                </h3>
                <div className="relative -mx-2 px-2">
                  <div className="overflow-x-auto pb-2 scrollbar-hide">
                    <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
                      {product.variants.items.map(variant => {
                        const isSelected = selectedVariant?.id === variant.id
                        const hasStock = variant.stock > 0
                        return (
                          <button
                            key={variant.id}
                            onClick={() => {
                              setSelectedVariant(variant)
                              if (variant.image && allImages.includes(variant.image)) {
                                setSelectedImage(allImages.indexOf(variant.image))
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
                            <div
                              className="text-xs font-semibold text-gray-900 truncate mb-1"
                              title={Object.values(variant.options).join(' / ') || variant.name}
                            >
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
              </div>
            )}

            {/* Quantity */}
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

            {/* Add to Cart — Desktop */}
            <div className="hidden lg:block">
              <button
                onClick={handleAddToCart}
                disabled={!isInStock}
                className={`w-full py-4 rounded-xl text-base sm:text-lg font-bold flex items-center justify-center gap-3 transition-all shadow-lg ${
                  isInStock
                    ? addedToCart
                      ? 'bg-green-500 text-white scale-[1.01]'
                      : 'bg-gradient-to-r from-tiffany-500 to-tiffany-600 hover:from-tiffany-600 hover:to-tiffany-700 text-white hover:shadow-xl hover:scale-[1.02]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCart size={24} />
                {addedToCart ? '✓ Added to Cart!' : isInStock ? `Add ${quantity} to Cart` : 'Out of Stock'}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-200">
              {[
                { icon: <Truck size={20} />, title: 'Free Shipping', sub: 'On orders over $50' },
                { icon: <Shield size={20} />, title: 'Secure Payment', sub: '100% safe checkout' },
                { icon: <RotateCcw size={20} />, title: 'Easy Returns', sub: '30-day return policy' },
              ].map(({ icon, title, sub }) => (
                <div key={title} className="flex items-start gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                  <span className="text-tiffany-600 flex-shrink-0 mt-0.5">{icon}</span>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
                    <p className="text-xs text-gray-600">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 overflow-hidden">
              <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-4">Product Details</h3>
              <div
                className="product-description prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.filter(tag => !tag.includes('cj')).map(tag => (
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

        {/* Reviews */}
        <div id="reviews">
          <ReviewSection
            productId={product.id}
            productRating={product.rating}
            reviewCount={product.reviewCount}
          />
        </div>

        {/* Related Products */}
        <RelatedProducts productId={product.id} category={product.category} />

        {/* Recently Viewed */}
        <RecentlyViewed excludeId={product.id} />
      </div>

      {/* Sticky Mobile Add to Cart */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-2xl z-40">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 truncate">{product.title}</div>
            <div className="font-bold text-gray-900">${activePrice.toFixed(2)}</div>
          </div>
          <button
            onClick={() => toggle(product.id, product.title)}
            className={`p-3 rounded-xl border-2 transition-all flex-shrink-0 ${
              wishlisted
                ? 'border-red-500 bg-red-50 text-red-500'
                : 'border-gray-200 text-gray-400'
            }`}
          >
            <Heart size={20} className={wishlisted ? 'fill-red-500' : ''} />
          </button>
          <button
            onClick={handleAddToCart}
            disabled={!isInStock}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all flex-shrink-0 ${
              isInStock
                ? addedToCart
                  ? 'bg-green-500 text-white'
                  : 'bg-tiffany-500 hover:bg-tiffany-600 text-white'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart size={18} />
            {addedToCart ? 'Added!' : isInStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>

      {/* Zoom Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all z-10"
          >
            <X size={24} className="text-white" />
          </button>

          <div className="relative max-w-6xl max-h-[90vh] w-full h-full">
            <Image
              src={activeImage || '/placeholder.png'}
              alt={product.title}
              fill
              className="object-contain"
              onClick={e => e.stopPropagation()}
            />
          </div>

          {allImages.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prevImage() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-4 rounded-full transition-all"
              >
                <ChevronLeft size={32} className="text-white" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); nextImage() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-4 rounded-full transition-all"
              >
                <ChevronRight size={32} className="text-white" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-4 py-2 rounded-full">
                {selectedImage + 1} / {allImages.length}
              </div>
            </>
          )}
        </div>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .product-description { word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; }
        .product-description * { max-width: 100%; }
        .product-description img { display: block !important; max-width: 100% !important; height: auto !important; margin: 1rem 0 !important; border-radius: 0.5rem; }
        .product-description p { margin-bottom: 1rem; line-height: 1.6; }
        .product-description table { display: block; overflow-x: auto; margin: 1rem 0; border-collapse: collapse; width: 100%; }
        .product-description table td,
        .product-description table th { padding: 0.5rem; border: 1px solid #e5e7eb; }
      `}</style>
    </div>
  )
}

// app/products/[id]/ProductPageClient.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Star, ShoppingCart, Truck, Shield, ArrowLeft, ChevronLeft, ChevronRight, X, ZoomIn, Heart, Share2, RotateCcw } from 'lucide-react'
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
  stock: number
  image?: string
  options: Record<string, string>
}

export default function ProductPageClient({ initialProduct }: { initialProduct: any }) {
  const router = useRouter()
  const { addItem } = useCart()
  const { toggle, isWishlisted } = useWishlist()

  const product = initialProduct
  const wishlisted = isWishlisted(product.id)

  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(product.variants?.items?.[0] || null)
  const[quantity, setQuantity] = useState(1)
  const [isZoomed, setIsZoomed] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  const productImages = product.images ||[]
  const variantImages = product.variants?.items
    ?.map((v: Variant) => v.image)
    ?.filter((img: string) => img && !productImages.includes(img)) ||[]
  const allImages = [...productImages, ...variantImages]

  useEffect(() => {
    recordRecentlyViewed({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.images?.[0] || '',
    })
  }, [product])

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
        <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-tiffany-600 mb-8 transition-colors group">
          <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-4">
              <div className="relative aspect-square group">
                <Image src={activeImage || '/placeholder.png'} alt={product.title} fill className="object-cover cursor-pointer" priority onClick={() => setIsZoomed(true)} />
                <button onClick={() => setIsZoomed(true)} className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100">
                  <ZoomIn size={20} className="text-gray-700" />
                </button>
                {allImages.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100">
                      <ChevronLeft size={24} className="text-gray-700" />
                    </button>
                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100">
                      <ChevronRight size={24} className="text-gray-700" />
                    </button>
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                      {selectedImage + 1} / {allImages.length}
                    </div>
                  </>
                )}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {discount > 0 && <div className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">-{discount}% OFF</div>}
                  {!isInStock && <div className="bg-gray-800 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">Out of Stock</div>}
                </div>
                {isInStock && activeStock < 10 && (
                  <div className="absolute bottom-4 left-4 bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">Only {activeStock} left!</div>
                )}
              </div>
            </div>

            {allImages.length > 1 && (
              <div className="overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex gap-2" style={{ minWidth: 'min-content' }}>
                  {allImages.map((image, index) => (
                    <button key={index} onClick={() => setSelectedImage(index)} className={`flex-shrink-0 w-20 h-20 relative bg-white rounded-lg overflow-hidden transition-all ${selectedImage === index ? 'ring-4 ring-tiffany-500 shadow-lg scale-105' : 'ring-1 ring-gray-200 hover:ring-2 hover:ring-tiffany-300'}`}>
                      <Image src={image} alt={`${product.title} - ${index + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6 min-w-0">
            <SocialProof productId={product.id} stock={activeStock} />
            <div className="flex items-start justify-between gap-3">
              <div className="break-words flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 break-words">{product.title}</h1>
                <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">{product.category}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => toggle(product.id, product.title)} className={`p-2.5 rounded-xl border-2 transition-all ${wishlisted ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400'}`}>
                  <Heart size={20} className={wishlisted ? 'fill-red-500' : ''} />
                </button>
                <button onClick={handleShare} className="p-2.5 rounded-xl border-2 border-gray-200 text-gray-400 hover:border-tiffany-300 hover:text-tiffany-500 transition-all">
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            {product.rating && (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={20} className={i < Math.floor(product.rating!) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                  ))}
                </div>
                <span className="text-gray-600 font-medium">{product.rating.toFixed(1)}</span>
                <span className="text-gray-400">•</span>
                <a href="#reviews" className="text-tiffany-600 hover:underline text-sm font-medium">{product.reviewCount} reviews</a>
              </div>
            )}

            <div className="bg-gradient-to-br from-tiffany-50 to-tiffany-100 rounded-2xl p-6 border border-tiffany-200">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-bold text-gray-900">${activePrice.toFixed(2)}</span>
                {product.compareAtPrice && product.compareAtPrice > activePrice && (
                  <span className="text-xl sm:text-2xl text-gray-500 line-through">${product.compareAtPrice.toFixed(2)}</span>
                )}
              </div>
              {discount > 0 && <p className="text-green-700 font-medium mt-2">You save ${(product.compareAtPrice! - activePrice).toFixed(2)}!</p>}
            </div>

            {product.variants?.items && product.variants.items.length > 0 && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-4 break-words">Select Variant {selectedVariant && `(${selectedVariant.name})`}</h3>
                <div className="relative -mx-2 px-2">
                  <div className="overflow-x-auto pb-2 scrollbar-hide">
                    <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
                      {product.variants.items.map((variant: Variant) => {
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
                            className={`flex-shrink-0 w-28 sm:w-32 p-3 rounded-xl border-2 transition-all ${isSelected ? 'border-tiffany-500 bg-tiffany-50 shadow-md' : hasStock ? 'border-gray-200 hover:border-tiffany-300 hover:shadow-sm' : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'}`}
                          >
                            {variant.image && (
                              <div className="relative w-full aspect-square mb-2 rounded-lg overflow-hidden">
                                <Image src={variant.image} alt={variant.name} fill className="object-cover" />
                              </div>
                            )}
                            <div className="text-xs font-semibold text-gray-900 truncate mb-1" title={variant.name}>{variant.name}</div>
                            <div className="text-sm font-bold text-tiffany-600">${variant.price.toFixed(2)}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isInStock && (
              <div className="flex flex-wrap items-center gap-4">
                <label className="font-semibold text-gray-900">Quantity:</label>
                <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 font-bold transition">-</button>
                  <span className="px-6 py-2 font-bold text-lg">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(activeStock, quantity + 1))} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 font-bold transition">+</button>
                </div>
              </div>
            )}

            <div className="hidden lg:block">
              <button
                onClick={handleAddToCart}
                disabled={!isInStock}
                className={`w-full py-4 rounded-xl text-base sm:text-lg font-bold flex items-center justify-center gap-3 transition-all shadow-lg ${isInStock ? addedToCart ? 'bg-green-500 text-white scale-[1.01]' : 'bg-gradient-to-r from-tiffany-500 to-tiffany-600 hover:from-tiffany-600 hover:to-tiffany-700 text-white hover:shadow-xl hover:scale-[1.02]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                <ShoppingCart size={24} />
                {addedToCart ? '✓ Added to Cart!' : isInStock ? `Add ${quantity} to Cart` : 'Out of Stock'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-200">
              {[{ icon: <Truck size={20} />, title: 'Free Shipping', sub: 'On orders over $50' }, { icon: <Shield size={20} />, title: 'Secure Payment', sub: '100% safe checkout' }, { icon: <RotateCcw size={20} />, title: 'Easy Returns', sub: '30-day return policy' }].map(({ icon, title, sub }) => (
                <div key={title} className="flex items-start gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                  <span className="text-tiffany-600 flex-shrink-0 mt-0.5">{icon}</span>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
                    <p className="text-xs text-gray-600">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 overflow-hidden">
              <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-4">Product Details</h3>
              <div className="product-description prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>
          </div>
        </div>

        {/* Upsell */}
        <UpsellSection 
          currentCategoryId={product.category} 
          excludeId={product.id}
        />

        <div id="reviews">
          <ReviewSection productId={product.id} productRating={product.rating} reviewCount={product.reviewCount} />
        </div>
        <RelatedProducts productId={product.id} category={product.category} />
        <RecentlyViewed excludeId={product.id} />
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-2xl z-40">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 truncate">{product.title}</div>
            <div className="font-bold text-gray-900">${activePrice.toFixed(2)}</div>
          </div>
          <button onClick={handleAddToCart} disabled={!isInStock} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all flex-shrink-0 ${isInStock ? addedToCart ? 'bg-green-500 text-white' : 'bg-tiffany-500 hover:bg-tiffany-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
            <ShoppingCart size={18} />
            {addedToCart ? 'Added!' : isInStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>

      {isZoomed && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={() => setIsZoomed(false)}>
          <button onClick={() => setIsZoomed(false)} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all z-10"><X size={24} className="text-white" /></button>
          <div className="relative max-w-6xl max-h-[90vh] w-full h-full">
            <Image src={activeImage || '/placeholder.png'} alt={product.title} fill className="object-contain" onClick={e => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  )
                }

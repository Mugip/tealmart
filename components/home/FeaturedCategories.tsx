// components/home/FeaturedCategories.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, ShoppingBag } from 'lucide-react'
import { formatCategoryName, getCategoryIcon } from '@/lib/productClassifier'
import { useCurrency } from '@/lib/contexts/CurrencyContext' // ✅ Currency Integration
import Image from 'next/image'
import { getSecureImageUrl } from '@/lib/imageUrl'

interface Category {
  name: string
  count: number
  slug: string
  sampleProduct: {
    id: string
    title: string
    price: number
    images: string[]
  } | null
}

interface FeaturedCategoriesProps {
  categories: Category[]
}

export default function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  const { formatPrice } = useCurrency()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  // Handle Arrow Visibility based on scroll position
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setShowLeftArrow(scrollLeft > 10)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current
      const scrollAmount = direction === 'left' ? -clientWidth : clientWidth
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  if (categories.length === 0) return null

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <ShoppingBag className="text-tiffany-600" />
              Shop by Category
            </h2>
            <p className="mt-3 text-gray-500 text-base sm:text-lg font-medium leading-relaxed">
              Explore our curated collections. From high-tech gadgets to daily essentials, find exactly what you need.
            </p>
          </div>
          
          <Link
            href="/categories"
            className="hidden md:flex items-center gap-2 text-tiffany-600 font-bold hover:text-tiffany-700 transition-colors group"
          >
            Explore All
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Carousel Container */}
        <div className="relative group">
          
          {/* Desktop Navigation Buttons (hidden on mobile) */}
          {showLeftArrow && (
            <button
              onClick={() => scroll('left')}
              className="absolute -left-5 top-1/2 -translate-y-1/2 z-30 bg-white shadow-2xl rounded-full p-4 hover:bg-tiffany-50 transition-all text-gray-800 hidden md:flex items-center justify-center border border-gray-100"
              aria-label="Scroll Left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {showRightArrow && (
            <button
              onClick={() => scroll('right')}
              className="absolute -right-5 top-1/2 -translate-y-1/2 z-30 bg-white shadow-2xl rounded-full p-4 hover:bg-tiffany-50 transition-all text-gray-800 hidden md:flex items-center justify-center border border-gray-100"
              aria-label="Scroll Right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Categories Horizontal Scroll */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-5 sm:gap-8 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-8 px-2 -mx-2"
          >
            {categories.map((category) => (
              <div
                key={category.slug}
                className="flex-shrink-0 w-[85%] sm:w-[45%] lg:w-[31%] snap-center"
              >
                <div
                  onClick={() => window.location.href = `/products?category=${category.slug}`}
                  className="relative h-full bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 hover:border-tiffany-300 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer group flex flex-col"
                >
                  
                  {/* Decorative Background Element */}
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                    <div className="text-[120px] font-black leading-none select-none">
                      {getCategoryIcon(category.slug)}
                    </div>
                  </div>

                  {/* Category Info */}
                  <div className="relative z-10 mb-8">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-4xl mb-5 group-hover:bg-tiffany-100 group-hover:scale-110 transition-all duration-500">
                      {getCategoryIcon(category.slug)}
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-1 leading-tight group-hover:text-tiffany-600 transition-colors">
                      {formatCategoryName(category.name)}
                    </h3>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                      {category.count.toLocaleString()} PRODUCTS
                    </p>
                  </div>

                  {/* Sample Product "Preview" Card */}
                  {category.sampleProduct && (
                    <div className="relative mt-auto bg-gray-50 rounded-[1.5rem] p-4 border border-gray-100 group-hover:bg-white group-hover:border-tiffany-100 transition-all duration-500">
                      
                      {/* Badge */}
                      <div className="absolute -top-3 left-4 bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                        <Sparkles size={10} className="text-tiffany-400" />
                        TRENDING
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-white shadow-sm flex-shrink-0">
                          <Image
                            src={getSecureImageUrl(category.sampleProduct.images[0])}
                            alt={category.sampleProduct.title}
                            fill
                            sizes="80px"
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 line-clamp-1 mb-1">
                            {category.sampleProduct.title}
                          </p>
                          <p className="text-lg font-black text-tiffany-600">
                            {formatPrice(category.sampleProduct.price)} {/* ✅ Converts correctly */}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Link indicator */}
                  <div className="mt-6 flex items-center gap-2 text-sm font-bold text-gray-300 group-hover:text-tiffany-500 transition-colors">
                    Browse Collection
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile View All Link */}
        <div className="text-center mt-6 md:hidden">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-tiffany-600 font-bold"
          >
            Explore All Categories
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  )
}

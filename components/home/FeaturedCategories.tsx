// components/home/FeaturedCategories.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { formatCategoryName, getCategoryIcon } from '@/lib/productClassifier'
import Image from 'next/image'

interface Category {
  name: string
  count: number
  slug: string
  sampleProduct: {
    id: string
    title: string
    price: number
    images: string[]
  } | null  // Changed from undefined to null
}

interface FeaturedCategoriesProps {
  categories: Category[]
}

export default function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)

  // Auto-scroll every 4 seconds
  useEffect(() => {
    if (!isAutoScrolling) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % categories.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isAutoScrolling, categories.length])

  const scrollToIndex = (index: number) => {
    setCurrentIndex(index)
    setIsAutoScrolling(false)
    setTimeout(() => setIsAutoScrolling(true), 10000) // Resume auto-scroll after 10s
  }

  const nextSlide = () => {
    scrollToIndex((currentIndex + 1) % categories.length)
  }

  const prevSlide = () => {
    scrollToIndex((currentIndex - 1 + categories.length) % categories.length)
  }

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Shop by Category
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Explore our {categories.length} popular categories
          </p>
        </div>

        {/* Category Carousel */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 sm:p-3 hover:bg-gray-50 transition-all -ml-4 sm:-ml-6"
            aria-label="Previous category"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 sm:p-3 hover:bg-gray-50 transition-all -mr-4 sm:-mr-6"
            aria-label="Next category"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          </button>

          {/* Categories Container */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {categories.map((category) => (
                <div
                  key={category.slug}
                  className="w-full flex-shrink-0 px-2"
                >
                  <Link href={`/products?category=${category.slug}`}>
                    <div className="bg-gradient-to-br from-tiffany-50 to-purple-50 rounded-2xl p-6 sm:p-8 hover:shadow-xl transition-all group cursor-pointer border-2 border-tiffany-100 hover:border-tiffany-300">
                      
                      {/* Category Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="text-4xl sm:text-5xl">
                            {getCategoryIcon(category.slug)}
                          </div>
                          <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-tiffany-600 transition-colors">
                              {formatCategoryName(category.name)}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {category.count} products
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-6 h-6 text-tiffany-600 group-hover:translate-x-2 transition-transform" />
                      </div>

                      {/* Sample Product Preview (if available) */}
                      {category.sampleProduct && (
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              <Image
                                src={category.sampleProduct.images[0] || '/placeholder.png'}
                                alt={category.sampleProduct.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                                {category.sampleProduct.title}
                              </p>
                              <p className="text-lg font-bold text-tiffany-600">
                                ${category.sampleProduct.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {categories.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-tiffany-600'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to category ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* View All Categories Link */}
        <div className="text-center mt-8">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-tiffany-500 to-tiffany-600 text-white font-bold rounded-xl hover:shadow-lg transition-all group"
          >
            View All Categories
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}

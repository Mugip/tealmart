// components/home/Hero.tsx
'use client'

import { useState, useEffect, useCallback, TouchEvent } from 'react'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Star, ChevronLeft, ChevronRight, Zap, TrendingUp, ShoppingBag, Sparkles } from 'lucide-react'
import { useCurrency } from '@/lib/contexts/CurrencyContext'
import Image from 'next/image'

interface HeroProps {
  stats: {
    totalProducts: number
    totalCategories: number
    avgRating: number
  }
  products: any[] // Real items from database
}

export default function Hero({ stats, products }: HeroProps) {
  const { formatPrice } = useCurrency()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Use the first 5 featured products as slides, or fallback if none
  const displayItems = products?.length > 0 ? products.slice(0, 5) : []

  const nextSlide = useCallback(() => {
    if (displayItems.length === 0) return
    setCurrentIndex((prev) => (prev === displayItems.length - 1 ? 0 : prev + 1))
  }, [displayItems.length])

  const prevSlide = () => {
    if (displayItems.length === 0) return
    setCurrentIndex((prev) => (prev === 0 ? displayItems.length - 1 : prev - 1))
  }

  useEffect(() => {
    if (isHovered || displayItems.length <= 1) return
    const timer = setInterval(nextSlide, 6000)
    return () => clearInterval(timer)
  }, [isHovered, nextSlide, displayItems.length])

  // Swipe logic
  const handleTouchStart = (e: TouchEvent) => setTouchStart(e.targetTouches[0].clientX)
  const handleTouchMove = (e: TouchEvent) => setTouchEnd(e.targetTouches[0].clientX)
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    if (touchStart - touchEnd > 50) nextSlide()
    if (touchStart - touchEnd < -50) prevSlide()
  }

  if (displayItems.length === 0) return null

  return (
    <div 
      className="relative h-[80vh] md:h-[85vh] w-full overflow-hidden bg-gray-950 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. Main Carousel Backgrounds */}
      <div 
        className="flex w-full h-full absolute top-0 left-0 transition-transform duration-1000 cubic-bezier(0.4, 0, 0.2, 1)"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {displayItems.map((product, idx) => (
          <div key={product.id} className="w-full h-full flex-shrink-0 relative overflow-hidden">
            {/* Massive Background Image */}
            <Image 
              src={product.images[0]} 
              alt={product.title}
              fill
              priority={idx === 0}
              className="object-cover opacity-50 scale-105 group-hover:scale-100 transition-transform duration-[10s]"
            />
            {/* Advanced Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
          </div>
        ))}
      </div>

      {/* 2. Content Layer */}
      <div className="absolute inset-0 z-20 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl space-y-6 md:space-y-8">
            
            {/* Dynamic Badge */}
            <div className="inline-flex items-center gap-2 bg-tiffany-500/20 backdrop-blur-md border border-tiffany-500/30 px-4 py-2 rounded-full text-tiffany-400 text-xs md:text-sm font-black tracking-widest uppercase animate-in fade-in slide-in-from-left duration-700">
              <Sparkles size={16} />
              {displayItems[currentIndex].reviewCount > 100 ? 'Best Seller' : 'Featured Arrival'}
            </div>

            {/* Title & Price */}
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-150">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter">
                {displayItems[currentIndex].title.split(' ').slice(0, 4).join(' ')}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-tiffany-400 to-emerald-300">
                  Exclusive Deal
                </span>
              </h1>
              
              <div className="flex items-center gap-4">
                <span className="text-3xl md:text-5xl font-black text-white">
                  {formatPrice(displayItems[currentIndex].price)}
                </span>
                {displayItems[currentIndex].compareAtPrice && (
                  <span className="text-xl md:text-2xl text-gray-500 line-through font-bold">
                    {formatPrice(displayItems[currentIndex].compareAtPrice)}
                  </span>
                )}
              </div>
            </div>

            <p className="text-gray-400 text-base md:text-xl font-medium max-w-xl leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300 line-clamp-2">
              {displayItems[currentIndex].description.replace(/<[^>]*>?/gm, '')}
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
              <Link 
                href={`/products/${displayItems[currentIndex].id}`}
                className="group flex items-center justify-center gap-2 px-10 py-5 bg-tiffany-500 hover:bg-tiffany-400 text-gray-950 font-black rounded-2xl transition-all shadow-[0_0_40px_rgba(20,184,166,0.4)] hover:shadow-[0_0_60px_rgba(20,184,166,0.6)] hover:-translate-y-1 text-lg"
              >
                Get it Now
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Link>
              <Link 
                href="/products"
                className="flex items-center justify-center gap-2 px-10 py-5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl backdrop-blur-xl border border-white/10 transition-all hover:-translate-y-1 text-lg"
              >
                Browse All
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Global Bottom Navigation (Arrows) */}
      <div className="absolute bottom-12 right-4 md:right-12 z-30 flex items-center gap-3">
        <button 
          onClick={prevSlide}
          className="p-4 rounded-2xl bg-white/5 hover:bg-tiffany-500 hover:text-gray-950 text-white border border-white/10 transition-all"
          aria-label="Previous"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={nextSlide}
          className="p-4 rounded-2xl bg-white/5 hover:bg-tiffany-500 hover:text-gray-950 text-white border border-white/10 transition-all"
          aria-label="Next"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* 4. Navigation Dots */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {displayItems.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 transition-all duration-500 rounded-full ${
              currentIndex === index ? 'w-10 bg-tiffany-500' : 'w-2 bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* 5. Trust Stats Bar (Sticky at bottom) */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-black/40 backdrop-blur-md border-t border-white/5 py-4 hidden md:block">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Zap className="text-tiffany-500" size={16} />
            {stats.totalProducts.toLocaleString()}+ Items
          </div>
          <div className="flex items-center gap-2">
            <Star className="text-yellow-500 fill-yellow-500" size={16} />
            Top Rated Store
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-tiffany-500" size={16} />
            Secure Global Checkout
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="text-tiffany-500" size={16} />
            {stats.totalCategories}+ Departments
          </div>
        </div>
      </div>
    </div>
  )
        }

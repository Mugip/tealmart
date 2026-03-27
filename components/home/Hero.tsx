// components/home/Hero.tsx
'use client'

import { useState, useEffect, useCallback, TouchEvent } from 'react'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Star, ChevronLeft, ChevronRight, Zap, Clock, Truck, ShoppingBag } from 'lucide-react'

interface HeroProps {
  stats: {
    totalProducts: number
    totalCategories: number
    avgRating: number
  }
}

export default function Hero({ stats }: HeroProps) {
  const[currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const[touchEnd, setTouchEnd] = useState<number | null>(null)

  // 5 High-Converting Slides
  const slides =[
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop",
      badgeIcon: <Star className="w-4 h-4 fill-tiffany-300" />,
      badgeText: `RATED ${stats.avgRating.toFixed(1)}/5 BY CUSTOMERS`,
      title1: "Discover Premium",
      title2: "Quality Products",
      desc: "Shop the latest trends across fashion, electronics, and home goods. Enjoy unbeatable prices with free shipping on orders over $50.",
      cta1: "Shop Now",
      cta1Link: "/products",
      cta2: "View Trending",
      cta2Link: "/products?sort=popular",
      gradient: "from-tiffany-400 to-tiffany-200"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?q=80&w=2070&auto=format&fit=crop",
      badgeIcon: <Zap className="w-4 h-4 fill-yellow-400 text-yellow-400" />,
      badgeText: "LIMITED TIME OFFER",
      title1: "24-Hour",
      title2: "Flash Sale",
      desc: "Get up to 60% off our best-selling items. Hurry, these deals disappear when the timer hits zero!",
      cta1: "Claim Discount",
      cta1Link: "/products?sort=price-asc",
      cta2: "View All Deals",
      cta2Link: "/products",
      gradient: "from-yellow-400 to-orange-400"
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=2070&auto=format&fit=crop",
      badgeIcon: <Clock className="w-4 h-4 text-purple-300" />,
      badgeText: "JUST ARRIVED",
      title1: "Next-Gen",
      title2: "Electronics",
      desc: "Upgrade your life with cutting-edge tech and smart gadgets. Discover our newly added electronics collection.",
      cta1: "Shop Tech",
      cta1Link: "/products?category=electronics",
      cta2: "New Arrivals",
      cta2Link: "/products?sort=newest",
      gradient: "from-purple-400 to-pink-300"
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop",
      badgeIcon: <ShoppingBag className="w-4 h-4 text-rose-300" />,
      badgeText: "SEASONAL COLLECTION",
      title1: "Elevate Your",
      title2: "Wardrobe",
      desc: "Step out in style with our curated fashion pieces. Premium fabrics, flawless fits, and striking designs.",
      cta1: "Shop Fashion",
      cta1Link: "/products?category=fashion",
      cta2: "View Lookbook",
      cta2Link: "/products?category=womens-clothing",
      gradient: "from-rose-400 to-red-300"
    },
    {
      id: 5,
      image: "https://images.unsplash.com/photo-1586528116311-ad8ed7c83a56?q=80&w=2070&auto=format&fit=crop",
      badgeIcon: <Truck className="w-4 h-4 text-green-300" />,
      badgeText: "GLOBAL DELIVERY",
      title1: "Worldwide",
      title2: "Free Shipping",
      desc: "No hidden fees at checkout. Enjoy fast, reliable, and completely free delivery right to your doorstep on qualifying orders.",
      cta1: "Start Shopping",
      cta1Link: "/products",
      cta2: "Shipping Info",
      cta2Link: "/shipping",
      gradient: "from-green-400 to-emerald-300"
    }
  ]

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }, [slides.length])

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // Auto-slide every 5.5 seconds, pause on hover
  useEffect(() => {
    if (isHovered) return
    const timer = setInterval(() => {
      nextSlide()
    }, 5500)
    return () => clearInterval(timer)
  }, [isHovered, nextSlide])

  // Mobile Swipe Handlers
  const minSwipeDistance = 50
  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }
  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }
  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) nextSlide()
    if (isRightSwipe) prevSlide()
  }

  return (
    <div 
      className="relative min-h-[75vh] md:min-h-[85vh] w-full overflow-hidden bg-gray-900 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndHandler}
    >
      {/* Slider Container */}
      <div 
        className="flex w-full h-full absolute top-0 left-0 transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="w-full h-full flex-shrink-0 relative flex items-center justify-center">
            
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <img 
                src={slide.image} 
                alt={slide.title1} 
                className="w-full h-full object-cover opacity-40 md:opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-gray-900/30" />
            </div>

            {/* Slide Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 text-center md:text-left flex flex-col md:flex-row items-center">
              <div className="md:w-3/4 lg:w-2/3 space-y-6 sm:space-y-8">
                
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-white text-xs sm:text-sm font-bold tracking-wide uppercase animate-fade-in-up">
                  {slide.badgeIcon}
                  {slide.badgeText}
                </div>

                {/* Headings */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight">
                  {slide.title1} <br className="hidden md:block"/>
                  <span className={`text-transparent bg-clip-text bg-gradient-to-r ${slide.gradient}`}>
                    {slide.title2}
                  </span>
                </h1>

                <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl leading-relaxed mx-auto md:mx-0 animate-fade-in-up delay-100">
                  {slide.desc}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4 animate-fade-in-up delay-200">
                  <Link href={slide.cta1Link} className="group flex items-center justify-center gap-2 px-8 py-4 bg-tiffany-500 hover:bg-tiffany-400 text-gray-900 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] hover:-translate-y-1">
                    {slide.cta1} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link href={slide.cta2Link} className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl backdrop-blur-md border border-white/10 transition-all hover:-translate-y-1">
                    {slide.cta2}
                  </Link>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Global Bottom Stats Bar (Stays constant across slides) */}
      <div className="absolute bottom-8 left-0 right-0 z-20 hidden md:block pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-start gap-6 text-sm text-gray-400 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-tiffany-500" />
              Secure Checkout
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
            <div className="flex items-center gap-2">
               <span className="text-white font-bold">{stats.totalProducts.toLocaleString()}+</span>
               Products Available
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
            <div className="flex items-center gap-2">
               <span className="text-white font-bold">{stats.totalCategories}+</span>
               Categories
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows (Desktop) */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-all hidden md:block"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-all hidden md:block"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-4 md:bottom-8 left-0 right-0 z-30 flex justify-center gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`transition-all duration-300 rounded-full h-2 ${
              currentIndex === index 
                ? 'w-8 bg-tiffany-400' 
                : 'w-2 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Progress Bar (Visual timing indicator) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30">
        <div 
          className="h-full bg-tiffany-500 transition-all ease-linear"
          style={{ 
            width: isHovered ? '100%' : '0%',
            transitionDuration: isHovered ? '0ms' : '5500ms' 
          }}
          key={currentIndex} // forces reflow to restart animation
        />
      </div>
    </div>
  )
}

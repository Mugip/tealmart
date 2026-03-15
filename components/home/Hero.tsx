// components/home/Hero.tsx
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

interface HeroProps {
  stats: {
    totalProducts: number
    totalCategories: number
    avgRating: number
  }
}

export default function Hero({ stats }: HeroProps) {
  return (
    <div className="relative bg-gradient-to-br from-tiffany-600 via-tiffany-700 to-purple-700 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-tiffany-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center max-w-4xl mx-auto">
          
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4 border border-white/30">
            <Sparkles size={16} className="text-yellow-300" />
            <span className="font-semibold text-xs sm:text-sm text-white">New Products Added Daily</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 leading-tight text-white">
            Discover Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
              Perfect Style
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-tiffany-100 mb-6 leading-relaxed max-w-2xl mx-auto">
            Shop the latest trends from top brands. Quality products at unbeatable prices, 
            delivered right to your door.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-6">
            <Link 
              href="/products" 
              className="group px-6 py-2.5 sm:py-3 bg-white text-tiffany-700 font-bold rounded-xl hover:shadow-2xl transition-all flex items-center gap-2 hover:scale-105 text-sm"
            >
              Shop Now
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />
            </Link>
            
            <Link 
              href="/products?featured=true" 
              className="px-6 py-2.5 sm:py-3 bg-white/10 backdrop-blur-sm text-white font-bold rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all text-sm"
            >
              Featured Products
            </Link>
          </div>

          {/* Compact Stats */}
          <div className="flex items-center justify-center gap-6 sm:gap-8 text-white/90">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-yellow-300">
                {stats.totalProducts.toLocaleString()}+
              </div>
              <div className="text-xs text-tiffany-100">Products</div>
            </div>
            <div className="h-8 w-px bg-white/30"></div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-yellow-300">
                {stats.totalCategories}+
              </div>
              <div className="text-xs text-tiffany-100">Categories</div>
            </div>
            <div className="h-8 w-px bg-white/30"></div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-yellow-300">
                {stats.avgRating.toFixed(1)}⭐
              </div>
              <div className="text-xs text-tiffany-100">Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 80L60 70C120 60 240 40 360 30C480 20 600 20 720 25C840 30 960 40 1080 45C1200 50 1320 50 1380 50L1440 50V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0V80Z" fill="#F9FAFB"/>
        </svg>
      </div>
    </div>
  )
}

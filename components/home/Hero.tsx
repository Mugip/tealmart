// components/home/Hero.tsx
import Link from 'next/link'
import { ArrowRight, Sparkles, TrendingUp, Zap } from 'lucide-react'

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
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-tiffany-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Hero Content */}
          <div className="text-white">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-6 border border-white/30">
              <Sparkles size={16} className="text-yellow-300 sm:w-5 sm:h-5" />
              <span className="font-semibold text-sm sm:text-base">New Products Added Daily</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
              Discover Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                Perfect Style
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-tiffany-100 mb-6 sm:mb-8 leading-relaxed">
              Shop the latest trends from top brands. Quality products at unbeatable prices, 
              delivered right to your door.
            </p>

            <div className="flex flex-wrap gap-3 sm:gap-4 mb-8 sm:mb-12">
              <Link 
                href="/products" 
                className="group px-6 sm:px-8 py-3 sm:py-4 bg-white text-tiffany-700 font-bold rounded-xl hover:shadow-2xl transition-all flex items-center gap-2 hover:scale-105 text-sm sm:text-base"
              >
                Shop Now
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </Link>
              
              <Link 
                href="/products?featured=true" 
                className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm text-white font-bold rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all text-sm sm:text-base"
              >
                Featured Products
              </Link>
            </div>

            {/* Mini Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-300">
                  {stats.totalProducts.toLocaleString()}+
                </div>
                <div className="text-xs sm:text-sm text-tiffany-100">Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-300">
                  {stats.totalCategories}+
                </div>
                <div className="text-xs sm:text-sm text-tiffany-100">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-300">
                  {stats.avgRating.toFixed(1)}⭐
                </div>
                <div className="text-xs sm:text-sm text-tiffany-100">Avg Rating</div>
              </div>
            </div>
          </div>

          {/* Hero Image/Cards */}
          <div className="hidden lg:block relative">
            <div className="grid grid-cols-2 gap-4">
              {/* Card 1 */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:scale-105 transition-all">
                <div className="bg-yellow-400 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="text-yellow-900" size={24} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Trending</h3>
                <p className="text-tiffany-100 text-sm">Hot products everyone loves</p>
              </div>

              {/* Card 2 */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:scale-105 transition-all mt-12">
                <div className="bg-purple-400 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="text-purple-900" size={24} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Flash Deals</h3>
                <p className="text-tiffany-100 text-sm">Limited time offers</p>
              </div>

              {/* Card 3 */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:scale-105 transition-all -mt-6">
                <div className="bg-pink-400 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Sparkles className="text-pink-900" size={24} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">New Arrivals</h3>
                <p className="text-tiffany-100 text-sm">Fresh products daily</p>
              </div>

              {/* Card 4 */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:scale-105 transition-all">
                <div className="bg-green-400 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🎁</span>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Free Shipping</h3>
                <p className="text-tiffany-100 text-sm">On orders over $50</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" fill="#F9FAFB"/>
        </svg>
      </div>
    </div>
  )
}

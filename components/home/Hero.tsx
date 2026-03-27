// components/home/Hero.tsx
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Star } from 'lucide-react'

interface HeroProps {
  stats: {
    totalProducts: number
    totalCategories: number
    avgRating: number
  }
}

export default function Hero({ stats }: HeroProps) {
  return (
    <div className="relative min-h-[75vh] flex items-center justify-center bg-gray-900 overflow-hidden">
      {/* Background Image with Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop" 
          alt="Shopping Background" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 text-center md:text-left flex flex-col md:flex-row items-center">
        
        <div className="md:w-3/4 lg:w-2/3 space-y-6 sm:space-y-8">
          {/* Social Proof Badge */}
          <div className="inline-flex items-center gap-2 bg-tiffany-500/20 backdrop-blur-md border border-tiffany-500/30 px-4 py-2 rounded-full text-tiffany-300 text-xs sm:text-sm font-bold tracking-wide uppercase">
            <Star className="w-4 h-4 fill-tiffany-300" />
            Rated {stats.avgRating.toFixed(1)}/5 by Happy Customers
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight">
            Discover Premium <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-tiffany-400 to-tiffany-200">
              Quality Products
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl leading-relaxed mx-auto md:mx-0">
            Shop the latest trends across fashion, electronics, and home goods. Enjoy unbeatable prices with free shipping on orders over $50.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
            <Link href="/products" className="group flex items-center justify-center gap-2 px-8 py-4 bg-tiffany-500 hover:bg-tiffany-400 text-gray-900 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] hover:-translate-y-1">
              Shop Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/products?featured=true" className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl backdrop-blur-md border border-white/10 transition-all hover:-translate-y-1">
              View Trending
            </Link>
          </div>

          {/* Mini Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 pt-6 text-xs sm:text-sm text-gray-400 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-tiffany-500" />
              Secure Checkout
            </div>
            <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-gray-600" />
            <div className="flex items-center gap-2">
               <span className="text-tiffany-500 font-bold">{stats.totalProducts.toLocaleString()}+</span>
               Products Available
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

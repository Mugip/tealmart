// app/page.tsx
import { prisma } from '@/lib/db'
import { fetchWithCache } from '@/lib/redis'
import ProductCard from '@/components/products/ProductCard'
import Hero from '@/components/home/Hero'
import FeaturedCategories from '@/components/home/FeaturedCategories'
import { TrendingUp, Zap, Star, ArrowRight, Truck, Shield, RotateCcw, Mail, Sparkles } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 3600 // 1 hour static revalidation

async function getFeaturedProducts() {
  return fetchWithCache('home:featured', async () => {
    const manuallyFeatured = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: 8,
      orderBy: { createdAt: 'desc' },
    })

    if (manuallyFeatured.length >= 8) return manuallyFeatured

    return await prisma.product.findMany({
      where: { isActive: true },
      take: 8,
      orderBy:[{ isFeatured: 'desc' }, { views: 'desc' }, { createdAt: 'desc' }],
    })
  }, 3600) // Cache for 1 hour
}

async function getLatestProducts() {
  return fetchWithCache('home:latest', async () => {
    return await prisma.product.findMany({
      where: { isActive: true },
      take: 12,
      orderBy: { createdAt: 'desc' },
    })
  }, 3600)
}

async function getTrendingProducts() {
  return fetchWithCache('home:trending', async () => {
    return await prisma.product.findMany({
      where: { isActive: true },
      take: 8,
      orderBy: { views: 'desc' },
    })
  }, 1800) // Cache for 30 mins
}

async function getRecommendedProducts() {
  return fetchWithCache('home:recommended', async () => {
    return await prisma.product.findMany({
      where: { isActive: true, conversions: { gt: 0 } },
      take: 4,
      orderBy: { rating: 'desc' },
    })
  }, 7200) // 2 hours
}

async function getCategories() {
  return fetchWithCache('home:categories', async () => {
    const categories = await prisma.product.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
      take: 8,
    })

    return await Promise.all(
      categories.map(async (c) => {
        const sampleProduct = await prisma.product.findFirst({
          where: { category: c.category, isActive: true },
          select: { id: true, title: true, price: true, images: true },
          orderBy: { views: 'desc' },
        })
        return {
          name: c.category,
          count: c._count.category,
          slug: c.category,
          sampleProduct,
        }
      })
    )
  }, 86400) // Cache for 24 hours
}

async function getStats() {
  return fetchWithCache('home:stats', async () => {
    const [totalProducts, totalCategories, avgRating] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { category: true },
        distinct: ['category'],
      }).then(cats => cats.length),
      prisma.product.aggregate({
        where: { isActive: true, rating: { not: null } },
        _avg: { rating: true },
      }).then(result => result._avg.rating || 4.5),
    ])
    return { totalProducts, totalCategories, avgRating }
  }, 86400)
}

export default async function Home() {
  const[featuredProducts, latestProducts, trendingProducts, recommendedProducts, categories, stats] = await Promise.all([
    getFeaturedProducts(),
    getLatestProducts(),
    getTrendingProducts(),
    getRecommendedProducts(),
    getCategories(),
    getStats(),
  ])

  return (
    <div className="bg-gray-50">
      <Hero stats={stats} />
      
      <FeaturedCategories categories={categories} />

      {/* Recommended For You - AI Personalization Concept */}
      {recommendedProducts.length > 0 && (
        <section className="bg-gradient-to-b from-white to-gray-50 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="text-purple-500" size={24} />
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Recommended For You</h2>
                </div>
                <p className="text-gray-600 text-sm sm:text-base">Based on global top-rated customer purchases</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {recommendedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="flex items-center justify-between mb-8 sm:mb-12">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <Star className="text-yellow-500 fill-yellow-500" size={24} />
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Featured Products</h2>
              </div>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Handpicked favorites just for you</p>
            </div>
            <Link href="/products" className="hidden md:flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-tiffany-500 to-tiffany-600 text-white font-bold rounded-xl hover:shadow-lg transition-all group text-sm sm:text-base">
              View All
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <section className="bg-gradient-to-br from-orange-50 to-red-50 py-12 sm:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8 sm:mb-12">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <TrendingUp className="text-orange-500" size={24} />
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Trending Now</h2>
                </div>
                <p className="text-gray-600 text-sm sm:text-base lg:text-lg">What everyone's buying right now</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {trendingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust Badges */}
      <section className="bg-gradient-to-r from-tiffany-600 to-tiffany-700 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 text-center border border-white/20 hover:bg-white/20 transition-all">
              <div className="bg-white/20 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Truck className="text-white" size={24} />
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2">Free Shipping</h3>
              <p className="text-tiffany-100 text-sm sm:text-base">On orders over $50 worldwide</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 text-center border border-white/20 hover:bg-white/20 transition-all">
              <div className="bg-white/20 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Shield className="text-white" size={24} />
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2">Secure Payment</h3>
              <p className="text-tiffany-100 text-sm sm:text-base">100% secure encrypted transactions</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 text-center border border-white/20 hover:bg-white/20 transition-all">
              <div className="bg-white/20 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <RotateCcw className="text-white" size={24} />
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2">Easy Returns</h3>
              <p className="text-tiffany-100 text-sm sm:text-base">30-day money-back guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-white py-16 sm:py-24 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Mail className="w-12 h-12 text-tiffany-500 mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Get 10% Off Your First Order</h2>
          <p className="text-gray-600 mb-8">Join our newsletter to receive exclusive drops, special offers, and more.</p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email address" 
              required
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500 outline-none"
            />
            <button 
              type="submit" 
              className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  )
              }

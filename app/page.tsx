// app/page.tsx
import { prisma } from '@/lib/db'
import ProductCard from '@/components/products/ProductCard'
import Hero from '@/components/home/Hero'
import FeaturedCategories from '@/components/home/FeaturedCategories'
import { TrendingUp, Zap, Star, ArrowRight, Truck, Shield, RotateCcw } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 3600

/**
 * Smart Featured Products Logic:
 * 1. First, try to get manually featured products (isFeatured = true)
 * 2. If we have enough (8+), use those
 * 3. Otherwise, fall back to top products by popularity and recency
 * This ensures the homepage always shows products!
 */
async function getFeaturedProducts() {
  // Try to get manually featured products first
  const manuallyFeatured = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    take: 8,
    orderBy: { createdAt: 'desc' },
  })

  // If we have enough manually featured products, use them
  if (manuallyFeatured.length >= 8) {
    return manuallyFeatured
  }

  // Otherwise, fall back to smart selection:
  // - Featured products first (if any)
  // - Then most viewed (popular)
  // - Then newest
  const smartFeatured = await prisma.product.findMany({
    where: { isActive: true },
    take: 8,
    orderBy: [
      { isFeatured: 'desc' }, // Manually featured first
      { views: 'desc' },      // Then by popularity
      { createdAt: 'desc' }   // Then by recency
    ],
  })

  return smartFeatured
}

async function getLatestProducts() {
  return await prisma.product.findMany({
    where: { isActive: true },
    take: 12,
    orderBy: { createdAt: 'desc' },
  })
}

async function getTrendingProducts() {
  return await prisma.product.findMany({
    where: { isActive: true },
    take: 8,
    orderBy: { views: 'desc' },
  })
}

async function getCategories() {
  const categories = await prisma.product.groupBy({
    by: ['category'],
    where: { isActive: true },
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } },
    take: 8,
  })

  // Fetch one sample product per category
  const categoriesWithSamples = await Promise.all(
    categories.map(async (c) => {
      const sampleProduct = await prisma.product.findFirst({
        where: {
          category: c.category,
          isActive: true,
        },
        select: {
          id: true,
          title: true,
          price: true,
          images: true,
        },
        orderBy: { views: 'desc' }, // Get most viewed product
      })

      return {
        name: c.category,
        count: c._count.category,
        slug: c.category,
        sampleProduct,
      }
    })
  )

  return categoriesWithSamples
}

async function getStats() {
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
}

export default async function Home() {
  const [featuredProducts, latestProducts, trendingProducts, categories, stats] = await Promise.all([
    getFeaturedProducts(),
    getLatestProducts(),
    getTrendingProducts(),
    getCategories(),
    getStats(),
  ])

  return (
    <div className="bg-gray-50">
      <Hero stats={stats} />
      
      <FeaturedCategories categories={categories} />

      {/* Featured Products - Always shows because of smart fallback */}
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
            <Link 
              href="/products" 
              className="hidden md:flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-tiffany-500 to-tiffany-600 text-white font-bold rounded-xl hover:shadow-lg transition-all group text-sm sm:text-base"
            >
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

      {/* New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Zap className="text-purple-500" size={24} />
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">New Arrivals</h2>
            </div>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Fresh products added daily</p>
          </div>
          <Link 
            href="/products" 
            className="hidden md:flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all group text-sm sm:text-base"
          >
            View All
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {latestProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

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
              <p className="text-tiffany-100 text-sm sm:text-base">100% secure transactions</p>
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

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-tiffany-600 mb-2">
              {stats.totalProducts.toLocaleString()}+
            </div>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg font-medium">Products Available</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-purple-600 mb-2">
              {stats.totalCategories}+
            </div>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg font-medium">Categories</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-yellow-500 mb-2">
              {stats.avgRating.toFixed(1)} ⭐
            </div>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg font-medium">Average Rating</p>
          </div>
        </div>
      </section>
    </div>
  )
}

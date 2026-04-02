// app/page.tsx
import { prisma } from '@/lib/db'
import { fetchWithCache } from '@/lib/redis'
import ProductCard from '@/components/products/ProductCard'
import Hero from '@/components/home/Hero'
import FeaturedCategories from '@/components/home/FeaturedCategories'
import NewsletterForm from '@/components/home/NewsletterForm'
import { TrendingUp, Zap, ArrowRight, Sparkles, Mail } from 'lucide-react'
import Link from 'next/link'
import RecentlyViewed from '@/components/products/RecentlyViewed'

// ✅ Force page to render dynamically per user so randomization works
export const dynamic = 'force-dynamic'

// 🔀 Helper to randomly shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// 📦 Fetch large pools of products (Cached in Redis to protect the database)
async function getFeaturedProducts() {
  return fetchWithCache('home:featured-pool', async () => {
    const manuallyFeatured = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: 40, // Fetch a larger pool
      orderBy: { createdAt: 'desc' },
    })

    if (manuallyFeatured.length >= 8) return manuallyFeatured

    return await prisma.product.findMany({
      where: { isActive: true },
      take: 40,
      orderBy: [{ isFeatured: 'desc' }, { views: 'desc' }],
    })
  }, 3600) // Cache pool for 1 hour
}

async function getLatestProducts() {
  return fetchWithCache('home:latest-pool', async () => {
    return await prisma.product.findMany({
      where: { isActive: true },
      take: 40, // Fetch top 40 latest
      orderBy: { createdAt: 'desc' },
    })
  }, 3600)
}

async function getTrendingProducts() {
  return fetchWithCache('home:trending-pool', async () => {
    return await prisma.product.findMany({
      where: { isActive: true },
      take: 40, // Fetch top 40 most viewed
      orderBy: { views: 'desc' },
    })
  }, 1800)
}

async function getRecommendedProducts() {
  return fetchWithCache('home:recommended-pool', async () => {
    return await prisma.product.findMany({
      where: { isActive: true, conversions: { gt: 0 } },
      take: 20,
      orderBy: { rating: 'desc' },
    })
  }, 7200)
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
  }, 86400)
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
  const [
    featuredPool,
    latestPool,
    trendingPool,
    recommendedPool,
    categories,
    stats
  ] = await Promise.all([
    getFeaturedProducts(),
    getLatestProducts(),
    getTrendingProducts(),
    getRecommendedProducts(),
    getCategories(),
    getStats(),
  ])

  // 🔀 DYNAMICALLY SHUFFLE THE POOLS ON EVERY RENDER
  const featuredProducts = shuffleArray(featuredPool).slice(0, 8)
  const latestProducts = shuffleArray(latestPool).slice(0, 8)
  const trendingProducts = shuffleArray(trendingPool).slice(0, 8)
  const recommendedProducts = shuffleArray(recommendedPool).slice(0, 4)

  return (
    <div className="bg-gray-50">
      <Hero stats={stats} products={featuredProducts} />

      <FeaturedCategories categories={categories} />

      {/* Recommended For You */}
      {recommendedProducts.length > 0 && (
        <section className="bg-gradient-to-b from-white to-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="text-purple-500" size={24} />
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Recommended For You</h2>
                </div>
                <p className="text-gray-500 text-sm sm:text-base font-medium">Based on your browsing habits and global ratings.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {recommendedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <section className="bg-gray-900 py-20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter flex items-center gap-3">
                  <TrendingUp className="text-teal-400" />
                  Trending <span className="text-teal-400">Right Now</span>
                </h2>
                <p className="text-gray-400 mt-2 font-medium">Items that are selling out fast across the globe.</p>
              </div>
              <Link href="/products?sort=popular" className="hidden md:flex items-center gap-2 text-white font-bold hover:text-teal-400 transition-colors group">
                Shop Trends
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
              {trendingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Zap className="text-yellow-500 fill-yellow-500" />
              New Arrivals
            </h2>
            <p className="text-gray-500 mt-2 font-medium">Fresh styles and tech added to the catalog every day.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {latestProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/products?sort=newest" className="inline-flex items-center gap-2 px-10 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-2xl transition-all">
            Explore New Drops
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Recently Viewed on Homepage */}
      <section className="bg-gray-900 py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RecentlyViewed />
        </div>
      </section>

      {/* ✉️ Newsletter Section */}
      <section className="bg-teal-500 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Mail className="text-white" size={32} />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tighter">
            Get Exclusive Deals First
          </h2>
          <p className="text-teal-100 text-lg mb-10 font-medium">
            Subscribe and be the first to know about new arrivals and special offers.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  )
}

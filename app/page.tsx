import { prisma } from '@/lib/db'
import { fetchWithCache } from '@/lib/redis'
import ProductCard from '@/components/products/ProductCard'
import Hero from '@/components/home/Hero'
import FeaturedCategories from '@/components/home/FeaturedCategories'
import NewsletterForm from '@/components/home/NewsletterForm'
import { TrendingUp, Zap, ArrowRight, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import RecentlyViewed from '@/components/products/RecentlyViewed'

export const dynamic = 'force-dynamic'

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

async function getFeaturedProducts() {
  return fetchWithCache('home:featured-pool', async () => {
    const manuallyFeatured = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: 40,
      orderBy: { createdAt: 'desc' },
    })
    if (manuallyFeatured.length >= 8) return manuallyFeatured
    return await prisma.product.findMany({
      where: { isActive: true },
      take: 40,
      orderBy: [{ isFeatured: 'desc' }, { views: 'desc' }],
    })
  }, 3600)
}

async function getLatestProducts() {
  return fetchWithCache('home:latest-pool', async () => {
    return await prisma.product.findMany({
      where: { isActive: true },
      take: 40,
      orderBy: { createdAt: 'desc' },
    })
  }, 3600)
}

async function getTrendingProducts() {
  return fetchWithCache('home:trending-pool', async () => {
    return await prisma.product.findMany({
      where: { isActive: true },
      take: 40,
      orderBy: { views: 'desc' },
    })
  }, 1800)
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

/* ─────────────────────────────────────────
   Horizontal Scroll Row (Polished Version)
───────────────────────────────────────── */
function HorizontalScrollRow({
  title,
  subtitle,
  icon,
  products,
  link,
  dark = false,
  accentColor = 'teal'
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  products: any[]
  link: string
  dark?: boolean
  accentColor?: 'teal' | 'amber' | 'red'
}) {
  const accentMap = {
    teal: 'from-teal-500/0 to-teal-500/5',
    amber: 'from-amber-500/0 to-amber-500/5',
    red: 'from-red-500/0 to-red-500/5',
  }

  const accentHover = {
    teal: 'hover:text-teal-400',
    amber: 'hover:text-amber-400',
    red: 'hover:text-red-400',
  }

  return (
    <section className={`relative overflow-hidden py-16 transition-colors duration-500 ${
      dark ? 'bg-slate-900' : 'bg-white'
    }`}>
      {/* Subtle gradient accent */}
      <div className={`absolute inset-0 bg-gradient-to-r ${accentMap[accentColor]} pointer-events-none`} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with better hierarchy */}
        <div className="flex items-start justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {icon}
              <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${
                dark ? 'text-white' : 'text-gray-900'
              }`}>
                {title}
              </h2>
            </div>
            <p className={`text-sm sm:text-base font-medium ${
              dark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {subtitle}
            </p>
          </div>

          <Link
            href={link}
            className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${
              dark
                ? `text-gray-300 ${accentHover[accentColor]} hover:bg-white/5`
                : `text-gray-700 ${accentHover[accentColor]} hover:bg-gray-100`
            }`}
          >
            Explore <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Horizontal Scroll Container with smooth momentum scrolling */}
        <div className="group relative">
          {/* Scroll hint gradient (left) */}
          <div className={`absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none transition-opacity duration-500 ${
            dark 
              ? 'bg-gradient-to-r from-slate-900 to-transparent' 
              : 'bg-gradient-to-r from-white to-transparent'
          }`} />

          {/* Scroll hint gradient (right) */}
          <div className={`absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none transition-opacity duration-500 ${
            dark 
              ? 'bg-gradient-to-l from-slate-900 to-transparent' 
              : 'bg-gradient-to-l from-white to-transparent'
          }`} />

          {/* Scrollable content */}
          <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            <div className="flex gap-4 pb-2 min-w-min px-0">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="snap-center flex-shrink-0 w-[160px] transition-all duration-500 hover:scale-105"
                >
                  <ProductCard product={product} />
                </div>
              ))}

              {/* View All CTA Card */}
              <Link
                href={link}
                className={`snap-center flex-shrink-0 w-[160px] h-full flex items-center justify-center rounded-2xl border-2 transition-all duration-300 group/cta font-bold text-center p-4 ${
                  dark
                    ? 'border-white/10 text-white hover:border-white/30 hover:bg-white/5'
                    : 'border-gray-200 text-gray-900 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-sm">Explore</span>
                  <ChevronRight size={18} className="transition-transform group-hover/cta:translate-x-1" />
                </div>
              </Link>
            </div>
          </div>

          {/* Mobile scroll hint indicator */}
          <div className="sm:hidden mt-3 flex items-center justify-center gap-1 text-xs text-gray-400">
            <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
            <span>Scroll to explore</span>
            <div className="w-1 h-1 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>
      </div>
    </section>
  )
}

export default async function Home() {
  const [
    featuredPool,
    latestPool,
    trendingPool,
    categories,
    stats
  ] = await Promise.all([
    getFeaturedProducts(),
    getLatestProducts(),
    getTrendingProducts(),
    getCategories(),
    getStats(),
  ])

  const featuredProducts = shuffleArray(featuredPool).slice(0, 8)
  const latestProducts = shuffleArray(latestPool).slice(0, 8)
  const trendingProducts = shuffleArray(trendingPool).slice(0, 8)

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen">
      {/* Hero Section */}
      <Hero stats={stats} products={featuredProducts} />

      {/* Featured Categories */}
      <FeaturedCategories categories={categories} />

      {/* Trending Products - Dark mode with teal accent */}
      <HorizontalScrollRow
        title="Trending Right Now"
        subtitle="Fast-moving products people are buying right now"
        icon={<TrendingUp className="w-8 h-8 text-teal-400 flex-shrink-0" />}
        products={trendingProducts}
        link="/products?sort=popular"
        dark
        accentColor="teal"
      />

      {/* New Arrivals - Light mode with amber accent */}
      <HorizontalScrollRow
        title="New Arrivals"
        subtitle="Fresh styles and latest drops added daily to the catalog"
        icon={<Zap className="w-8 h-8 text-amber-500 fill-amber-500 flex-shrink-0" />}
        products={latestProducts}
        link="/products?sort=newest"
        dark={false}
        accentColor="amber"
      />

      {/* Recently Viewed - Dark mode */}
      <section className="relative overflow-hidden py-16 bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 to-teal-500/3 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-8 h-8 text-teal-400 flex-shrink-0" />
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  Recently Viewed
                </h2>
              </div>
              <p className="text-sm sm:text-base font-medium text-gray-400">
                Continue exploring where you left off
              </p>
            </div>
          </div>

          <RecentlyViewed />
        </div>
      </section>

      {/* Newsletter Section - Vibrant teal */}
      <section className="relative overflow-hidden py-20 sm:py-28 bg-gradient-to-br from-teal-500 via-teal-500 to-cyan-600">
        {/* Subtle radial gradient overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-teal-900/20" />
        </div>

        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </div>

          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
            Get Exclusive <br className="hidden sm:block" />Deals First
          </h2>

          <p className="text-teal-50 text-lg font-medium mb-12 leading-relaxed max-w-lg mx-auto">
            Subscribe to our newsletter and be the first to discover new arrivals, special offers, and insider deals.
          </p>

          <NewsletterForm />

          <p className="text-teal-100 text-xs font-semibold mt-6 tracking-wide uppercase">
            ✓ No spam • Unsubscribe anytime
          </p>
        </div>
      </section>


    </div>
  )
}

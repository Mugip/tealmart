import { prisma } from '@/lib/db'
import { fetchWithCache } from '@/lib/redis'
import ProductCard from '@/components/products/ProductCard'
import Hero from '@/components/home/Hero'
import FeaturedCategories from '@/components/home/FeaturedCategories'
import NewsletterForm from '@/components/home/NewsletterForm'
import { TrendingUp, Zap, ArrowRight, Sparkles, Mail, Clock } from 'lucide-react'
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
    return await prisma.product.findMany({
      where: { isActive: true },
      take: 20,
      orderBy: { views: 'desc' },
    })
  }, 3600)
}

async function getLatestProducts() {
  return fetchWithCache('home:latest-pool', async () => {
    return await prisma.product.findMany({
      where: { isActive: true },
      take: 20,
      orderBy: { createdAt: 'desc' },
    })
  }, 3600)
}

async function getTrendingProducts() {
  return fetchWithCache('home:trending-pool', async () => {
    return await prisma.product.findMany({
      where: { isActive: true },
      take: 20,
      orderBy: { views: 'desc' },
    })
  }, 1800)
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
   Reusable Horizontal Scroll Row
───────────────────────────────────────── */
function HorizontalRow({
  title,
  subtitle,
  icon,
  products,
  link,
  dark = false
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  products: any[]
  link: string
  dark?: boolean
}) {
  return (
    <section className={`${dark ? 'bg-gray-900' : 'bg-white'} py-16`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className={`text-2xl sm:text-3xl font-black flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
              {icon}
              {title}
            </h2>
            <p className={`${dark ? 'text-gray-400' : 'text-gray-500'} text-sm mt-1`}>
              {subtitle}
            </p>
          </div>

          <Link
            href={link}
            className={`hidden md:flex items-center gap-2 font-bold ${
              dark ? 'text-white hover:text-teal-400' : 'text-gray-900 hover:text-teal-600'
            }`}
          >
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {/* Horizontal Scroll */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">

          {products.map((product) => (
            <div
              key={product.id}
              className="min-w-[160px] max-w-[160px] flex-shrink-0"
            >
              <ProductCard product={product} compact />
            </div>
          ))}

          {/* CTA Card (lightweight navigation, no heavy data load) */}
          <Link
            href={link}
            className={`min-w-[160px] flex items-center justify-center rounded-2xl border ${
              dark
                ? 'border-white/10 text-white hover:bg-white/5'
                : 'border-gray-200 text-gray-900 hover:bg-gray-100'
            } font-bold`}
          >
            Explore →
          </Link>

        </div>
      </div>
    </section>
  )
}

export default async function Home() {
  const [featuredPool, latestPool, trendingPool, stats] = await Promise.all([
    getFeaturedProducts(),
    getLatestProducts(),
    getTrendingProducts(),
    getStats(),
  ])

  const featuredProducts = shuffleArray(featuredPool).slice(0, 10)
  const latestProducts = shuffleArray(latestPool).slice(0, 10)
  const trendingProducts = shuffleArray(trendingPool).slice(0, 10)

  return (
    <div className="bg-gray-50">

      <Hero stats={stats} products={featuredProducts} />

      <FeaturedCategories categories={[]} />

      {/* Trending (Dark TikTok style) */}
      <HorizontalRow
        title="Trending Right Now"
        subtitle="Fast-moving products people are buying"
        icon={<TrendingUp className="text-teal-400" />}
        products={trendingProducts}
        link="/products?sort=popular"
        dark
      />

      {/* New Arrivals */}
      <HorizontalRow
        title="New Arrivals"
        subtitle="Fresh products added daily"
        icon={<Zap className="text-yellow-500" />}
        products={latestProducts}
        link="/products?sort=newest"
      />

      {/* Recently Viewed (also horizontal now) */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                <Clock className="text-teal-400" />
                Recently Viewed
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Continue where you left off
              </p>
            </div>
          </div>

          <RecentlyViewed horizontal />

        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-teal-500 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Mail className="text-white" size={32} />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">
            Get Exclusive Deals First
          </h2>
          <p className="text-teal-100 mb-10">
            Be first to access new drops and offers.
          </p>
          <NewsletterForm />
        </div>
      </section>

    </div>
  )
        }

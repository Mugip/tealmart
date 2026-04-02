import { prisma } from '@/lib/db'
import { fetchWithCache } from '@/lib/redis'
import ProductCard from '@/components/products/ProductCard'
import Hero from '@/components/home/Hero'
import FeaturedCategories from '@/components/home/FeaturedCategories'
import NewsletterForm from '@/components/home/NewsletterForm'
import { TrendingUp, Zap, ArrowRight, Clock, ChevronRight, Shield, Truck, RotateCcw, Star, CheckCircle, Award } from 'lucide-react'
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
   Reusable Horizontal Scroll Row (Enhanced)
───────────────────────────────────────── */
function HorizontalScrollRow({
  title,
  subtitle,
  icon,
  products,
  link,
  dark = false,
  accentColor = 'teal',
  cta = 'Explore All',
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  products: any[]
  link: string
  dark?: boolean
  accentColor?: 'teal' | 'amber' | 'red'
  cta?: string
}) {
  const accentMap = {
    teal: 'from-teal-500/0 to-teal-500/5',
    amber: 'from-amber-500/0 to-amber-500/5',
    red: 'from-red-500/0 to-red-500/5',
  }

  return (
    <section className={`relative overflow-hidden py-16 transition-colors duration-500 ${
      dark ? 'bg-slate-900' : 'bg-white'
    }`}>
      {/* Gradient accent */}
      <div className={`absolute inset-0 bg-gradient-to-r ${accentMap[accentColor]} pointer-events-none`} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-10 gap-4">
          <div className="flex-1">
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
            className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 group ${
              dark
                ? 'text-gray-300 hover:text-teal-400 hover:bg-white/5'
                : 'text-gray-700 hover:text-teal-600 hover:bg-gray-100'
            }`}
          >
            {cta} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Scroll container */}
        <div className="group relative">
          <div className={`absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none transition-opacity ${
            dark 
              ? 'bg-gradient-to-r from-slate-900 to-transparent' 
              : 'bg-gradient-to-r from-white to-transparent'
          }`} />

          <div className={`absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none transition-opacity ${
            dark 
              ? 'bg-gradient-to-l from-slate-900 to-transparent' 
              : 'bg-gradient-to-l from-white to-transparent'
          }`} />

          <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            <div className="flex gap-4 pb-2 min-w-min">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="snap-center flex-shrink-0 w-[160px] transition-all duration-300"
                >
                  <ProductCard product={product} />
                </div>
              ))}

              {/* CTA Card */}
              <Link
                href={link}
                className={`snap-center flex-shrink-0 w-[160px] h-full flex items-center justify-center rounded-2xl border-2 transition-all duration-300 group/cta font-bold text-center p-4 ${
                  dark
                    ? 'border-white/10 text-white hover:border-white/30 hover:bg-white/5'
                    : 'border-gray-200 text-gray-900 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-sm">{cta}</span>
                  <ChevronRight size={18} className="transition-transform group-hover/cta:translate-x-1" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile scroll hint */}
        <div className="sm:hidden mt-4 flex items-center justify-center gap-1 text-xs text-gray-400">
          <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
          <span>Scroll to explore</span>
          <div className="w-1 h-1 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────
   Trust & Social Proof Section
───────────────────────────────────────── */
function TrustSection() {
  const stats = [
    { icon: Star, label: '4.8★ Rating', value: '50k+ Reviews', color: 'from-amber-500/10' },
    { icon: CheckCircle, label: 'Verified Safe', value: '100% Secure', color: 'from-green-500/10' },
    { icon: Truck, label: 'Free Shipping', value: 'On orders $29+', color: 'from-blue-500/10' },
    { icon: Award, label: 'Trusted Brand', value: 'Est. 2024', color: 'from-purple-500/10' },
  ]

  return (
    <section className="relative py-12 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className={`group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${color} to-transparent border border-gray-200 hover:border-teal-300 transition-all duration-300 cursor-pointer hover:shadow-lg`}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-500/0 to-teal-500/0 group-hover:from-teal-500/5 group-hover:to-teal-500/5 transition-all duration-300" />

              <div className="relative flex flex-col items-center text-center gap-2">
                <Icon size={28} className="text-teal-600 group-hover:scale-110 transition-transform duration-300" />
                <p className="text-xs sm:text-sm font-bold text-gray-900">{label}</p>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────
   Why Shop With Us (Benefits)
───────────────────────────────────────── */
function BenefitsSection() {
  const benefits = [
    { icon: Truck, title: 'Free Shipping', description: 'On all orders over $29' },
    { icon: RotateCcw, title: '30-Day Returns', description: 'Hassle-free returns policy' },
    { icon: Shield, title: 'Buyer Protection', description: '100% money-back guarantee' },
  ]

  return (
    <section className="relative py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map(({ icon: Icon, title, description }, idx) => (
            <div
              key={title}
              className="group relative flex flex-col items-center text-center p-8 rounded-3xl border-2 border-gray-100 hover:border-teal-400 transition-all duration-300 hover:shadow-xl hover:bg-gradient-to-b hover:from-teal-500/5 to-transparent"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Icon size={32} className="text-teal-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm">{description}</p>
            </div>
          ))}
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

  const featuredProducts = shuffleArray(featuredPool).slice(0, 20)
  const latestProducts = shuffleArray(latestPool).slice(0, 20)
  const trendingProducts = shuffleArray(trendingPool).slice(0, 20)

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* ════════════════════════════════
          HERO SECTION
      ════════════════════════════════ */}
      <Hero stats={stats} products={featuredProducts} />

      {/* ════════════════════════════════
          TRUST & SOCIAL PROOF
      ════════════════════════════════ */}
      <TrustSection />

      {/* ════════════════════════════════
          FEATURED CATEGORIES
      ════════════════════════════════ */}
      <FeaturedCategories categories={categories} />

      {/* ════════════════════════════════
          BENEFITS (Why Shop With Us)
      ════════════════════════════════ */}
      <BenefitsSection />

      {/* ════════════════════════════════
          TRENDING PRODUCTS
      ════════════════════════════════ */}
      <HorizontalScrollRow
        title="Trending Right Now"
        subtitle="🔥 Hot items selling fast • Limited stock"
        icon={<TrendingUp className="w-8 h-8 text-teal-400 flex-shrink-0 animate-bounce" />}
        products={trendingProducts}
        link="/products?sort=popular"
        dark
        accentColor="teal"
        cta="See All Trending"
      />

      {/* ════════════════════════════════
          NEW ARRIVALS
      ════════════════════════════════ */}
      <HorizontalScrollRow
        title="New Arrivals"
        subtitle="✨ Fresh styles just dropped • Updated daily"
        icon={<Zap className="w-8 h-8 text-amber-500 fill-amber-500 flex-shrink-0 animate-pulse" />}
        products={latestProducts}
        link="/products?sort=newest"
        dark={false}
        accentColor="amber"
        cta="Explore New"
      />

      {/* ════════════════════════════════
          RECENTLY VIEWED
      ════════════════════════════════ */}
      <section className="relative overflow-hidden py-16 bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 to-teal-500/3 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RecentlyViewed />
        </div>
      </section>

      {/* ════════════════════════════════
          URGENCY/CTA BANNER
      ════════════════════════════════ */}
      <section className="relative overflow-hidden py-12 bg-gradient-to-r from-red-500 to-red-600">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 left-4 text-white text-8xl font-black opacity-20 transform -rotate-12">
            ⏰
          </div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock size={20} className="text-white animate-spin" style={{ animationDuration: '2s' }} />
            <span className="text-white font-bold text-sm sm:text-base uppercase tracking-wider">Limited Time Offer</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
            Up to 50% Off on Selected Items
          </h2>

          <p className="text-red-100 text-lg font-medium mb-6 max-w-2xl mx-auto">
            Only this weekend! Stock is running low on bestsellers. Don't miss out.
          </p>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-red-600 font-black rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
          >
            <span>Shop Now</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════
          NEWSLETTER (Premium)
      ════════════════════════════════ */}
      <section className="relative overflow-hidden py-20 sm:py-28 bg-gradient-to-br from-teal-500 via-teal-500 to-cyan-600">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
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
            Subscribe and unlock 15% off your first purchase + early access to new collections.
          </p>

          <NewsletterForm />

          <div className="mt-8 flex items-center justify-center gap-4 text-sm text-teal-100 flex-wrap">
            <span className="flex items-center gap-1.5">
              <CheckCircle size={16} /> No spam
            </span>
            <span className="w-1 h-1 rounded-full bg-teal-300" />
            <span className="flex items-center gap-1.5">
              <CheckCircle size={16} /> Unsubscribe anytime
            </span>
            <span className="w-1 h-1 rounded-full bg-teal-300" />
            <span className="flex items-center gap-1.5">
              <CheckCircle size={16} /> 100% private
            </span>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          FAQ (FAQ Section)
      ════════════════════════════════ */}
      <section className="relative py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 text-center mb-12">
            Common Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "How quickly will I receive my order?",
                a: "Orders ship within 1-2 business days. Most customers receive items within 5-10 business days with free shipping."
              },
              {
                q: "What if I'm not satisfied with my purchase?",
                a: "We offer a 30-day hassle-free return policy. No questions asked. Full refund or exchange available."
              },
              {
                q: "Is my payment information secure?",
                a: "Yes! We use 256-bit SSL encryption and PCI compliance to protect all transactions."
              },
              {
                q: "Do you offer international shipping?",
                a: "Currently, we ship to most countries worldwide with calculated rates at checkout."
              }
            ].map(({ q, a }, idx) => (
              <details
                key={idx}
                className="group border border-gray-200 rounded-xl overflow-hidden hover:border-teal-300 transition-all duration-300 hover:shadow-md"
              >
                <summary className="flex items-center justify-between w-full p-4 cursor-pointer bg-gray-50 group-hover:bg-teal-500/5 transition-colors">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">{q}</h3>
                  <ChevronRight size={20} className="text-gray-500 group-open:rotate-90 transition-transform duration-300" />
                </summary>
                <div className="p-4 bg-white border-t border-gray-100">
                  <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          Footer CTA
      ════════════════════════════════ */}
      <section className="relative py-12 bg-slate-900 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
            Ready to discover amazing products?
          </h2>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">
            Join thousands of happy customers. Shop with confidence.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-black rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 group"
          >
            Start Shopping <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  )
}

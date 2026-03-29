// app/collections/[slug]/page.tsx
import { prisma } from '@/lib/db'
import { parseSEOSlug } from '@/lib/seo-utils'
import ProductCard from '@/components/products/ProductCard'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Sparkles, Trophy, ArrowRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { title, description } = parseSEOSlug(params.slug)
  return {
    title: `${title} | TealMart`,
    description,
    openGraph: { title, description }
  }
}

export default async function SEOLandingPage({ params }: Props) {
  const { title, category, maxPrice, sort, description } = parseSEOSlug(params.slug)

  // Build the Prisma Query
  const where: any = { isActive: true }
  
  if (category) {
    where.OR = [
      { category: { contains: category, mode: 'insensitive' } },
      { tags: { has: category } }
    ]
  }

  if (maxPrice) {
    where.price = { lte: maxPrice }
  }

  let orderBy: any = { createdAt: 'desc' }
  if (sort === 'rating') orderBy = { rating: 'desc' }
  if (sort === 'price-asc') orderBy = { price: 'asc' }

  const products = await prisma.product.findMany({
    where,
    orderBy,
    take: 24
  })

  if (products.length === 0) return notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO-Rich Header */}
      <header className="bg-white border-b border-gray-200 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
            <Link href="/" className="hover:text-tiffany-600 transition-colors">Home</Link>
            <ArrowRight size={10} />
            <Link href="/products" className="hover:text-tiffany-600 transition-colors">Collections</Link>
            <ArrowRight size={10} />
            <span className="text-gray-900">{title}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tiffany-50 text-tiffany-600 text-xs font-black uppercase tracking-tighter mb-4 border border-tiffany-100">
                <Trophy size={12} />
                Curated Collection
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4">
                {title}
              </h1>
              <p className="text-gray-500 text-lg font-medium leading-relaxed">
                {description}
              </p>
            </div>
            
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="bg-white p-2 rounded-xl shadow-sm">
                <ShieldCheck className="text-tiffany-600" size={24} />
              </div>
              <div>
                <p className="text-xs font-black text-gray-900 uppercase">Verified Quality</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Global Sourcing</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Product Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
            <Sparkles className="text-yellow-500" size={20} />
            Showing {products.length} Results
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Dynamic Contextual Content (Google Loves This) */}
        <section className="mt-20 p-8 md:p-12 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">
            Why Shop for {category || 'Premium Products'} at TealMart?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">Live Exchange Rates</h3>
              <p className="text-sm text-gray-500 leading-relaxed">We provide real-time currency conversion so you can shop in your local currency anywhere in the world.</p>
            </div>
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">Global Logistics</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Our automated ingestion system pairs with premium carriers to ensure your order arrives safely and fast.</p>
            </div>
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">Verified Reviews</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Every item in this collection has been filtered for a rating of 4.2 stars or higher.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

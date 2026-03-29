// app/categories/page.tsx
import { prisma } from '@/lib/db'
import { formatCategoryName, getCategoryIcon } from '@/lib/productClassifier'
import Link from 'next/link'
import { ArrowRight, ShoppingBag, Zap, Star, LayoutGrid } from 'lucide-react'
import Image from 'next/image'

export const revalidate = 3600 // Cache for 1 hour

async function getCategoriesWithData() {
  // 1. Get all unique categories that have active products
  const categories = await prisma.product.groupBy({
    by: ['category'],
    where: { isActive: true },
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } },
  })

  // 2. Fetch a premium sample image for each category to make the UI pop
  const categoriesWithImages = await Promise.all(
    categories.map(async (cat) => {
      const sample = await prisma.product.findFirst({
        where: { category: cat.category, isActive: true },
        select: { images: true },
        orderBy: { views: 'desc' },
      })
      return {
        name: cat.category,
        count: cat._count.category,
        image: sample?.images[0] || null,
      }
    })
  )

  return categoriesWithImages
}

export default async function CategoriesPage() {
  const categories = await getCategoriesWithData()

  return (
    <div className="min-h-screen bg-white">
      {/* 1. High-Conversion Hero Section */}
      <section className="relative py-20 bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070" 
            alt="Background" 
            fill 
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tiffany-500/10 border border-tiffany-500/20 text-tiffany-400 text-xs font-bold uppercase tracking-widest mb-6">
            <LayoutGrid size={14} />
            Department Directory
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Shop by <span className="text-tiffany-400">Category</span>
          </h1>
          <p className="max-w-2xl mx-auto text-gray-400 text-lg md:text-xl font-medium">
            Browse our curated collection across {categories.length} specialized departments. 
            Quality guaranteed in every selection.
          </p>
        </div>
      </section>

      {/* 2. Stats Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap justify-center gap-8 md:gap-16 text-sm font-bold text-gray-500 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-tiffany-500" />
            Fast Delivery
          </div>
          <div className="flex items-center gap-2">
            <Star size={16} className="text-tiffany-500" />
            Top Rated Items
          </div>
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} className="text-tiffany-500" />
            Verified Quality
          </div>
        </div>
      </div>

      {/* 3. Category Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/products?category=${encodeURIComponent(category.name)}`}
                className="group relative h-80 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 bg-white border border-gray-100"
              >
                {/* Background Image (Sample Product) */}
                <div className="absolute inset-0">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                </div>

                {/* Card Content */}
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <div className="flex items-center justify-between items-end">
                    <div>
                      <div className="w-12 h-12 bg-tiffany-500 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform">
                        {getCategoryIcon(category.name)}
                      </div>
                      <h3 className="text-3xl font-black text-white leading-tight mb-2 drop-shadow-md">
                        {formatCategoryName(category.name)}
                      </h3>
                      <p className="text-tiffany-400 font-bold text-sm uppercase tracking-widest">
                        {category.count} Products Available
                      </p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-full text-white border border-white/20 group-hover:bg-tiffany-500 group-hover:border-tiffany-500 transition-all">
                      <ArrowRight size={24} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Help Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-6">Didn't find what you were looking for?</h2>
          <p className="text-gray-500 text-lg mb-8">
            Our inventory updates daily. Check out our new arrivals or contact our sourcing team.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/products" className="px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-tiffany-600 transition-colors">
              Browse All Products
            </Link>
            <Link href="/contact" className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-900 font-bold rounded-2xl hover:border-tiffany-500 transition-colors">
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
      }

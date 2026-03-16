// app/categories/page.tsx
import { prisma } from '@/lib/db'
import { formatCategoryName, getCategoryIcon } from '@/lib/productClassifier'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const revalidate = 3600

async function getCategories() {
  const categories = await prisma.product.groupBy({
    by: ['category'],
    where: { isActive: true },
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } },
  })

  return categories.map(c => ({
    name: c.category,
    count: c._count.category,
    slug: c.category,
  }))
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            All Categories
          </h1>
          <p className="text-gray-600">
            Browse our {categories.length} product categories
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="group"
            >
              <div className="bg-white rounded-2xl p-6 hover:shadow-xl transition-all border-2 border-gray-100 hover:border-tiffany-300">
                <div className="text-center">
                  <div className="text-5xl mb-3">
                    {getCategoryIcon(category.slug)}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-tiffany-600 transition-colors mb-1">
                    {formatCategoryName(category.name)}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {category.count} products
                  </p>
                  <div className="flex items-center justify-center gap-1 text-tiffany-600 text-sm font-medium">
                    Browse
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

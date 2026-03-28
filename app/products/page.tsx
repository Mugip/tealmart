// app/products/page.tsx
import { prisma } from '@/lib/db'
import ProductCard from '@/components/products/ProductCard'
import { formatCategoryName, getCategoryIcon } from '@/lib/productClassifier'
import { CategoryFilter, SortFilter, FeaturedToggle } from '@/components/products/ProductFiltersClient'
import { Search, SlidersHorizontal, TrendingUp } from 'lucide-react'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: string; featured?: string; search?: string; page?: string }
}) {
  const { category, sort, featured, search, page } = searchParams
  
  // Pagination (Take 48 instead of 500 to stop payload crashing)
  const take = 48
  const skip = page ? (parseInt(page) - 1) * take : 0

  const where: any = { isActive: true }
  
  if (category && category !== 'all') {
    where.category = category
  }
  
  if (search) {
    where.OR =[
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ]
  }

  let orderBy: any = { createdAt: 'desc' }
  if (sort === 'price-asc') orderBy = { price: 'asc' }
  else if (sort === 'price-desc') orderBy = { price: 'desc' }
  else if (sort === 'rating') orderBy = { rating: 'desc' }
  else if (sort === 'popular') orderBy = { views: 'desc' }

  let products
  if (featured === 'true') {
    products = await prisma.product.findMany({
      where: { ...where, isFeatured: true },
      orderBy,
      take,
      skip,
    })
    if (products.length < 8 && skip === 0) {
      products = await prisma.product.findMany({
        where,
        orderBy:[{ isFeatured: 'desc' }, { views: 'desc' }, { createdAt: 'desc' }],
        take,
        skip,
      })
    }
  } else {
    products = await prisma.product.findMany({
      where,
      orderBy,
      take,
      skip,
    })
  }

  const categories = await prisma.product.groupBy({
    by: ['category'],
    where: { isActive: true },
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } }
  })

  const categoryList = categories.map(c => ({ name: c.category, count: c._count.category }))
  const displayTitle = featured === 'true' ? 'Featured Products' : category ? formatCategoryName(category) : 'All Products'
  const categoryIcon = category ? getCategoryIcon(category) : featured === 'true' ? '⭐' : '🛍️'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Search & Hero logic remains the same... */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CategoryFilter categories={categoryList} currentCategory={category} />
            <SortFilter currentSort={sort} />
            <div className="sm:col-span-2 lg:col-span-1 flex items-end">
              <FeaturedToggle isFeatured={featured === 'true'} />
            </div>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">No products found.</div>
        )}

        {products.length === take && (
          <div className="mt-12 text-center">
            <a href={`/products?page=${parseInt(page || '1') + 1}${category ? `&category=${category}` : ''}`} className="btn-primary">
              Load More Products
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

// app/products/page.tsx
import { prisma } from '@/lib/db'
import ProductCard from '@/components/products/ProductCard'
import { formatCategoryName, getCategoryIcon } from '@/lib/productClassifier'
import { CategoryFilter, SortFilter, FeaturedToggle } from '@/components/products/ProductFiltersClient'
import { Search, SlidersHorizontal, TrendingUp } from 'lucide-react'

type SearchParams = {
  category?: string
  sort?: string
  featured?: string
  search?: string
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { category, sort, featured, search } = searchParams

  // Build where clause
  const where: any = { isActive: true }
  
  if (category && category !== 'all') {
    where.category = category
  }
  
  if (featured === 'true') {
    where.isFeatured = true
  }
  
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ]
  }

  // Build orderBy clause
  let orderBy: any = { createdAt: 'desc' }
  
  if (sort === 'price-asc') {
    orderBy = { price: 'asc' }
  } else if (sort === 'price-desc') {
    orderBy = { price: 'desc' }
  } else if (sort === 'rating') {
    orderBy = { rating: 'desc' }
  } else if (sort === 'popular') {
    orderBy = { views: 'desc' }
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      take: 500,
    }),
    prisma.product.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } }
    }),
  ])

  const categoryList = categories.map(c => ({
    name: c.category,
    count: c._count.category
  }))

  const displayTitle = category 
    ? formatCategoryName(category)
    : 'All Products'

  const categoryIcon = category ? getCategoryIcon(category) : '🛍️'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-tiffany-600 to-tiffany-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-3">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Trending Products</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 flex items-center justify-center sm:justify-start gap-3">
                <span className="text-4xl">{categoryIcon}</span>
                {displayTitle}
              </h1>
              <p className="text-tiffany-100 text-base sm:text-lg">
                Discover amazing products at unbeatable prices
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/30">
              <p className="text-xs sm:text-sm text-tiffany-100 text-center">Total Products</p>
              <p className="text-3xl sm:text-4xl font-bold text-center">{products.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Search Bar */}
        <div className="mb-6">
          <form action="/products" method="get" className="relative">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search products..."
              className="w-full px-4 sm:px-6 py-3 sm:py-4 pl-12 sm:pl-14 rounded-xl sm:rounded-2xl border-2 border-gray-200 focus:border-tiffany-500 focus:ring-4 focus:ring-tiffany-100 outline-none transition-all text-sm sm:text-base shadow-sm"
            />
            <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            {category && <input type="hidden" name="category" value={category} />}
            {sort && <input type="hidden" name="sort" value={sort} />}
            {featured && <input type="hidden" name="featured" value={featured} />}
          </form>
        </div>

        {/* Active Search Query */}
        {search && (
          <div className="mb-4 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              Searching for: <span className="font-semibold text-tiffany-600">"{search}"</span>
              {' '}- 
              <a href={`/products${category ? `?category=${category}` : ''}`} className="text-tiffany-600 hover:text-tiffany-700 ml-2 underline">
                Clear
              </a>
            </p>
          </div>
        )}

        {/* Filters - Mobile Optimized */}
        <div className="mb-6 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4 text-gray-700">
            <SlidersHorizontal className="w-5 h-5" />
            <h2 className="font-bold text-base sm:text-lg">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CategoryFilter categories={categoryList} currentCategory={category} />
            <SortFilter currentSort={sort} />
            <div className="sm:col-span-2 lg:col-span-1 flex items-end">
              <FeaturedToggle isFeatured={featured === 'true'} />
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-4 sm:mb-6">
          <p className="text-sm sm:text-base text-gray-600">
            Showing <span className="font-bold text-gray-900">{products.length}</span> products
            {category && (
              <span className="ml-2 text-tiffany-600">
                in {formatCategoryName(category)}
              </span>
            )}
          </p>
        </div>

        {/* No Results */}
        {products.length === 0 && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-8 sm:p-16 text-center">
            <div className="text-5xl sm:text-6xl mb-4">🔍</div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              {search ? (
                <>No products match your search for "{search}"</>
              ) : (
                <>Try adjusting your filters or search terms</>
              )}
            </p>
            <a
              href="/products"
              className="inline-block px-6 sm:px-8 py-3 bg-gradient-to-r from-tiffany-500 to-tiffany-600 text-white font-bold rounded-xl hover:shadow-lg transition-all text-sm sm:text-base"
            >
              View All Products
            </a>
          </div>
        )}

        {/* Products Grid */}
        {products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Load More Info */}
        {products.length >= 500 && (
          <div className="mt-8 sm:mt-12 text-center">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 px-6 sm:px-8 py-4 sm:py-6 inline-block">
              <p className="text-xs sm:text-sm text-gray-600">
                Showing first 500 products. Refine your search for more specific results.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// app/products/page.tsx
import { prisma } from '@/lib/db'
import ProductCard from '@/components/products/ProductCard'
import ProductFilters from '@/components/products/ProductFilters'
import SortDropdown from '@/components/products/SortDropdown'
import { Search, SlidersHorizontal } from 'lucide-react'

type SearchParams = {
  category?: string
  sort?: string
  featured?: string
  search?: string
  minPrice?: string
  maxPrice?: string
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { category, sort, featured, search, minPrice, maxPrice } = searchParams

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
      { tags: { has: search.toLowerCase() } },
    ]
  }

  if (minPrice || maxPrice) {
    where.price = {}
    if (minPrice) where.price.gte = parseFloat(minPrice)
    if (maxPrice) where.price.lte = parseFloat(maxPrice)
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

  const [products, categories, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      take: 100, // Limit for performance
    }),
    prisma.product.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } }
    }),
    prisma.product.count({ where })
  ])

  const categoryList = categories.map(c => ({
    name: c.category,
    count: c._count.category
  }))

  const displayTitle = category 
    ? category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : 'All Products'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-tiffany-600 to-tiffany-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold mb-2">
                {displayTitle}
              </h1>
              <p className="text-tiffany-100 text-lg">
                Discover amazing products at unbeatable prices
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/30">
                <p className="text-sm text-tiffany-100">Total Products</p>
                <p className="text-4xl font-bold">{totalCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Search Bar */}
        <div className="mb-8">
          <form action="/products" method="get" className="relative">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search for products..."
              className="w-full px-6 py-4 pl-14 rounded-2xl border-2 border-gray-200 focus:border-tiffany-500 focus:ring-4 focus:ring-tiffany-100 outline-none transition-all text-lg shadow-sm"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
            {category && <input type="hidden" name="category" value={category} />}
            {sort && <input type="hidden" name="sort" value={sort} />}
            {featured && <input type="hidden" name="featured" value={featured} />}
          </form>
        </div>

        {/* Active Filters */}
        {(search || category || featured === 'true' || minPrice || maxPrice) && (
          <div className="mb-6 flex flex-wrap gap-2">
            {search && (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-tiffany-100 text-tiffany-800 rounded-full text-sm font-medium">
                Search: "{search}"
                <a href="/products" className="hover:text-tiffany-900">×</a>
              </span>
            )}
            {category && category !== 'all' && (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Category: {displayTitle}
                <a href="/products" className="hover:text-blue-900">×</a>
              </span>
            )}
            {featured === 'true' && (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                Featured
                <a href="/products" className="hover:text-yellow-900">×</a>
              </span>
            )}
            <a 
              href="/products" 
              className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium underline"
            >
              Clear all
            </a>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Filters Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="sticky top-4">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-tiffany-500 to-tiffany-600 px-6 py-4">
                  <div className="flex items-center gap-3 text-white">
                    <SlidersHorizontal size={24} />
                    <h2 className="text-xl font-bold">Filters</h2>
                  </div>
                </div>
                <ProductFilters 
                  categories={categoryList} 
                  currentCategory={category}
                  currentSort={sort}
                />
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            
            {/* Sort & Count Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-6 py-4 mb-6 flex items-center justify-between">
              <div>
                <p className="text-gray-600">
                  Showing <span className="font-bold text-gray-900">{products.length}</span> of{' '}
                  <span className="font-bold text-gray-900">{totalCount}</span> products
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <SortDropdown currentSort={sort} />
              </div>
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-16 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or search terms
                </p>
                <a 
                  href="/products" 
                  className="inline-block px-8 py-3 bg-gradient-to-r from-tiffany-500 to-tiffany-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                >
                  View All Products
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Load More Placeholder */}
            {products.length >= 100 && (
              <div className="mt-12 text-center">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-6 inline-block">
                  <p className="text-gray-600 mb-4">
                    Showing first 100 products. Refine your search for more specific results.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

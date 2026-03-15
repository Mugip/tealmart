// app/products/page.tsx
import { prisma } from '@/lib/db'
import ProductCard from '@/components/products/ProductCard'
import { formatCategoryName } from '@/lib/productClassifier'
import { Search } from 'lucide-react'

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
      take: 500, // Increased limit
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {displayTitle}
          </h1>
          <p className="text-gray-600">
            Discover amazing products at unbeatable prices
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 max-w-2xl mx-auto">
          <form action="/products" method="get" className="relative">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search by product name, category, or keywords..."
              className="w-full px-6 py-4 pl-14 rounded-xl border border-gray-300 focus:border-tiffany-500 focus:ring-2 focus:ring-tiffany-500 outline-none transition-all text-base shadow-sm"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            {category && <input type="hidden" name="category" value={category} />}
            {sort && <input type="hidden" name="sort" value={sort} />}
            {featured && <input type="hidden" name="featured" value={featured} />}
          </form>
        </div>

        {/* Active Search Query */}
        {search && (
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-600">
              Searching for: <span className="font-semibold text-tiffany-600">"{search}"</span>
              {' '}- 
              <a href={`/products${category ? `?category=${category}` : ''}`} className="text-tiffany-600 hover:text-tiffany-700 ml-2 underline">
                Clear search
              </a>
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4 items-center justify-between">
          {/* Category Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              name="category"
              defaultValue={category || ''}
              onChange={(e) => {
                const url = new URL(window.location.href)
                if (e.target.value) {
                  url.searchParams.set('category', e.target.value)
                } else {
                  url.searchParams.delete('category')
                }
                window.location.href = url.toString()
              }}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500"
            >
              <option value="">All Products</option>
              {categoryList.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {formatCategoryName(cat.name)} ({cat.count})
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              name="sort"
              defaultValue={sort || 'newest'}
              onChange={(e) => {
                const url = new URL(window.location.href)
                url.searchParams.set('sort', e.target.value)
                window.location.href = url.toString()
              }}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="featured"
              defaultChecked={featured === 'true'}
              onChange={(e) => {
                const url = new URL(window.location.href)
                if (e.target.checked) {
                  url.searchParams.set('featured', 'true')
                } else {
                  url.searchParams.delete('featured')
                }
                window.location.href = url.toString()
              }}
              className="h-4 w-4 text-tiffany-600 focus:ring-tiffany-500 border-gray-300 rounded"
            />
            <label htmlFor="featured" className="text-sm font-medium text-gray-700">
              Featured Only
            </label>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{products.length}</span> products
          </p>
        </div>

        {/* No Results */}
        {products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">
              {search ? (
                <>No products match your search for "{search}"</>
              ) : (
                <>No products available{category ? ' in this category' : ''}</>
              )}
            </p>
            <a
              href="/products"
              className="inline-block px-6 py-3 bg-tiffany-600 text-white rounded-lg hover:bg-tiffany-700 transition-colors"
            >
              Clear all filters
            </a>
          </div>
        )}

        {/* Products Grid */}
        {products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

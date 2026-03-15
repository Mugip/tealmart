// app/products/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductCard from '@/components/products/ProductCard'
import ProductSearch from '@/components/products/ProductSearch'
import { formatCategoryName } from '@/lib/productClassifier'

function ProductsContent() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')
  const sortParam = searchParams.get('sort')
  const featuredParam = searchParams.get('featured')
  const searchFromUrl = searchParams.get('search') || ''

  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || '')
  const [sortBy, setSortBy] = useState(sortParam || 'newest')
  const [featuredOnly, setFeaturedOnly] = useState(featuredParam === 'true')
  const [searchQuery, setSearchQuery] = useState(searchFromUrl)

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      try {
        const params = new URLSearchParams()
        if (selectedCategory) params.append('category', selectedCategory)
        if (sortBy) params.append('sort', sortBy)
        if (featuredOnly) params.append('featured', 'true')

        const res = await fetch(`/api/products?${params}`)
        const data = await res.json()
        setProducts(data.products || [])
        setFilteredProducts(data.products || [])
        setCategories(data.categories || [])
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [selectedCategory, sortBy, featuredOnly])

  // Handle search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = products.filter(product => {
      const titleMatch = product.title?.toLowerCase().includes(query)
      const descriptionMatch = product.description?.toLowerCase().includes(query)
      const categoryMatch = product.category?.toLowerCase().includes(query)
      const tagsMatch = product.tags?.some((tag: string) => tag.toLowerCase().includes(query))

      return titleMatch || descriptionMatch || categoryMatch || tagsMatch
    })

    setFilteredProducts(filtered)
  }, [searchQuery, products])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tiffany-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {selectedCategory ? formatCategoryName(selectedCategory) : 'All Products'}
          </h1>
          <p className="text-gray-600">
            Discover amazing products at unbeatable prices
          </p>
        </div>

        {/* Search Bar */}
        <ProductSearch 
          onSearch={handleSearch}
          placeholder="Search by product name, category, or keywords..."
        />

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4 items-center justify-between">
          {/* Category Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500"
            >
              <option value="">All Products</option>
              {categories.map((cat) => (
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
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
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
              checked={featuredOnly}
              onChange={(e) => setFeaturedOnly(e.target.checked)}
              className="h-4 w-4 text-tiffany-600 focus:ring-tiffany-500 border-gray-300 rounded"
            />
            <label htmlFor="featured" className="text-sm font-medium text-gray-700">
              Featured Only
            </label>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">
            {searchQuery ? (
              <>
                Showing <span className="font-semibold">{filteredProducts.length}</span> of{' '}
                <span className="font-semibold">{products.length}</span> products
              </>
            ) : (
              <>
                Showing <span className="font-semibold">{filteredProducts.length}</span> products
              </>
            )}
          </p>
          
          {searchQuery && filteredProducts.length === 0 && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-tiffany-600 hover:text-tiffany-700 text-sm font-medium"
            >
              Clear search
            </button>
          )}
        </div>

        {/* No Results */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? (
                <>No products match your search for "{searchQuery}"</>
              ) : (
                <>No products available in this category</>
              )}
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('')
                setFeaturedOnly(false)
              }}
              className="px-6 py-3 bg-tiffany-600 text-white rounded-lg hover:bg-tiffany-700 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tiffany-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}

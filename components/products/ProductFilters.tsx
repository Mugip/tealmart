'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function ProductFilters({ categories }: { categories: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentCategory = searchParams.get('category')
  const currentSort = searchParams.get('sort')

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    router.push(`/products?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Sort */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Sort By</h3>
        <select
          value={currentSort || ''}
          onChange={(e) => updateFilter('sort', e.target.value || null)}
          className="input-field text-sm"
        >
          <option value="">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
        <div className="space-y-2">
          <button
            onClick={() => updateFilter('category', null)}
            className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              !currentCategory
                ? 'bg-tiffany-100 text-tiffany-700 font-semibold'
                : 'hover:bg-gray-100'
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => updateFilter('category', category)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                currentCategory === category
                  ? 'bg-tiffany-100 text-tiffany-700 font-semibold'
                  : 'hover:bg-gray-100'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {(currentCategory || currentSort) && (
        <button
          onClick={() => router.push('/products')}
          className="w-full py-2 text-sm text-tiffany-600 hover:text-tiffany-700 font-semibold"
        >
          Clear All Filters
        </button>
      )}
    </div>
  )
}

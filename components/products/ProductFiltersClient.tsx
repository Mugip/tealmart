// components/products/ProductFiltersClient.tsx
'use client'

import { formatCategoryName } from '@/lib/productClassifier'

export function CategoryFilter({ 
  categories, 
  currentCategory 
}: { 
  categories: { name: string; count: number }[]
  currentCategory?: string 
}) {
  return (
    <div className="flex-1 min-w-[200px]">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Category
      </label>
      <select
        value={currentCategory || ''}
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
        {categories.map((cat) => (
          <option key={cat.name} value={cat.name}>
            {formatCategoryName(cat.name)} ({cat.count})
          </option>
        ))}
      </select>
    </div>
  )
}

export function SortFilter({ currentSort }: { currentSort?: string }) {
  return (
    <div className="flex-1 min-w-[200px]">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Sort By
      </label>
      <select
        value={currentSort || 'newest'}
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
  )
}

export function FeaturedToggle({ isFeatured }: { isFeatured?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="featured"
        checked={isFeatured}
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
  )
}

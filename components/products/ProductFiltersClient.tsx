// components/products/ProductFiltersClient.tsx
'use client'

import { formatCategoryName } from '@/lib/productClassifier'
import { useRouter, useSearchParams } from 'next/navigation' // ✅ NEW

export function CategoryFilter({ 
  categories, 
  currentCategory 
}: { 
  categories: { name: string; count: number }[]
  currentCategory?: string 
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set('category', e.target.value)
    } else {
      params.delete('category')
    }
    params.delete('page') // Reset pagination on filter change
    router.push(`?${params.toString()}`, { scroll: false }) // ✅ Soft navigation
  }

  return (
    <div className="flex-1 min-w-[200px]">
      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
      <select
        value={currentCategory || ''}
        onChange={handleChange}
        className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500 text-sm sm:text-base"
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
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', e.target.value)
    router.push(`?${params.toString()}`, { scroll: false }) // ✅ Soft navigation
  }

  return (
    <div className="flex-1 min-w-[200px]">
      <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
      <select
        value={currentSort || 'newest'}
        onChange={handleChange}
        className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500 text-sm sm:text-base"
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
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.checked) {
      params.set('featured', 'true')
    } else {
      params.delete('featured')
    }
    params.delete('page')
    router.push(`?${params.toString()}`, { scroll: false }) // ✅ Soft navigation
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">Show Featured</label>
      <div className="flex items-center h-[42px] px-4 border border-gray-300 rounded-lg bg-white">
        <input
          type="checkbox"
          id="featured"
          checked={isFeatured}
          onChange={handleChange}
          className="h-4 w-4 text-tiffany-600 focus:ring-tiffany-500 border-gray-300 rounded"
        />
        <label htmlFor="featured" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
          Featured Only ⭐
        </label>
      </div>
    </div>
  )
}

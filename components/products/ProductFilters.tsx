// components/products/ProductFilters.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, Star, Tag, DollarSign } from 'lucide-react'

interface Category {
  name: string
  count: number
}

interface ProductFiltersProps {
  categories: Category[]
  currentCategory?: string
  currentSort?: string
}

export default function ProductFilters({ 
  categories, 
  currentCategory,
  currentSort 
}: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (category === 'all') {
      params.delete('category')
    } else {
      params.set('category', category)
    }
    router.push(`/products?${params.toString()}`)
  }

  const handleFeaturedToggle = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (params.get('featured') === 'true') {
      params.delete('featured')
    } else {
      params.set('featured', 'true')
    }
    router.push(`/products?${params.toString()}`)
  }

  const handlePriceFilter = (min?: number, max?: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (min !== undefined) params.set('minPrice', min.toString())
    else params.delete('minPrice')
    
    if (max !== undefined) params.set('maxPrice', max.toString())
    else params.delete('maxPrice')
    
    router.push(`/products?${params.toString()}`)
  }

  return (
    <div className="space-y-6 p-6">
      
      {/* Categories */}
      <div>
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Tag size={20} className="text-tiffany-600" />
          Categories
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
              !currentCategory || currentCategory === 'all'
                ? 'bg-tiffany-500 text-white font-bold shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Products
          </button>
          
          {categories.map(cat => (
            <button
              key={cat.name}
              onClick={() => handleCategoryChange(cat.name)}
              className={`w-full text-left px-4 py-2 rounded-lg transition-all flex items-center justify-between ${
                currentCategory === cat.name
                  ? 'bg-tiffany-500 text-white font-bold shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="capitalize">
                {cat.name.split('-').join(' ')}
              </span>
              <span className={`text-sm px-2 py-1 rounded-full ${
                currentCategory === cat.name
                  ? 'bg-white/20'
                  : 'bg-gray-200'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Featured */}
      <div className="pt-6 border-t border-gray-200">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={searchParams.get('featured') === 'true'}
            onChange={handleFeaturedToggle}
            className="w-5 h-5 rounded border-2 border-gray-300 text-tiffany-600 focus:ring-2 focus:ring-tiffany-500"
          />
          <div className="flex items-center gap-2">
            <Star size={20} className="text-yellow-500 fill-yellow-500" />
            <span className="font-semibold text-gray-900 group-hover:text-tiffany-600 transition-colors">
              Featured Only
            </span>
          </div>
        </label>
      </div>

      {/* Price Range */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign size={20} className="text-tiffany-600" />
          Price Range
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => handlePriceFilter()}
            className="w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
          >
            All Prices
          </button>
          <button
            onClick={() => handlePriceFilter(0, 25)}
            className="w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
          >
            Under $25
          </button>
          <button
            onClick={() => handlePriceFilter(25, 50)}
            className="w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
          >
            $25 - $50
          </button>
          <button
            onClick={() => handlePriceFilter(50, 100)}
            className="w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
          >
            $50 - $100
          </button>
          <button
            onClick={() => handlePriceFilter(100)}
            className="w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
          >
            Over $100
          </button>
        </div>
      </div>
    </div>
  )
}

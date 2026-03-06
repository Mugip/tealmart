// components/products/SortDropdown.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface SortDropdownProps {
  currentSort?: string
}

export default function SortDropdown({ currentSort }: SortDropdownProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'newest') {
      params.delete('sort')
    } else {
      params.set('sort', value)
    }
    router.push(`/products?${params.toString()}`)
  }

  return (
    <select
      value={currentSort || 'newest'}
      onChange={(e) => handleSortChange(e.target.value)}
      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-tiffany-500 focus:ring-2 focus:ring-tiffany-100 outline-none transition-all font-medium"
    >
      <option value="newest">Newest</option>
      <option value="price-asc">Price: Low to High</option>
      <option value="price-desc">Price: High to Low</option>
      <option value="rating">Top Rated</option>
      <option value="popular">Most Popular</option>
    </select>
  )
}

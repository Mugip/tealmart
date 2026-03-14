// components/products/ProductSearch.tsx
'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'

interface ProductSearchProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export default function ProductSearch({ onSearch, placeholder = "Search products..." }: ProductSearchProps) {
  const [query, setQuery] = useState('')

  const handleSearch = (value: string) => {
    setQuery(value)
    onSearch(value)
  }

  const clearSearch = () => {
    setQuery('')
    onSearch('')
  }

  return (
    <div className="relative max-w-xl mx-auto mb-8">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="block w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500 bg-white shadow-sm transition-all text-base"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {query && (
        <div className="absolute left-0 right-0 mt-2 text-sm text-gray-600 px-4">
          Searching for: <span className="font-semibold text-tiffany-600">{query}</span>
        </div>
      )}
    </div>
  )
}

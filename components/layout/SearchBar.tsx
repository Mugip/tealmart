// components/layout/SearchBar.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, X } from 'lucide-react'
import Image from 'next/image'
import { useCurrency } from '@/lib/contexts/CurrencyContext'

interface Suggestion {
  id: string
  title: string
  price: number
  image: string
  category: string
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1) // ✅ NEW: Keyboard focus tracking
  const router = useRouter()
  const { formatPrice } = useCurrency()
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([])
        setIsOpen(false)
        return
      }
      setLoading(true)
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setSuggestions(data)
        setIsOpen(true)
        setSelectedIndex(-1) // Reset selection
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }
    const timeoutId = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(timeoutId)
  }, [query])

  // ✅ NEW: Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[selectedIndex].id)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsOpen(false)
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query)}`)
    } else {
      router.push('/products')
    }
  }

  const handleSelect = (id: string) => {
    setIsOpen(false)
    setQuery('')
    router.push(`/products/${id}`)
  }

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search products..."
            className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500 text-sm bg-gray-50 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSuggestions([]); setIsOpen(false); }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {loading ? <Loader2 size={16} className="animate-spin text-tiffany-500" /> : <X size={16} />}
            </button>
          )}
        </div>
      </form>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          <div className="max-h-96 overflow-y-auto">
            {suggestions.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 p-3 border-b border-gray-50 last:border-0 transition-colors text-left ${
                  selectedIndex === index ? 'bg-tiffany-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="relative w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  <Image src={item.image || '/placeholder.png'} alt={item.title} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${selectedIndex === index ? 'text-tiffany-700' : 'text-gray-900'}`}>{item.title}</p>
                  <p className="text-xs text-gray-500 capitalize">{item.category.replace('-', ' ')}</p>
                </div>
                <div className="text-sm font-bold text-tiffany-600 flex-shrink-0">
                  {formatPrice(item.price)}
                </div>
              </button>
            ))}
          </div>
          <button 
            onClick={handleSubmit}
            className="w-full p-3 text-center text-sm text-tiffany-600 font-semibold bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            View all results for "{query}" →
          </button>
        </div>
      )}
    </div>
  )
            }

// components/layout/Header.tsx
'use client'

import Link from 'next/link'
import { ShoppingCart, Menu, User } from 'lucide-react'
import { useCart } from '@/lib/contexts/CartContext'
import { useState } from 'react'
import SearchBar from './SearchBar'

export default function Header() {
  const { items } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Logo - More compact on mobile */}
          <Link href="/" className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-tiffany-500 to-tiffany-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg sm:text-xl">T</span>
            </div>
            {/* Hide text on very small screens */}
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 hidden xs:inline">TealMart</span>
          </Link>

          {/* Search bar in middle (desktop only) */}
          <div className="hidden md:block flex-1 max-w-xl">
            <SearchBar />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6">
            <Link href="/products" className="text-sm font-medium text-gray-700 hover:text-tiffany-600 transition-colors whitespace-nowrap">
              Products
            </Link>
            <Link href="/categories" className="text-sm font-medium text-gray-700 hover:text-tiffany-600 transition-colors whitespace-nowrap">
              Categories
            </Link>
            <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-tiffany-600 transition-colors whitespace-nowrap">
              About
            </Link>
            <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-tiffany-600 transition-colors whitespace-nowrap">
              Contact
            </Link>
          </nav>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <Link href="/admin" className="text-gray-700 hover:text-tiffany-600 transition-colors hidden md:block">
              <User size={20} className="sm:w-[22px] sm:h-[22px]" />
            </Link>

            <Link href="/cart" className="relative text-gray-700 hover:text-tiffany-600 transition-colors">
              <ShoppingCart size={20} className="sm:w-[22px] sm:h-[22px]" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-tiffany-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            <button 
              className="lg:hidden text-gray-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <Menu size={20} className="sm:w-[22px] sm:h-[22px]" />
            </button>
          </div>
        </div>

        {/* Mobile Search - reduced padding */}
        <div className="md:hidden pb-2">
          <SearchBar />
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t py-3">
            <nav className="flex flex-col space-y-3">
              <Link 
                href="/products" 
                className="text-sm font-medium text-gray-700 hover:text-tiffany-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              <Link 
                href="/categories" 
                className="text-sm font-medium text-gray-700 hover:text-tiffany-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Categories
              </Link>
              <Link 
                href="/about" 
                className="text-sm font-medium text-gray-700 hover:text-tiffany-600"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/contact" 
                className="text-sm font-medium text-gray-700 hover:text-tiffany-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <Link 
                href="/admin" 
                className="text-sm font-medium text-gray-700 hover:text-tiffany-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Admin
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

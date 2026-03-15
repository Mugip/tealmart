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
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-tiffany-500 to-tiffany-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 hidden sm:inline">TealMart</span>
          </Link>

          {/* Search bar in middle (desktop only) */}
          <div className="hidden md:block flex-1 max-w-xl">
            <SearchBar />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link href="/products" className="text-gray-700 hover:text-tiffany-600 font-medium transition-colors whitespace-nowrap">
              Products
            </Link>
            <Link href="/categories" className="text-gray-700 hover:text-tiffany-600 font-medium transition-colors whitespace-nowrap">
              Categories
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-tiffany-600 font-medium transition-colors whitespace-nowrap">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-tiffany-600 font-medium transition-colors whitespace-nowrap">
              Contact
            </Link>
          </nav>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <Link href="/admin" className="text-gray-700 hover:text-tiffany-600 transition-colors hidden md:block">
              <User size={22} />
            </Link>

            <Link href="/cart" className="relative text-gray-700 hover:text-tiffany-600 transition-colors">
              <ShoppingCart size={22} />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-tiffany-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            <button 
              className="lg:hidden text-gray-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <SearchBar />
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t py-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/products" 
                className="text-gray-700 hover:text-tiffany-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              <Link 
                href="/categories" 
                className="text-gray-700 hover:text-tiffany-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Categories
              </Link>
              <Link 
                href="/about" 
                className="text-gray-700 hover:text-tiffany-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/contact" 
                className="text-gray-700 hover:text-tiffany-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <Link 
                href="/admin" 
                className="text-gray-700 hover:text-tiffany-600 font-medium"
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

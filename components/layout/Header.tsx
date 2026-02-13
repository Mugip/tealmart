'use client'

import Link from 'next/link'
import { ShoppingCart, Search, Menu, User } from 'lucide-react'
import { useCart } from '@/lib/contexts/CartContext'
import { useState } from 'react'

export default function Header() {
  const { items } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-tiffany-500 to-tiffany-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">TealMart</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="text-gray-700 hover:text-tiffany-600 font-medium transition-colors">
              Products
            </Link>
            <Link href="/categories" className="text-gray-700 hover:text-tiffany-600 font-medium transition-colors">
              Categories
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-tiffany-600 font-medium transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-tiffany-600 font-medium transition-colors">
              Contact
            </Link>
          </nav>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            <button className="text-gray-700 hover:text-tiffany-600 transition-colors">
              <Search size={22} />
            </button>
            
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
              className="md:hidden text-gray-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4">
            <nav className="flex flex-col space-y-4">
              <Link href="/products" className="text-gray-700 hover:text-tiffany-600 font-medium">
                Products
              </Link>
              <Link href="/categories" className="text-gray-700 hover:text-tiffany-600 font-medium">
                Categories
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-tiffany-600 font-medium">
                About
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-tiffany-600 font-medium">
                Contact
              </Link>
              <Link href="/admin" className="text-gray-700 hover:text-tiffany-600 font-medium">
                Admin
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

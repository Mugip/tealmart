// components/layout/Header.tsx
'use client'

import Link from 'next/link'
import { ShoppingCart, Menu, User, Heart, LogOut, Package, ChevronDown, X, Globe, Search } from 'lucide-react'
import { useCart } from '@/lib/contexts/CartContext'
import { useWishlist } from '@/lib/contexts/WishlistContext'
import { useCurrency } from '@/lib/contexts/CurrencyContext'
import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import SearchBar from './SearchBar'

export default function Header() {
  const { items } = useCart()
  const { wishlistIds } = useWishlist()
  const { currency, setCurrency, rates } = useCurrency()
  const { data: session, status } = useSession()
  
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0)

  // Handle click outside for user dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const userInitial = session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* 1. Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0 group">
            <img src="/logo.svg" alt="TealMart" className="h-9 w-auto object-contain transition-transform group-hover:scale-110" />
            <span className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">TealMart</span>
          </Link>

          {/* 2. Desktop Search */}
          <div className="hidden md:block flex-1 max-w-md">
            <SearchBar />
          </div>

          {/* 3. Global Switcher (Desktop) */}
          <div className="hidden xl:flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
            <Globe size={14} className="text-gray-400 ml-1" />
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-gray-700 outline-none cursor-pointer hover:text-tiffany-600 transition-colors"
            >
              {Object.keys(rates).sort().map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>

          {/* 4. Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link href="/products" className="text-sm font-semibold text-gray-600 hover:text-tiffany-600 transition-colors">Products</Link>
            <Link href="/categories" className="text-sm font-semibold text-gray-600 hover:text-tiffany-600 transition-colors">Categories</Link>
          </nav>

          {/* 5. Right Icons */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            
            {/* Wishlist */}
            <Link href="/account/wishlist" className="relative p-2 text-gray-600 hover:text-red-500 transition-all hover:bg-red-50 rounded-full">
              <Heart size={22} />
              {wishlistIds.size > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-bounce">
                  {wishlistIds.size}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link href="/cart" className="relative p-2 text-gray-600 hover:text-tiffany-600 transition-all hover:bg-tiffany-50 rounded-full">
              <ShoppingCart size={22} />
              {cartItemsCount > 0 && (
                <span className="absolute top-1 right-1 bg-tiffany-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* User Dropdown */}
            <div className="relative" ref={userMenuRef}>
              {session ? (
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-2 border rounded-full hover:bg-gray-50 transition-all"
                >
                  <span className="text-xs font-bold text-gray-600 hidden sm:inline">{session.user?.name?.split(' ')[0]}</span>
                  <div className="w-8 h-8 rounded-full bg-tiffany-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {userInitial}
                  </div>
                </button>
              ) : (
                <Link href="/auth/signin" className="hidden sm:flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-tiffany-600 transition-all shadow-md">
                  <User size={16} /> Sign In
                </Link>
              )}

              {/* User Menu Popover */}
              {isUserMenuOpen && session && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 bg-gray-50 border-b mb-1">
                    <p className="font-bold text-gray-900 text-sm truncate">{session.user?.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{session.user?.email}</p>
                  </div>
                  <Link href="/account" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-tiffany-50 hover:text-tiffany-700 font-medium transition-colors">
                    <User size={16} /> My Profile
                  </Link>
                  <Link href="/account/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-tiffany-50 hover:text-tiffany-700 font-medium transition-colors">
                    <Package size={16} /> Order History
                  </Link>
                  <div className="border-t mt-1 pt-1">
                    <button onClick={() => signOut()} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full font-bold transition-colors">
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden p-2 text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (Visible only on mobile) */}
        <div className="md:hidden pb-4">
          <SearchBar />
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-2xl animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col p-6 space-y-4">
            <Link href="/products" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-gray-800">Shop All Products</Link>
            <Link href="/categories" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-gray-800">Browse Categories</Link>
            <Link href="/about" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-gray-800">About TealMart</Link>
            
            <div className="pt-4 border-t flex flex-col gap-4">
               <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
                 <span className="text-sm font-bold text-gray-500 flex items-center gap-2"><Globe size={16}/> Regional Currency</span>
                 <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-white border px-3 py-1 rounded-lg font-bold text-sm"
                 >
                   {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
               </div>

               {!session && (
                 <Link href="/auth/signin" className="w-full bg-tiffany-500 text-white text-center py-4 rounded-2xl font-bold">
                   Sign In to Account
                 </Link>
               )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

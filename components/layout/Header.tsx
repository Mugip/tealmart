// components/layout/Header.tsx
'use client'

import Link from 'next/link'
import { ShoppingCart, Menu, User, Heart, LogOut, Package, ChevronDown, X, Globe } from 'lucide-react'
import { useCart } from '@/lib/contexts/CartContext'
import { useWishlist } from '@/lib/contexts/WishlistContext'
import { useCurrency } from '@/lib/contexts/CurrencyContext'
import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import SearchBar from './SearchBar'

export default function Header() {
  const { items } = useCart()
  const { wishlistIds } = useWishlist()
  const { currency, setCurrency, rates, getFlag } = useCurrency()
  const { data: session } = useSession()
  
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0)

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
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0 group">
            <img src="/logo.svg" alt="TealMart" className="h-9 w-auto object-contain transition-transform group-hover:scale-110" />
            <span className="text-xl sm:text-2xl font-black text-gray-900 tracking-tighter">TealMart</span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:block flex-1 max-w-md">
            <SearchBar />
          </div>

          {/* High-End Global Switcher (Desktop) */}
          <div className="hidden xl:flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 hover:border-tiffany-200 transition-colors group">
            <span className="text-lg ml-1">{getFlag(currency)}</span>
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-transparent text-xs font-black text-gray-700 outline-none cursor-pointer pr-1 uppercase tracking-tighter"
            >
              {Object.keys(rates).sort().map(code => (
                <option key={code} value={code}>
                  {getFlag(code)} {code}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link href="/products" className="text-sm font-bold text-gray-600 hover:text-tiffany-600">Products</Link>
            <Link href="/categories" className="text-sm font-bold text-gray-600 hover:text-tiffany-600">Categories</Link>
          </nav>

          {/* Right Icons */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            
            <Link href="/account/wishlist" className="relative p-2 text-gray-600 hover:text-red-500 transition-all">
              <Heart size={22} />
              {wishlistIds.size > 0 && <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{wishlistIds.size}</span>}
            </Link>

            <Link href="/cart" className="relative p-2 text-gray-600 hover:text-tiffany-600 transition-all">
              <ShoppingCart size={22} />
              {cartItemsCount > 0 && <span className="absolute top-1 right-1 bg-tiffany-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{cartItemsCount}</span>}
            </Link>

            {/* User Dropdown */}
            <div className="relative" ref={userMenuRef}>
              {session ? (
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 p-1 border rounded-full hover:bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-xs">
                    {userInitial}
                  </div>
                </button>
              ) : (
                <Link href="/auth/signin" className="hidden sm:flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-tiffany-600 transition-all">
                  <User size={16} /> Sign In
                </Link>
              )}

              {isUserMenuOpen && session && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 bg-gray-50 border-b mb-1">
                    <p className="font-bold text-gray-900 text-sm truncate">{session.user?.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{session.user?.email}</p>
                  </div>
                  <Link href="/account" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-tiffany-50 hover:text-tiffany-700 transition-colors font-medium">
                    <User size={16} /> My Account
                  </Link>
                  <Link href="/account/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-tiffany-50 hover:text-tiffany-700 font-medium transition-colors">
                    <Package size={16} /> Order History
                  </Link>
                  <button onClick={() => signOut()} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full font-bold transition-colors">
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>

            <button className="lg:hidden p-2 text-gray-900" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-4">
          <SearchBar />
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-2xl animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col p-6 space-y-4">
            <Link href="/products" onClick={() => setIsMenuOpen(false)} className="text-lg font-black text-gray-900">Products</Link>
            <Link href="/categories" onClick={() => setIsMenuOpen(false)} className="text-lg font-black text-gray-900">Categories</Link>
            
            <div className="pt-4 border-t flex flex-col gap-4">
               {/* Mobile Currency Switcher */}
               <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                 <div className="flex items-center gap-3">
                   <span className="text-2xl">{getFlag(currency)}</span>
                   <span className="text-sm font-black text-gray-900 uppercase">Currency</span>
                 </div>
                 <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-white border-2 border-gray-200 px-3 py-1.5 rounded-xl font-black text-xs outline-none"
                 >
                   {Object.keys(rates).map(c => <option key={c} value={c}>{getFlag(c)} {c}</option>)}
                 </select>
               </div>

               {!session && (
                 <Link href="/auth/signin" className="w-full bg-gray-900 text-white text-center py-4 rounded-2xl font-bold">
                   Sign In
                 </Link>
               )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
            }

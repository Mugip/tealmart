// components/layout/Header.tsx - FIXED LOGO + Language & Currency Quick Switcher
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
  const { currency, setCurrency, rates } = useCurrency()
  const { data: session, status } = useSession()
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

  const userInitial =
    session?.user?.name?.[0]?.toUpperCase() ||
    session?.user?.email?.[0]?.toUpperCase() ||
    'U'

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">

          {/* Logo - FIXED */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <img
              src="/logo.svg"
              alt="TealMart Logo"
              className="h-8 sm:h-10 w-auto object-contain"
            />
            <span className="text-lg sm:text-2xl font-bold text-gray-900">TealMart</span>
          </Link>

          {/* Desktop Search */}
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
          </nav>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">

            {/* Language & Currency Quick Switcher */}
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
              {/* Language */}
              <select
                defaultValue="en"
                className="bg-transparent text-[10px] font-bold uppercase outline-none cursor-pointer px-2 border-r border-gray-200"
                onChange={(e) => window.location.pathname = `/${e.target.value}`}
              >
                <option value="en">EN</option>
                <option value="fr">FR</option>
                <option value="sw">SW</option>
              </select>

              {/* Currency */}
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-transparent text-[10px] font-bold outline-none cursor-pointer px-1"
              >
                {rates && Object.keys(rates).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Wishlist */}
            <Link href="/account/wishlist" className="relative p-2 text-gray-700 hover:text-tiffany-600 transition-colors">
              <Heart size={20} className="sm:w-[22px] sm:h-[22px]" />
              {wishlistIds.size > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {wishlistIds.size > 9 ? '9+' : wishlistIds.size}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link href="/cart" className="relative p-2 text-gray-700 hover:text-tiffany-600 transition-colors">
              <ShoppingCart size={20} className="sm:w-[22px] sm:h-[22px]" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-tiffany-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartItemsCount > 9 ? '9+' : cartItemsCount}
                </span>
              )}
            </Link>

            {/* User Menu & Mobile Menu */}
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse hidden md:block" />
            ) : session ? (
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {session.user?.image ? (
                    <img src={session.user.image} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-tiffany-500 flex items-center justify-center text-white font-bold text-sm">
                      {userInitial}
                    </div>
                  )}
                  <ChevronDown size={14} className={`text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-900 text-sm truncate">{session.user?.name || 'My Account'}</p>
                      <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                    </div>
                    <Link href="/account" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-tiffany-600 transition-colors">
                      <User size={16} /> My Account
                    </Link>
                    <Link href="/account/orders" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-tiffany-600 transition-colors">
                      <Package size={16} /> My Orders
                    </Link>
                    <Link href="/account/wishlist" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-tiffany-600 transition-colors">
                      <Heart size={16} /> Wishlist
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={() => { signOut({ callbackUrl: '/' }); setIsUserMenuOpen(false) }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors">
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/auth/signin" className="text-sm font-medium text-gray-700 hover:text-tiffany-600 transition-colors px-3 py-1.5">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="text-sm font-semibold bg-tiffany-500 hover:bg-tiffany-600 text-white px-4 py-1.5 rounded-lg transition-colors">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button className="lg:hidden p-2 text-gray-700" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-2">
          <SearchBar />
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t py-3">
            <nav className="flex flex-col space-y-1">
              {/* Currency Selector Mobile */}
              <div className="sm:hidden px-3 py-2">
                <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                  <Globe size={14} className="text-gray-500 mr-2" />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer flex-1"
                  >
                    <option value="USD">USD</option>
                    <option value="UGX">UGX</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              {/* Mobile Nav Links & Auth */}
              {[
                { href: '/products', label: 'Products' },
                { href: '/categories', label: 'Categories' },
                { href: '/about', label: 'About' },
                { href: '/contact', label: 'Contact' }
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm font-medium text-gray-700 hover:text-tiffany-600 hover:bg-gray-50 px-3 py-2 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}

              <div className="border-t pt-2 mt-1">
                {session ? (
                  <>
                    <div className="px-3 py-2">
                      <p className="text-sm font-semibold text-gray-900">{session.user?.name}</p>
                      <p className="text-xs text-gray-500">{session.user?.email}</p>
                    </div>
                    <Link href="/account" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-tiffany-600 hover:bg-gray-50 px-3 py-2 rounded-lg">
                      <User size={16} /> My Account
                    </Link>
                    <Link href="/account/orders" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-tiffany-600 hover:bg-gray-50 px-3 py-2 rounded-lg">
                      <Package size={16} /> My Orders
                    </Link>
                    <button onClick={() => signOut({ callbackUrl: '/' })} className="flex items-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg w-full">
                      <LogOut size={16} /> Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 px-3">
                    <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)} className="flex-1 text-center text-sm font-medium border border-gray-300 py-2 rounded-lg hover:bg-gray-50">
                      Sign In
                    </Link>
                    <Link href="/auth/signup" onClick={() => setIsMenuOpen(false)} className="flex-1 text-center text-sm font-semibold bg-tiffany-500 text-white py-2 rounded-lg hover:bg-tiffany-600">
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
                      }

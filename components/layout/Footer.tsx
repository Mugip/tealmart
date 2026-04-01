// components/layout/Footer.tsx
import Link from 'next/link'
import { Facebook, Twitter, Instagram, ShieldCheck } from 'lucide-react'
import { prisma } from '@/lib/db'
import { fetchWithCache } from '@/lib/redis'
import { formatCategoryName } from '@/lib/productClassifier'

// ✅ Custom TikTok SVG (since lucide doesn't have it)
function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-1.883V14.23a5.652 5.652 0 1 1-4.95-5.607v2.923a2.729 2.729 0 1 0 1.88 2.684V2h2.89a4.79 4.79 0 0 0 3.95 2.07v2.616z"/>
    </svg>
  )
}

async function getTopCategories() {
  return fetchWithCache(
    'footer:categories',
    async () => {
      const cats = await prisma.product.groupBy({
        by: ['category'],
        where: { isActive: true },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
        take: 4,
      })
      return cats.map(c => c.category)
    },
    86400
  )
}

export default async function Footer() {
  const topCategories = await getTopCategories()

  return (
    <footer className="bg-gray-900 text-gray-300 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          
          {/* BRAND */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src="/logo.svg" 
                alt="TealMart Logo" 
                className="h-10 w-auto object-contain" 
              />
              <span className="text-2xl font-bold text-white">TealMart</span>
            </div>

            <p className="text-sm leading-relaxed text-gray-400 mb-6">
              Your trusted marketplace for trending products. Quality, affordability, and fast delivery guaranteed.
            </p>

            {/* SOCIAL ICONS WITH REAL COLORS */}
            <div className="flex gap-4">
              <a href="#" className="text-[#1877F2] hover:opacity-80">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-[#E4405F] hover:opacity-80">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-[#1DA1F2] hover:opacity-80">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-black bg-white rounded-sm p-[2px] hover:opacity-80">
                <TikTokIcon size={16} />
              </a>
            </div>
          </div>

          {/* CATEGORIES */}
          <div>
            <h3 className="text-white font-bold mb-4 text-base tracking-wide uppercase">
              Shop Categories
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              {topCategories.map(category => (
                <li key={category}>
                  <Link
                    href={`/products?category=${category}`}
                    className="hover:text-tiffany-400 transition-colors"
                  >
                    {formatCategoryName(category)}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/products"
                  className="text-tiffany-500 hover:text-tiffany-400 font-semibold transition-colors"
                >
                  View All Products →
                </Link>
              </li>
            </ul>
          </div>

          {/* SUPPORT */}
          <div>
            <h3 className="text-white font-bold mb-4 text-base tracking-wide uppercase">
              Customer Support
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link href="/contact">Contact Us</Link></li>
              <li><Link href="/shipping">Shipping & Delivery</Link></li>
              <li><Link href="/returns">Returns & Refunds</Link></li>
              <li><Link href="/faq">Help Center / FAQ</Link></li>
              <li><Link href="/account/orders">Track My Order</Link></li>
            </ul>
          </div>

          {/* LEGAL */}
          <div>
            <h3 className="text-white font-bold mb-4 text-base tracking-wide uppercase">
              Legal
            </h3>
            <ul className="space-y-3 text-sm text-gray-400 mb-6">
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
              <li><Link href="/about">About Us</Link></li>
            </ul>

            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck size={18} className="text-green-500" />
              <span>SSL Encrypted Checkout</span>
            </div>
          </div>
        </div>

        {/* FOOTER BOTTOM */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <p className="text-sm text-gray-500 text-center md:text-left">
            &copy; {new Date().getFullYear()} TealMart. All rights reserved.
          </p>

          {/* PAYMENT METHODS (REAL COLORS) */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 sm:gap-3">
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mr-2">
              Secured By
            </span>

            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded">
                STRIPE
              </div>
              <div className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                VISA
              </div>
              <div className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded">
                MASTERCARD
              </div>
              <div className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded">
                AMEX
              </div>
              <div className="px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded">
                Mobile Money
              </div>
              <div className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded">
                M-Pesa
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
                    }

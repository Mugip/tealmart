// components/layout/Footer.tsx
import Link from 'next/link'
import { Facebook, Twitter, Instagram, CreditCard, ShieldCheck } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand & Social */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-tiffany-500 to-tiffany-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-white">TealMart</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400 mb-6">
              Your trusted marketplace for trending products. Quality, affordability, and fast delivery guaranteed.
            </p>
            <div className="flex gap-4">
              <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-tiffany-400 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-tiffany-400 transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-tiffany-400 transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-white font-bold mb-4 text-base tracking-wide uppercase">Shop Categories</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link href="/products?category=electronics" className="hover:text-tiffany-400 transition-colors">Electronics & Tech</Link></li>
              <li><Link href="/products?category=fashion" className="hover:text-tiffany-400 transition-colors">Fashion & Apparel</Link></li>
              <li><Link href="/products?category=home-garden" className="hover:text-tiffany-400 transition-colors">Home & Garden</Link></li>
              <li><Link href="/products?category=beauty" className="hover:text-tiffany-400 transition-colors">Health & Beauty</Link></li>
              <li><Link href="/products" className="text-tiffany-500 hover:text-tiffany-400 font-semibold transition-colors">View All Products →</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-bold mb-4 text-base tracking-wide uppercase">Customer Support</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link href="/contact" className="hover:text-tiffany-400 transition-colors">Contact Us</Link></li>
              <li><Link href="/shipping" className="hover:text-tiffany-400 transition-colors">Shipping & Delivery</Link></li>
              <li><Link href="/returns" className="hover:text-tiffany-400 transition-colors">Returns & Refunds</Link></li>
              <li><Link href="/faq" className="hover:text-tiffany-400 transition-colors">Help Center / FAQ</Link></li>
              <li><Link href="/account/orders" className="hover:text-tiffany-400 transition-colors">Track My Order</Link></li>
            </ul>
          </div>

          {/* Legal & Trust */}
          <div>
            <h3 className="text-white font-bold mb-4 text-base tracking-wide uppercase">Legal</h3>
            <ul className="space-y-3 text-sm text-gray-400 mb-6">
              <li><Link href="/privacy" className="hover:text-tiffany-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-tiffany-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/about" className="hover:text-tiffany-400 transition-colors">About Us</Link></li>
            </ul>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <ShieldCheck size={18} className="text-green-500" />
              <span>SSL Encrypted Checkout</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Payment Methods */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} TealMart. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider mr-2">Secured By</span>
            {/* Simple text representation of badges to avoid missing image assets */}
            <div className="px-2 py-1 bg-gray-800 rounded text-xs font-bold border border-gray-700">STRIPE</div>
            <div className="px-2 py-1 bg-gray-800 rounded text-xs font-bold border border-gray-700">VISA</div>
            <div className="px-2 py-1 bg-gray-800 rounded text-xs font-bold border border-gray-700">MASTERCARD</div>
            <div className="px-2 py-1 bg-gray-800 rounded text-xs font-bold border border-gray-700">AMEX</div>
          </div>
        </div>
      </div>
    </footer>
  )
        }

// app/cart/page.tsx
'use client'

import { useState } from 'react'
import { useCart } from '@/lib/contexts/CartContext'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getSecureImageUrl } from '@/lib/imageUrl' // ✅ Imported

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCart()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loadingCheckout, setLoadingCheckout] = useState(false)

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some products to get started!</p>
          <Link href="/products" className="btn-primary inline-block">
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  const handleCheckout = async () => {
    setLoadingCheckout(true)
    if (session?.user) {
      router.push('/checkout')
      return
    }

    try {
      const res = await fetch('/api/settings/public', { cache: 'no-store' })
      const data = await res.json()
      if (data.allowGuestCheckout) {
        router.push('/checkout')
      } else {
        router.push('/auth/signin?callbackUrl=/checkout')
      }
    } catch {
      router.push('/auth/signin?callbackUrl=/checkout')
    }
  }

  const shipping = total >= 50 ? 0 : 9.99
  const tax = 0 
  const grandTotal = total + shipping + tax

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-5 sm:p-6 border-b border-gray-100 last:border-b-0">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    {/* ✅ Corrected Image Source */}
                    <Image src={getSecureImageUrl(item.image)} alt={item.title} fill className="object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.id.split('-')[0]}`} className="font-bold text-gray-900 hover:text-tiffany-600 line-clamp-2 leading-snug">
                      {item.title}
                    </Link>
                    <p className="text-gray-500 mt-1 font-medium">${item.price.toFixed(2)}</p>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex items-center border-2 border-gray-200 rounded-lg bg-gray-50">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-1 hover:bg-white transition-colors font-bold text-gray-600">-</button>
                        <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-1 hover:bg-white transition-colors font-bold text-gray-600">+</button>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col justify-between">
                    <p className="font-black text-gray-900 sm:text-lg">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors ml-auto">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ... Rest of Order Summary is exactly the same */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-bold' : 'font-medium text-gray-900'}>
                    {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between font-black text-gray-900 text-xl">
                    <span>Total</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {shipping > 0 && (
                <div className="bg-tiffany-50 border border-tiffany-200 rounded-xl p-3 mb-6 text-center">
                  <p className="text-xs text-tiffany-800 font-bold">
                    Add ${(50 - total).toFixed(2)} more for FREE shipping!
                  </p>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={loadingCheckout || status === 'loading'}
                className="w-full py-4 bg-gradient-to-r from-tiffany-500 to-tiffany-600 text-white rounded-xl font-bold text-lg hover:from-tiffany-600 hover:to-tiffany-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {loadingCheckout ? <Loader2 size={20} className="animate-spin" /> : 'Proceed to Checkout'}
              </button>

              <Link href="/products" className="block text-center text-gray-500 hover:text-tiffany-600 font-bold mt-4 text-sm transition-colors">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

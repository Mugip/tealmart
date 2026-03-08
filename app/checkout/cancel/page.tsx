// app/checkout/cancel/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react'

export default function CheckoutCancelPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          {/* Cancel Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-full p-6">
              <XCircle size={64} className="text-white" />
            </div>
          </div>

          {/* Cancel Message */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Checkout Cancelled
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your order was not completed. Your cart items are still saved.
          </p>

          {/* Info Box */}
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8">
            <p className="text-sm text-gray-700">
              Don't worry! Your items are still in your cart. You can continue shopping or try checking out again.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/checkout')}
              className="px-8 py-4 bg-gradient-to-r from-tiffany-500 to-tiffany-600 hover:from-tiffany-600 hover:to-tiffany-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <ShoppingCart size={20} />
              Try Again
            </button>
            <button
              onClick={() => router.push('/products')}
              className="px-8 py-4 bg-white border-2 border-gray-300 hover:border-tiffany-500 text-gray-700 hover:text-tiffany-600 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={20} />
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

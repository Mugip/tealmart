'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Package, Truck, Mail } from 'lucide-react'
import { useCart } from '@/lib/contexts/CartContext'

export default function SuccessPageClient({
  sessionId,
}: {
  sessionId: string | null
}) {
  const router = useRouter()

  // hooks must be called normally
  const { clearCart } = useCart()

  useEffect(() => {
    try {
      clearCart()
    } catch (err) {
      console.error('Failed to clear cart:', err)
    }
  }, [clearCart])

  return (
    <div className="min-h-screen bg-gradient-to-br from-tiffany-50 to-white flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center">

          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-full p-6">
              <CheckCircle size={64} className="text-white" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Order Confirmed 🎉
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Thank you for your purchase!
          </p>

          {sessionId && (
            <div className="bg-tiffany-50 rounded-xl p-4 mb-8">
              <p className="text-sm text-gray-500 mb-1">Stripe Session ID</p>
              <p className="text-xs font-mono break-all text-gray-700">
                {sessionId}
              </p>
            </div>
          )}

          <div className="space-y-5 text-left mb-10">

            <div className="flex gap-4 items-start">
              <Mail className="text-tiffany-600 mt-1" size={20} />
              <div>
                <p className="font-semibold text-gray-800">
                  Email Confirmation
                </p>
                <p className="text-sm text-gray-600">
                  You will receive an order confirmation email shortly.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <Package className="text-tiffany-600 mt-1" size={20} />
              <div>
                <p className="font-semibold text-gray-800">
                  Order Processing
                </p>
                <p className="text-sm text-gray-600">
                  Your order will be prepared within 1–2 business days.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <Truck className="text-tiffany-600 mt-1" size={20} />
              <div>
                <p className="font-semibold text-gray-800">
                  Shipping Updates
                </p>
                <p className="text-sm text-gray-600">
                  Tracking details will be emailed once shipped.
                </p>
              </div>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">

            <button
              onClick={() => router.push('/products')}
              className="px-6 py-3 bg-tiffany-600 hover:bg-tiffany-700 text-white rounded-lg font-medium transition"
            >
              Continue Shopping
            </button>

            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition"
            >
              Back to Home
            </button>

          </div>

        </div>
      </div>
    </div>
  )
              }

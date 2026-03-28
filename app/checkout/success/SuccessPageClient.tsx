// app/checkout/success/SuccessPageClient.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Package, Truck, Mail } from 'lucide-react'
import { useCart } from '@/lib/contexts/CartContext'

export default function SuccessPageClient({
  sessionId,
  orderNumber
}: {
  sessionId: string | null
  orderNumber: string | null
}) {
  const router = useRouter()
  const { clearCart } = useCart()
  const hasCleared = useRef(false)

  useEffect(() => {
    // Only clear cart once on mount
    if (!hasCleared.current) {
      hasCleared.current = true
      clearCart()
    }
  }, [clearCart])

  return (
    <div className="min-h-screen bg-gradient-to-br from-tiffany-50 to-white flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-full p-6 animate-bounce">
              <CheckCircle size={64} className="text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Order Confirmed! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Thank you for your purchase! Your order has been successfully placed.
          </p>

          {/* Show either Stripe Session ID or Flutterwave Order Number */}
          {(orderNumber || sessionId) && (
            <div className="bg-gradient-to-br from-tiffany-50 to-tiffany-100 rounded-2xl p-6 mb-8 border border-tiffany-200">
              <p className="text-sm text-gray-600 mb-2">Order Reference</p>
              <p className="text-sm font-mono text-gray-800 font-bold break-all bg-white px-3 py-2 rounded-lg inline-block">
                {orderNumber || sessionId}
              </p>
            </div>
          )}

          <div className="text-left mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              What happens next?
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 bg-gray-50 rounded-xl p-4">
                <div className="bg-tiffany-100 rounded-lg p-3 flex-shrink-0">
                  <Mail className="text-tiffany-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">1. Email Confirmation</h3>
                  <p className="text-sm text-gray-600">You'll receive an order confirmation email shortly with your order details.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-gray-50 rounded-xl p-4">
                <div className="bg-tiffany-100 rounded-lg p-3 flex-shrink-0">
                  <Package className="text-tiffany-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">2. Order Processing</h3>
                  <p className="text-sm text-gray-600">We're preparing your items for shipment. This usually takes 1-2 business days.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-gray-50 rounded-xl p-4">
                <div className="bg-tiffany-100 rounded-lg p-3 flex-shrink-0">
                  <Truck className="text-tiffany-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">3. Shipping Updates</h3>
                  <p className="text-sm text-gray-600">Once shipped, you'll receive tracking information via email.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => router.push('/products')} className="px-8 py-4 bg-gradient-to-r from-tiffany-500 to-tiffany-600 hover:from-tiffany-600 hover:to-tiffany-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl">
              Continue Shopping
            </button>
            <button onClick={() => router.push('/account/orders')} className="px-8 py-4 bg-white border-2 border-gray-300 hover:border-tiffany-500 text-gray-700 hover:text-tiffany-600 rounded-xl font-bold transition-all">
              View My Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

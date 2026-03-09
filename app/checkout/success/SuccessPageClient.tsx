// app/checkout/success/SuccessPageClient.tsx

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
  const { clearCart } = useCart()

  useEffect(() => {
    try {
      if (clearCart) clearCart()
    } catch (err) {
      console.error("Cart clear error:", err)
    }
  }, [clearCart])

  return (
    <div className="min-h-screen bg-gradient-to-br from-tiffany-50 to-white flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">

          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-full p-6">
              <CheckCircle size={64} className="text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Order Confirmed 🎉
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            Thank you for your purchase!
          </p>

          {sessionId && (
            <div className="bg-tiffany-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-500">Stripe Session</p>
              <p className="text-xs font-mono break-all">{sessionId}</p>
            </div>
          )}

          <div className="space-y-4 text-left mb-8">

            <div className="flex gap-4">
              <Mail className="text-tiffany-600" />
              <div>
                <p className="font-semibold">Email Confirmation</p>
                <p className="text-sm text-gray-600">
                  You'll receive an email shortly.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Package className="text-tiffany-600" />
              <div>
                <p className="font-semibold">Processing</p>
                <p className="text-sm text-gray-600">
                  Orders ship in 1–2 business days.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Truck className="text-tiffany-600" />
              <div>
                <p className="font-semibold">Shipping Updates</p>
                <p className="text-sm text-gray-600">
                  Tracking will be emailed to you.
                </p>
              </div>
            </div>

          </div>

          <div className="flex gap-4 justify-center">

            <button
              onClick={() => router.push('/products')}
              className="px-6 py-3 bg-tiffany-600 text-white rounded-lg"
            >
              Continue Shopping
            </button>

            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 border rounded-lg"
            >
              Home
            </button>

          </div>

        </div>
      </div>
    </div>
  )
      }

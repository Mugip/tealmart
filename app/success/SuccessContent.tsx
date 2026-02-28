'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, Package } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/lib/contexts/CartContext'

export default function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { clearCart } = useCart()

  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  useEffect(() => {
    const order = searchParams.get('order')

    if (!order) {
      router.replace('/')
      return
    }

    setOrderNumber(order)
    clearCart()
  }, [searchParams, clearCart, router])

  if (!orderNumber) return null

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>

          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your order has been confirmed.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Order Number</p>
            <p className="text-xl font-bold text-gray-900">
              {orderNumber}
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/products"
              className="btn-primary w-full block text-center"
            >
              Continue Shopping
            </Link>

            <Link
              href="/"
              className="block text-center text-tiffany-600 font-semibold"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

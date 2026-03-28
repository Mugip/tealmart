// app/track-order/page.tsx
'use client'

import { useState } from 'react'
import { Package, Search, Truck, AlertCircle, CheckCircle } from 'lucide-react'

export default function TrackOrderPage() {
  const[email, setEmail] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const[loading, setLoading] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)
  const [error, setError] = useState('')

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setOrderData(null)

    try {
      const res = await fetch(`/api/track-order?email=${encodeURIComponent(email)}&orderNumber=${encodeURIComponent(orderNumber)}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Order not found')
      setOrderData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Package className="w-16 h-16 text-tiffany-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Track Your Order</h1>
            <p className="text-gray-500 mt-2">Enter your details below to see your order status.</p>
          </div>

          <form onSubmit={handleTrack} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-tiffany-500" placeholder="Email used at checkout" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
              <input type="text" required value={orderNumber} onChange={e => setOrderNumber(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-tiffany-500" placeholder="e.g. ORD-123456789" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-tiffany-500 hover:bg-tiffany-600 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2">
              {loading ? 'Searching...' : <><Search size={20}/> Track Order</>}
            </button>
          </form>

          {error && (
            <div className="mt-6 bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} /> {error}
            </div>
          )}

          {orderData && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Status: {orderData.status}</h3>
              {orderData.trackingNumber ? (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col items-center text-center">
                  <Truck className="w-8 h-8 text-blue-500 mb-2" />
                  <p className="text-blue-800 font-bold text-lg">{orderData.trackingNumber}</p>
                  <p className="text-blue-600 text-sm mb-4">Carrier: {orderData.trackingCarrier || 'Standard Shipping'}</p>
                  <a href={`https://track.yunexpress.com/tracking?number=${orderData.trackingNumber}`} target="_blank" rel="noreferrer" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold">Track on Carrier Website</a>
                </div>
              ) : (
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl flex items-center gap-3">
                  <CheckCircle size={24} /> We are currently packing your order. Tracking details will appear here soon.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

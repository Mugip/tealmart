// components/admin/OrderStatusUpdater.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'

interface Props {
  orderId: string
  currentStatus: string
}

export default function OrderStatusUpdater({ orderId, currentStatus }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [message, setMessage] = useState('')

  const statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']

  const handleUpdate = async () => {
    if (status === currentStatus && !trackingNumber) {
      setMessage('No changes to save')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          trackingNumber: trackingNumber || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Failed to update order')
        setLoading(false)
        return
      }

      setMessage('✓ Order updated successfully!')
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (error) {
      setMessage('Failed to update order')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Status Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"
          disabled={loading}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Tracking Number (only for SHIPPED status) */}
      {status === 'SHIPPED' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tracking Number (Optional)
          </label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="1Z999AA10123456784"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"
            disabled={loading}
          />
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.includes('✓')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message}
        </div>
      )}

      {/* Update Button */}
      <button
        onClick={handleUpdate}
        disabled={loading || (status === currentStatus && !trackingNumber)}
        className="w-full flex items-center justify-center gap-2 bg-tiffany-500 text-white font-bold py-3 rounded-lg hover:bg-tiffany-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-4 h-4" />
        {loading ? 'Updating...' : 'Update & Notify Customer'}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Customer will receive an email notification about this status change
      </p>
    </div>
  )
}

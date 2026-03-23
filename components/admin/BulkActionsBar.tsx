// components/admin/BulkActionsBar.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BulkActionsBar({ products }: { products: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Bulk Actions:</span>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium disabled:opacity-50"
          disabled={loading}
        >
          Activate Selected
        </button>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50"
          disabled={loading}
        >
          Deactivate Selected
        </button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium disabled:opacity-50"
          disabled={loading}
        >
          Update Prices
        </button>
      </div>
      {message && (
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      )}
    </div>
  )
}

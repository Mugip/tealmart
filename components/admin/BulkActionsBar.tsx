// components/admin/BulkActionsBar.tsx - FULLY WORKING
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckSquare } from 'lucide-react'

interface Props {
  selectedIds: string[]
  onClear: () => void
}

export default function BulkActionsBar({ selectedIds, onClear }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const count = selectedIds.length

  const apply = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (count === 0) {
      setMessage('No products selected.')
      return
    }

    if (action === 'delete') {
      if (!confirm(`Delete ${count} product${count !== 1 ? 's' : ''}? This cannot be undone.`)) return
    }

    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Action failed')
        setLoading(false)
        return
      }

      setMessage(`✓ ${data.message}`)
      onClear()
      router.refresh()
    } catch {
      setMessage('Something went wrong')
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(''), 4000)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <CheckSquare size={16} className="text-tiffany-500" />
          {count > 0 ? (
            <span className="text-tiffany-700">{count} selected</span>
          ) : (
            <span className="text-gray-500">Select products below to bulk-edit</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 ml-auto">
          <button
            onClick={() => apply('activate')}
            disabled={loading || count === 0}
            className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : 'Activate'}
          </button>
          <button
            onClick={() => apply('deactivate')}
            disabled={loading || count === 0}
            className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Deactivate
          </button>
          <button
            onClick={() => apply('delete')}
            disabled={loading || count === 0}
            className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Delete
          </button>
          {count > 0 && (
            <button
              onClick={onClear}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {message && (
        <p className={`mt-2 text-sm ${message.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  )
          }

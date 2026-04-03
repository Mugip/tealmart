// app/admin/cj-orders/SyncButton.tsx
'use client'

import { useState } from 'react'
import { RefreshCw, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function SyncButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSync = async () => {
    setLoading(true)
    const toastId = toast.loading('Syncing tracking data from CJ...')

    try {
      const res = await fetch('/api/admin/cj/sync-tracking', { method: 'POST' })
      const data = await res.json()

      if (res.ok) {
        toast.success(data.message || 'Sync complete!', { id: toastId })
        router.refresh() // Refresh the page to show new tracking numbers
      } else {
        toast.error(data.error || 'Sync failed', { id: toastId })
      }
    } catch {
      toast.error('Network error during sync', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed text-sm"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
      {loading ? 'Syncing...' : 'Force Sync Tracking'}
    </button>
  )
}

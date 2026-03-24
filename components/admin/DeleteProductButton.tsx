// components/admin/DeleteProductButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

export default function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this product? This cannot be undone.')) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to delete product')
        setDeleting(false)
        return
      }
      router.refresh()
    } catch {
      alert('Failed to delete product')
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
      title="Delete product"
    >
      {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
    </button>
  )
}

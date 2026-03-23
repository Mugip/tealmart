// components/admin/DeleteProductButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export default function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    setDeleting(true)

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        alert('Failed to delete product')
        setDeleting(false)
        return
      }

      router.refresh()
    } catch (error) {
      alert('Failed to delete product')
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-red-600 hover:text-red-700 disabled:opacity-50"
      title="Delete product"
    >
      <Trash2 size={18} />
    </button>
  )
}

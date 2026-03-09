'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/contexts/CartContext'

export default function SuccessPageClient({
  sessionId,
}: {
  sessionId: string | null
}) {
  const router = useRouter()
  const { clearCart } = useCart()

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <div style={{ padding: 40 }}>
      <h1>Order Confirmed</h1>
      <p>{sessionId}</p>

      <button onClick={() => router.push('/')}>
        Home
      </button>
    </div>
  )
}

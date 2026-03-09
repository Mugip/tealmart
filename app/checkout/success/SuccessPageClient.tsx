'use client'

import { useRouter } from 'next/navigation'

export default function SuccessPageClient({
  sessionId,
}: {
  sessionId: string | null
}) {
  const router = useRouter()

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

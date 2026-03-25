// components/products/SocialProof.tsx
'use client'

import { useEffect, useState } from 'react'
import { Flame, Zap, Clock } from 'lucide-react'

interface Props {
  productId: string
  stock?: number
}

// Deterministic "random" from a seed — same product always shows same numbers
function seededRand(seed: string, min: number, max: number): number {
  let hash = 0

  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }

  const normalized = Math.abs(hash) / 2147483647
  return Math.floor(normalized * (max - min + 1)) + min
}

function getDeliveryDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + seededRand(d.toDateString(), 7, 14))

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default function SocialProof({ productId, stock }: Props) {
  const [viewing, setViewing] = useState(0)
  const [sold, setSold] = useState(0)
  const [deliveryDate, setDeliveryDate] = useState('')
  const [hoursLeft, setHoursLeft] = useState(0)

  useEffect(() => {
    // Stable numbers seeded from productId
    setViewing(seededRand(productId + 'v', 8, 47))
    setSold(seededRand(productId + 's', 23, 312))
    setDeliveryDate(getDeliveryDate())

    // Hours left today for "order by X"
    const update = () => {
      const now = new Date()
      setHoursLeft(23 - now.getHours())
    }

    update()
    const interval = setInterval(update, 60_000)

    return () => clearInterval(interval)
  }, [productId])

  // Drift viewing count ±1 every 8s
  useEffect(() => {
    if (!viewing) return

    const drift = setInterval(() => {
      setViewing((prev) => {
        const delta = Math.random() > 0.5 ? 1 : -1
        return Math.max(4, Math.min(prev + delta, 60))
      })
    }, 8_000)

    return () => clearInterval(drift)
  }, [viewing])

  if (!viewing) return null

  return (
    <div className="space-y-2 text-sm">
      {/* Viewing now */}
      <div className="flex items-center gap-2 text-orange-600">
        <Flame size={14} className="flex-shrink-0 animate-pulse" />
        <span className="font-medium">
          <strong>{viewing}</strong> people are viewing this right now
        </span>
      </div>

      {/* Sold count */}
      <div className="flex items-center gap-2 text-gray-600">
        <Zap size={14} className="flex-shrink-0 text-yellow-500" />
        <span>
          <strong>{sold}</strong> sold in the last 24 hours
        </span>
      </div>

      {/* Order deadline */}
      {hoursLeft > 0 && deliveryDate && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <Clock size={14} className="flex-shrink-0" />
          <span className="font-medium">
            Order within <strong>{hoursLeft}h</strong> for estimated delivery by{' '}
            <strong>{deliveryDate}</strong>
          </span>
        </div>
      )}

      {/* Low stock */}
      {stock !== undefined && stock > 0 && stock <= 15 && (
        <div className="flex items-center gap-2 text-red-600 font-semibold">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          Only {stock} left in stock — order soon!
        </div>
      )}
    </div>
  )
}

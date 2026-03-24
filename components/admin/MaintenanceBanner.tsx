// components/admin/MaintenanceBanner.tsx
// Reads the tealmart-maintenance cookie directly — no fetch needed.
// Shows a persistent red banner on every admin page when maintenance is ON.
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, X } from 'lucide-react'

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : undefined
}

export default function MaintenanceBanner() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Read cookie directly — reliable on all runtimes, no network call needed
    setShow(getCookie('tealmart-maintenance') === '1')
  }, [])

  if (!show || dismissed) return null

  return (
    <div className="bg-red-600 text-white px-4 py-3 flex items-start gap-3 text-sm font-medium z-50">
      <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
      <p className="flex-1 leading-snug">
        <strong>Maintenance mode is ON</strong> — your store is hidden from all visitors.{' '}
        <Link href="/admin/settings#store" className="underline hover:no-underline font-semibold">
          Go to Settings to disable →
        </Link>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 hover:opacity-75 transition-opacity p-0.5"
        aria-label="Dismiss banner"
      >
        <X size={16} />
      </button>
    </div>
  )
}

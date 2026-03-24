// components/admin/MaintenanceBanner.tsx
// Shows a sticky top banner across all admin pages when maintenance mode is on.
// Fetches from the public settings endpoint so no auth needed.
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, X } from 'lucide-react'

export default function MaintenanceBanner() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/settings/public')
      .then(r => r.json())
      .then(d => { if (d.maintenanceMode) setShow(true) })
      .catch(() => {})
  }, [])

  if (!show || dismissed) return null

  return (
    <div className="bg-red-600 text-white px-4 py-2.5 flex items-center gap-3 text-sm font-medium shadow-md z-50">
      <AlertTriangle size={16} className="flex-shrink-0" />
      <p className="flex-1">
        <strong>Maintenance mode is ON</strong> — your store is hidden from all visitors.{' '}
        <Link href="/admin/settings" className="underline hover:no-underline">
          Disable in Settings →
        </Link>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 hover:opacity-75 transition-opacity"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  )
}

// components/admin/MaintenanceBanner.tsx
// Reads the tealmart-maintenance cookie directly — no fetch, works everywhere.
// Rendered as a FIXED bar at the very top of the viewport (z-60) so it sits
// above the AdminNav mobile header (z-50). It sets a CSS custom property
// --banner-h on <html> so AdminNav can offset its own top position.
'use client'

import { useState, useEffect, useRef } from 'react'
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
  const bannerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setShow(getCookie('tealmart-maintenance') === '1')
  }, [])

  // Keep the CSS variable in sync with actual banner height
  useEffect(() => {
    const el = bannerRef.current
    if (!el || !show || dismissed) {
      document.documentElement.style.setProperty('--banner-h', '0px')
      return
    }
    const update = () => {
      document.documentElement.style.setProperty('--banner-h', el.offsetHeight + 'px')
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [show, dismissed])

  if (!show || dismissed) return null

  return (
    // z-[60] sits above AdminNav's z-50 mobile header
    <div
      ref={bannerRef}
      className="fixed top-0 left-0 right-0 z-[60] bg-red-600 text-white px-4 py-2.5 flex items-start gap-3 text-sm font-medium shadow-lg"
    >
      <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
      <p className="flex-1 leading-snug">
        <strong>Maintenance mode is ON</strong> — your store is hidden from all visitors.{' '}
        <Link
          href="/admin/settings"
          className="underline hover:no-underline font-semibold"
        >
          Disable in Settings →
        </Link>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 hover:opacity-75 transition-opacity"
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  )
}

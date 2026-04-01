// components/layout/MaintenanceWatcher.tsx
'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function MaintenanceWatcher() {
  const pathname = usePathname()

  useEffect(() => {
    // Admins viewing the /admin panel don't get redirected
    if (pathname?.startsWith('/admin')) return

    const checkMaintenance = async () => {
      try {
        // Fetch the LIVE status (adding timestamp bypasses browser cache)
        const res = await fetch(`/api/settings/public?t=${Date.now()}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          
          // If maintenance is ON and they are NOT on the maintenance page -> Force them there
          if (data.maintenanceMode && pathname !== '/maintenance') {
            window.location.href = '/maintenance'
          }
          // If maintenance is OFF but they are stuck ON the maintenance page -> Recover them
          else if (!data.maintenanceMode && pathname === '/maintenance') {
            window.location.href = '/'
          }
        }
      } catch (err) {
        // Silent fail
      }
    }

    // Check every 10 seconds
    const interval = setInterval(checkMaintenance, 10000)
    
    // Check immediately on mount too
    checkMaintenance()

    return () => clearInterval(interval)
  }, [pathname])

  return null
}

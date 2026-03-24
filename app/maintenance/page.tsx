// app/maintenance/page.tsx
// Shown to all visitors when maintenanceMode is enabled in admin settings.
// No layout wrapper — this renders standalone (middleware redirects here before
// ConditionalShell runs).
import Link from 'next/link'
import { Wrench, Clock, Mail } from 'lucide-react'

export const metadata = {
  title: 'Under Maintenance — TealMart',
  robots: 'noindex',
}

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-tiffany-50 via-white to-tiffany-100 flex flex-col items-center justify-center px-4 py-16">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12">
        <div className="w-12 h-12 bg-gradient-to-br from-tiffany-500 to-tiffany-600 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-2xl">T</span>
        </div>
        <span className="text-3xl font-bold text-gray-900">TealMart</span>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-tiffany-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Wrench className="w-10 h-10 text-tiffany-500" strokeWidth={1.5} />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          We'll be right back
        </h1>
        <p className="text-gray-500 text-base leading-relaxed mb-8">
          TealMart is currently undergoing scheduled maintenance. We're
          working hard to improve your shopping experience and will be back
          online shortly.
        </p>

        {/* Info pills */}
        <div className="flex flex-col gap-3 mb-8">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <Clock className="w-5 h-5 text-tiffany-500 flex-shrink-0" />
            <span className="text-sm text-gray-600">Expected downtime: a few hours</span>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <Mail className="w-5 h-5 text-tiffany-500 flex-shrink-0" />
            <span className="text-sm text-gray-600">
              Questions?{' '}
              <a
                href="mailto:support@tealmart.com"
                className="text-tiffany-600 hover:underline font-medium"
              >
                support@tealmart.com
              </a>
            </span>
          </div>
        </div>

        {/* Admin shortcut — only useful if you're the admin */}
        <Link
          href="/admin/login"
          className="inline-block text-xs text-gray-400 hover:text-tiffany-500 transition-colors"
        >
          Admin login →
        </Link>
      </div>

      <p className="mt-10 text-xs text-gray-400">
        © {new Date().getFullYear()} TealMart. All rights reserved.
      </p>
    </div>
  )
}

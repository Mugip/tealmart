// app/checkout/success/page.tsx
import { Suspense } from 'react'
import SuccessPageClient from './SuccessPageClient'

export const dynamic = 'force-dynamic'

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-tiffany-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-tiffany-600"></div>
      </div>
    }>
      <SuccessPageClient />
    </Suspense>
  )
}

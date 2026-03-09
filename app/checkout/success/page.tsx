// app/checkout/success/page.tsx
import SuccessPageClient from './SuccessPageClient'

interface SuccessPageProps {
  searchParams?: { session_id?: string }
}

export default function SuccessPage({ searchParams }: SuccessPageProps) {
  const sessionId = searchParams?.session_id || null
  return <SuccessPageClient sessionId={sessionId} />
}

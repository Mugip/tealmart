import SuccessPageClient from './SuccessPageClient'

export default function SuccessPagePage({ searchParams }: { searchParams: { session_id?: string } }) {
  return <SuccessPageClient sessionId={searchParams.session_id || null} />
}

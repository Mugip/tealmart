import SuccessPageClient from "./SuccessPageClient"

export const dynamic = "force-dynamic"

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {

  const sessionId = searchParams?.session_id || null

  console.log("Stripe Success Page Loaded")
  console.log("Session ID:", sessionId)

  return <SuccessPageClient sessionId={sessionId} />
}

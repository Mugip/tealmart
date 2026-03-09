import SuccessPageClient from "./SuccessPageClient"

export const dynamic = "force-dynamic"

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {

  console.log("Stripe Success Page Loaded")
  console.log("Session ID:", searchParams?.session_id)

  return <SuccessPageClient />
}

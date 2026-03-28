// app/checkout/success/page.tsx
import SuccessPageClient from "./SuccessPageClient";

export default function Page({
  searchParams,
}: {
  // Catch Stripe (session_id) and Flutterwave (order, status, tx_ref) params
  searchParams: { session_id?: string; order?: string; status?: string; tx_ref?: string };
}) {
  const sessionId = typeof searchParams?.session_id === "string" ? searchParams.session_id : null;
  const orderNumber = typeof searchParams?.order === "string" ? searchParams.order : null;

  return <SuccessPageClient sessionId={sessionId} orderNumber={orderNumber} />;
}

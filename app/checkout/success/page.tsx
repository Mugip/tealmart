import SuccessPageClient from "./SuccessPageClient";

export default function Page({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId =
    typeof searchParams?.session_id === "string"
      ? searchParams.session_id
      : null;

  return <SuccessPageClient sessionId={sessionId} />;
}

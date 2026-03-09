"use client";

import { useEffect } from "react";

export default function SuccessPageClient({
  sessionId,
}: {
  sessionId: string | null;
}) {
  useEffect(() => {
    console.log("Session ID:", sessionId);
  }, [sessionId]);

  return (
    <div style={{ padding: 40 }}>
      <h1>Payment Successful</h1>

      {sessionId ? (
        <p>Session ID: {sessionId}</p>
      ) : (
        <p>No session ID found</p>
      )}
    </div>
  );
}

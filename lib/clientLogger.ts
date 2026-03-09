export function logClientError(error: any, context?: string) {
  fetch("/api/debug/client-error", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      error: error?.message || String(error),
      stack: error?.stack || null,
      context: context || "unknown",
      url: typeof window !== "undefined" ? window.location.href : null,
    }),
  }).catch(() => {})
}

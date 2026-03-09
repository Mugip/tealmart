export function reportClientError(error: any, extra?: any) {
  try {
    fetch("/api/debug/client-error", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: error?.message || String(error),
        stack: error?.stack || null,
        url: typeof window !== "undefined" ? window.location.href : null,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        extra: extra || null,
      }),
    })
  } catch (e) {
    // silently fail
  }
}

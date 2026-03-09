'use client'

import { useEffect } from "react"

export default function ErrorCatcher() {

  useEffect(() => {

    const sendError = async (payload: {
      error: any
      stack?: string
      context?: string
    }) => {
      try {
        await fetch("/api/debug/client-error", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: typeof payload.error === "string"
              ? payload.error
              : payload.error?.message || "Unknown client error",
            stack: payload.stack || payload.error?.stack || null,
            context: payload.context || "global",
            url: window.location.href,
          }),
        })
      } catch {
        // never break the UI if logging fails
      }
    }

    const handleError = (event: ErrorEvent) => {
      sendError({
        error: event.error || event.message,
        stack: event.error?.stack,
        context: "window-error",
      })
    }

    const handlePromiseError = (event: PromiseRejectionEvent) => {
      sendError({
        error: event.reason,
        stack: event.reason?.stack,
        context: "unhandled-promise-rejection",
      })
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handlePromiseError)

    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handlePromiseError)
    }

  }, [])

  return null
}

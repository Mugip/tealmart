'use client'

import { useEffect } from "react"
import { reportClientError } from "@/lib/clientErrorLogger"

export default function ErrorCatcher() {
  useEffect(() => {

    const handleError = (event: ErrorEvent) => {
      reportClientError(event.error || event.message)
    }

    const handlePromiseError = (event: PromiseRejectionEvent) => {
      reportClientError(event.reason)
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

'use client'

import { useEffect } from 'react'

async function sendToSentry(error: string, stack?: string, context?: string) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return

  try {
    const url = new URL(dsn)
    const projectId = url.pathname.replace('/', '')
    const sentryEndpoint = `${url.protocol}//${url.host}/api/${projectId}/store/`
    const publicKey = url.username

    await fetch(sentryEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}`,
      },
      body: JSON.stringify({
        platform: 'javascript',
        level: 'error',
        logger: context || 'window',
        message: error,
        exception: stack
          ? {
              values: [
                {
                  type: 'Error',
                  value: error,
                  stacktrace: {
                    frames: stack.split('\n').map(line => ({ filename: line })),
                  },
                },
              ],
            }
          : undefined,
        tags: {
          environment: process.env.NODE_ENV,
          url: typeof window !== 'undefined' ? window.location.href : '',
        },
      }),
    })
  } catch {}
}

export default function ErrorCatcher() {
  useEffect(() => {
    const sendError = async (payload: {
      error: any
      stack?: string
      context?: string
    }) => {
      const errorMessage =
        typeof payload.error === 'string'
          ? payload.error
          : payload.error?.message || 'Unknown client error'

      // Ignore noisy browser errors
      if (
        errorMessage === 'Script error.' ||
        errorMessage.includes('ResizeObserver')
      ) {
        return
      }

      try {
        await fetch('/api/debug/client-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: errorMessage,
            stack: payload.stack || payload.error?.stack || null,
            context: payload.context || 'global',
            url: window.location.href,
          }),
        })
      } catch {}

      await sendToSentry(
        errorMessage,
        payload.stack || payload.error?.stack,
        payload.context
      )
    }

    const handleError = (event: ErrorEvent) => {
      sendError({
        error: event.error || event.message,
        stack: event.error?.stack,
        context: 'window-error',
      })
    }

    const handlePromiseError = (event: PromiseRejectionEvent) => {
      sendError({
        error: event.reason,
        stack: event.reason?.stack,
        context: 'unhandled-promise-rejection',
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handlePromiseError)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handlePromiseError)
    }
  }, [])

  return null
}

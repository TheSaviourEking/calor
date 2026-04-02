'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-serif font-bold text-wine mb-4">Admin Error</h1>
        <p className="text-charcoal/70 mb-6">
          Something went wrong in the admin panel. Please try again.
        </p>
        <button
          onClick={reset}
          className="bg-wine text-white px-6 py-3 rounded-lg hover:bg-wine/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

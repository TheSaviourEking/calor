'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'

export default function AccountError({
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
        <h1 className="text-3xl font-serif font-bold text-wine mb-4">Account Error</h1>
        <p className="text-charcoal/70 mb-6">
          We had trouble loading your account. Please try again or log in again.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="bg-wine text-white px-6 py-3 rounded-lg hover:bg-wine/90 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="border border-wine text-wine px-6 py-3 rounded-lg hover:bg-wine/5 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}

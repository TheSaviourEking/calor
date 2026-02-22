'use client'

import { Suspense } from 'react'
import { Check, X, Loader2, ArrowLeft } from 'lucide-react'
import ClientWrapper from '@/components/layout/ClientWrapper'
import Link from 'next/link'

function VerifyEmailContent({ 
  isSuccess, 
  error 
}: { 
  isSuccess: boolean
  error: string | null 
}) {
  if (isSuccess) {
    return (
      <ClientWrapper>
        <div className="min-h-screen pt-20 bg-cream">
          <div className="max-w-md mx-auto px-6 py-16 text-center">
            <div className="bg-warm-white p-8 border border-sand">
              <div className="w-16 h-16 bg-terracotta/10 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-terracotta" />
              </div>
              <h1 
                className="font-display text-charcoal mb-4"
                style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 300 }}
              >
                Email Verified
              </h1>
              <p className="font-body text-warm-gray mb-6">
                Your email has been verified successfully. You can now access all features of your account.
              </p>
              <Link
                href="/account/orders"
                className="inline-block bg-charcoal text-cream px-8 py-4 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
              >
                Go to Account
              </Link>
            </div>
          </div>
        </div>
      </ClientWrapper>
    )
  }

  if (error) {
    return (
      <ClientWrapper>
        <div className="min-h-screen pt-20 bg-cream">
          <div className="max-w-md mx-auto px-6 py-16 text-center">
            <div className="bg-warm-white p-8 border border-sand">
              <div className="w-16 h-16 bg-ember/10 flex items-center justify-center mx-auto mb-6">
                <X className="w-8 h-8 text-ember" />
              </div>
              <h1 
                className="font-display text-charcoal mb-4"
                style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 300 }}
              >
                Verification Failed
              </h1>
              <p className="font-body text-warm-gray mb-6">
                {error === 'invalid' 
                  ? 'This verification link is invalid or has expired. Please request a new one.'
                  : 'Something went wrong. Please try again.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/api/auth/resend-verification"
                  className="bg-terracotta text-warm-white px-8 py-4 font-body text-sm uppercase tracking-wider hover:bg-terracotta-light transition-colors"
                >
                  Resend Verification
                </Link>
                <Link
                  href="/account"
                  className="border border-sand px-8 py-4 font-body text-sm uppercase tracking-wider hover:border-terracotta transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </ClientWrapper>
    )
  }

  // Loading state (when no success or error params)
  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20 bg-cream">
        <div className="max-w-md mx-auto px-6 py-16 text-center">
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 animate-spin text-terracotta mb-6" />
            <h1 
              className="font-display text-charcoal mb-4"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 300 }}
            >
              Verifying your email
            </h1>
            <p className="font-body text-warm-gray">
              Please wait while we verify your email address...
            </p>
          </div>
        </div>
      </div>
    </ClientWrapper>
  )
}

function VerifyEmailPageInner({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  // Use React's use() to unwrap the promise
  return searchParams.then((params) => {
    const isSuccess = params.success === 'true'
    const error = params.error || null
    
    return (
      <VerifyEmailContent isSuccess={isSuccess} error={error} />
    )
  })
}

// Wrapper component that uses async/await properly
async function VerifyEmailPageAsync({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const params = await searchParams
  const isSuccess = params.success === 'true'
  const error = params.error || null
  
  return <VerifyEmailContent isSuccess={isSuccess} error={error} />
}

export default function VerifyEmailPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ success?: string; error?: string }> 
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-20 bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
      </div>
    }>
      <VerifyEmailPageAsync searchParams={searchParams} />
    </Suspense>
  )
}

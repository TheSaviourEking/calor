'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import ClientWrapper from '@/components/layout/ClientWrapper'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Something went wrong')
        return
      }

      setSubmitted(true)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20 bg-cream">
        <div className="max-w-md mx-auto px-6 py-16">
          <a
            href="/account"
            className="inline-flex items-center gap-2 font-body text-warm-gray text-sm mb-8 hover:text-terracotta"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </a>

          <h1 
            className="font-display text-charcoal mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 300 }}
          >
            Forgot Password
          </h1>

          {submitted ? (
            <div className="bg-warm-white p-8 border border-sand">
              <p className="font-body text-charcoal mb-4">
                Check your email
              </p>
              <p className="font-body text-warm-gray text-sm">
                If an account with that email exists, we&apos;ve sent a password reset link. The link will expire in 1 hour.
              </p>
            </div>
          ) : (
            <>
              <p className="font-body text-warm-gray mb-8">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              <div className="bg-warm-white p-8 border border-sand">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="font-body text-charcoal text-sm mb-2 block">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-charcoal text-cream py-4 font-body text-sm uppercase tracking-wider transition-colors hover:bg-terracotta disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </ClientWrapper>
  )
}

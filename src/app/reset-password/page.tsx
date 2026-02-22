'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import ClientWrapper from '@/components/layout/ClientWrapper'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      setSuccess(true)
      toast.success('Password reset successfully!')
      
      // Redirect to account after 2 seconds
      setTimeout(() => {
        router.push('/account/orders')
      }, 2000)
    } catch (error) {
      setError('Something went wrong')
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
            Reset Password
          </h1>

          {success ? (
            <div className="bg-warm-white p-8 border border-sand">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-terracotta/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-terracotta" />
                </div>
                <p className="font-body text-charcoal">Password reset successfully!</p>
              </div>
              <p className="font-body text-warm-gray text-sm">
                Redirecting you to your account...
              </p>
            </div>
          ) : error ? (
            <div className="bg-warm-white p-8 border border-sand">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-ember/10 flex items-center justify-center">
                  <X className="w-5 h-5 text-ember" />
                </div>
                <p className="font-body text-charcoal">Error</p>
              </div>
              <p className="font-body text-warm-gray text-sm mb-6">
                {error}
              </p>
              <a
                href="/forgot-password"
                className="font-body text-terracotta text-sm hover:underline"
              >
                Request a new reset link
              </a>
            </div>
          ) : (
            <div className="bg-warm-white p-8 border border-sand">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="font-body text-charcoal text-sm mb-2 block">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div>
                  <label className="font-body text-charcoal text-sm mb-2 block">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full bg-charcoal text-cream py-4 font-body text-sm uppercase tracking-wider transition-colors hover:bg-terracotta disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </ClientWrapper>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-20 bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

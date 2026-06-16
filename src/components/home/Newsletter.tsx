'use client'

import { useState } from 'react'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [error, setError] = useState('')
  const [inputFocused, setInputFocused] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok) {
        setIsSubscribed(true)
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Something went wrong')
    }

    setIsSubmitting(false)
  }

  return (
    <section className="py-20 lg:py-32 bg-charcoal grain-overlay">
      <div className="max-w-xl mx-auto px-6 lg:px-8 text-center">
        <h2
          className="font-display text-cream mb-4"
          style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 300 }}
        >
          The warmth, delivered.
        </h2>
        <p className="font-body text-warm-gray text-base mb-8">
          Rare updates. No spam. Easy unsubscribe. Privacy respected.
        </p>

        {isSubscribed ? (
          <div className="py-4">
            <p className="font-body text-terracotta">
              You are in. We write rarely and mean it when we do.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-0">
            <div className="flex-1 relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Your email address"
                required
                className="w-full bg-warm-white/10 border border-warm-white/20 px-6 py-4 font-body text-sm text-cream placeholder:text-warm-gray focus:outline-none focus:border-terracotta/50 transition-colors duration-300"
              />
              {/* Animated focus underline growing from center */}
              <div
                className="absolute bottom-0 left-1/2 h-0.5 bg-terracotta transition-all duration-400 -translate-x-1/2"
                style={{
                  width: inputFocused ? '100%' : '0%',
                  transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-terracotta px-6 py-4 font-body text-sm uppercase tracking-wider text-warm-white transition-colors duration-300 hover:bg-terracotta-light disabled:opacity-50"
            >
              {isSubmitting ? '...' : 'Join'}
            </button>
          </form>
        )}

        {error && (
          <p className="font-body text-ember text-xs mt-4">{error}</p>
        )}

        <p className="font-body text-warm-gray text-xs mt-6">
          We never sell your data. Ever.
        </p>
      </div>
    </section>
  )
}

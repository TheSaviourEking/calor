'use client'

import { useState } from 'react'
import ClientWrapper from '@/components/layout/ClientWrapper'
import { Crown, Lock } from 'lucide-react'
import { toast } from 'sonner'

export default function MembersPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to subscribe')
      }

      toast.success("You're on the list! We'll notify you when memberships open.")
      setEmail('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20 bg-charcoal">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <Crown className="w-16 h-16 text-gold mx-auto mb-8" />
          <h1
            className="font-display text-cream mb-6"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 300 }}
          >
            CALOR Members
          </h1>
          <p className="font-body text-warm-gray text-lg mb-8 max-w-xl mx-auto">
            A premium membership for those who want more. Exclusive content, early access to new products, and members-only pricing.
          </p>

          <div className="bg-warm-white/5 border border-warm-white/10 p-8 mb-12">
            <h2 className="font-display text-cream text-xl mb-4" style={{ fontWeight: 400 }}>
              Coming Soon
            </h2>
            <p className="font-body text-warm-gray text-sm mb-6">
              We are building something special. Be the first to know when memberships open.
            </p>

            <form onSubmit={handleSubmit} className="flex gap-0 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-3 bg-warm-white/10 border border-warm-white/20 font-body text-sm text-cream placeholder:text-warm-gray focus:outline-none focus:border-terracotta"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-terracotta px-6 py-3 font-body text-sm uppercase tracking-wider text-warm-white hover:bg-terracotta-light disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Notify Me'}
              </button>
            </form>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="p-6 border border-warm-white/10">
              <Lock className="w-5 h-5 text-terracotta mb-4" />
              <h3 className="font-display text-cream text-lg mb-2" style={{ fontWeight: 400 }}>
                Exclusive Content
              </h3>
              <p className="font-body text-warm-gray text-sm">
                Access to premium content not available to the public.
              </p>
            </div>
            <div className="p-6 border border-warm-white/10">
              <Crown className="w-5 h-5 text-terracotta mb-4" />
              <h3 className="font-display text-cream text-lg mb-2" style={{ fontWeight: 400 }}>
                Early Access
              </h3>
              <p className="font-body text-warm-gray text-sm">
                Be the first to see new products and collections.
              </p>
            </div>
            <div className="p-6 border border-warm-white/10">
              <span className="text-terracotta text-lg mb-4 block">10%</span>
              <h3 className="font-display text-cream text-lg mb-2" style={{ fontWeight: 400 }}>
                Members Pricing
              </h3>
              <p className="font-body text-warm-gray text-sm">
                Ongoing discount on all purchases.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ClientWrapper>
  )
}

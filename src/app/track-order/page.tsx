'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ClientWrapper from '@/components/layout/ClientWrapper'
import { Search } from 'lucide-react'

export default function TrackOrderPage() {
  const router = useRouter()
  const [reference, setReference] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (reference.trim()) {
      router.push(`/order/${reference.trim()}`)
    }
  }

  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20 bg-cream">
        <div className="max-w-xl mx-auto px-6 py-16">
          <h1 
            className="font-display text-charcoal text-center mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 300 }}
          >
            Track Your Order
          </h1>
          <p className="font-body text-warm-gray text-center mb-8">
            Enter your order reference number to see the delivery status.
          </p>

          <form onSubmit={handleSubmit} className="flex gap-0">
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. CAL-A7X9K2"
              className="flex-1 px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
            />
            <button
              type="submit"
              className="bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
            >
              Track
            </button>
          </form>

          <div className="mt-8 p-6 bg-warm-white border border-sand">
            <h3 className="font-body text-charcoal text-sm uppercase tracking-wider mb-2">
              Where is my order number?
            </h3>
            <p className="font-body text-warm-gray text-sm">
              Your order reference was included in your confirmation email. 
              It starts with &quot;CAL-&quot; followed by 6 characters.
            </p>
          </div>
        </div>
      </div>
    </ClientWrapper>
  )
}

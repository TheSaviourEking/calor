'use client'

import { useState } from 'react'
import { Gift, CreditCard, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

const presetAmounts = [
  { value: 2500, label: '$25' },
  { value: 5000, label: '$50' },
  { value: 10000, label: '$100' },
  { value: 15000, label: '$150' },
  { value: 20000, label: '$200' },
  { value: 25000, label: '$250' },
]

export default function GiftCardsClient() {
  const [step, setStep] = useState(1)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [formData, setFormData] = useState({
    recipientEmail: '',
    recipientName: '',
    senderName: '',
    message: '',
    scheduledDate: '',
    scheduledTime: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [giftCardCode, setGiftCardCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const amount = selectedAmount || (customAmount ? parseInt(customAmount) * 100 : 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (amount < 500 || amount > 50000) {
      setError('Amount must be between $5 and $500')
      return
    }

    if (!formData.recipientEmail) {
      setError('Recipient email is required')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const scheduledDelivery = formData.scheduledDate
        ? new Date(`${formData.scheduledDate}T${formData.scheduledTime || '09:00'}`)
        : null

      const response = await fetch('/api/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valueCents: amount,
          recipientEmail: formData.recipientEmail,
          recipientName: formData.recipientName,
          senderName: formData.senderName,
          message: formData.message,
          scheduledDelivery: scheduledDelivery?.toISOString(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create gift card')
      }

      setGiftCardCode(data.giftCard.code)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create gift card')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setSelectedAmount(null)
    setCustomAmount('')
    setFormData({
      recipientEmail: '',
      recipientName: '',
      senderName: '',
      message: '',
      scheduledDate: '',
      scheduledTime: '',
    })
    setSuccess(false)
    setGiftCardCode('')
  }

  return (
    <div className="min-h-screen pt-20 bg-cream">
      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-terracotta/10 flex items-center justify-center mx-auto mb-6">
            <Gift className="w-8 h-8 text-terracotta" />
          </div>
          <h1 
            className="font-display text-charcoal mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300 }}
          >
            Gift Cards
          </h1>
          <p className="font-body text-warm-gray text-base max-w-md mx-auto">
            Give the gift of choice. Our digital gift cards are delivered instantly via email.
          </p>
        </div>

        {success ? (
          /* Success State */
          <div className="bg-warm-white p-8 border border-sand text-center">
            <div className="w-16 h-16 bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-display text-charcoal text-2xl mb-2" style={{ fontWeight: 400 }}>
              Gift Card Sent!
            </h2>
            <p className="font-body text-warm-gray text-sm mb-6">
              Your gift card has been sent to {formData.recipientEmail}
            </p>
            <div className="bg-cream p-6 mb-6">
              <p className="font-body text-warm-gray text-xs uppercase tracking-wider mb-2">
                Gift Card Code
              </p>
              <p className="font-mono text-terracotta text-2xl tracking-widest">
                {giftCardCode}
              </p>
            </div>
            <p className="font-body text-warm-gray text-xs mb-6">
              A confirmation email has also been sent to your inbox.
            </p>
            <button
              onClick={resetForm}
              className="bg-terracotta text-warm-white px-8 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta-light transition-colors"
            >
              Send Another Gift Card
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Amount */}
            <div className="bg-warm-white p-6 border border-sand">
              <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                Step 1: Choose Amount
              </h2>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(preset.value)
                      setCustomAmount('')
                    }}
                    className={`py-4 border font-body text-sm transition-colors ${
                      selectedAmount === preset.value
                        ? 'border-terracotta bg-terracotta/5 text-terracotta'
                        : 'border-sand hover:border-terracotta/50 text-charcoal'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-warm-gray">$</span>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value)
                    setSelectedAmount(null)
                  }}
                  placeholder="Custom amount ($5 - $500)"
                  className="w-full pl-8 pr-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                />
              </div>
            </div>

            {/* Step 2: Recipient */}
            <div className="bg-warm-white p-6 border border-sand">
              <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                Step 2: Recipient Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block font-body text-charcoal text-sm mb-2">
                    Recipient Email *
                  </label>
                  <input
                    type="email"
                    value={formData.recipientEmail}
                    onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                    placeholder="their@email.com"
                    className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                    required
                  />
                </div>

                <div>
                  <label className="block font-body text-charcoal text-sm mb-2">
                    Recipient Name (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    placeholder="Their name"
                    className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div>
                  <label className="block font-body text-charcoal text-sm mb-2">
                    Your Name (shown on gift email)
                  </label>
                  <input
                    type="text"
                    value={formData.senderName}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    placeholder="Your name"
                    className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Personal Message */}
            <div className="bg-warm-white p-6 border border-sand">
              <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                Step 3: Personal Message (optional)
              </h2>

              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Add a personal message..."
                rows={3}
                maxLength={200}
                className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta resize-none"
              />
              <p className="font-body text-warm-gray text-xs mt-2">
                {formData.message.length}/200 characters
              </p>
            </div>

            {/* Step 4: Schedule Delivery */}
            <div className="bg-warm-white p-6 border border-sand">
              <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                Step 4: Delivery (optional)
              </h2>

              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-warm-gray" />
                <span className="font-body text-warm-gray text-sm">
                  Send immediately or schedule for later
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-charcoal text-sm mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>
                <div>
                  <label className="block font-body text-charcoal text-sm mb-2">Time</label>
                  <input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="font-body text-sm">{error}</span>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-warm-white p-6 border border-sand">
              <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                Order Summary
              </h2>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="font-body text-warm-gray text-sm">Gift Card Value</span>
                  <span className="font-body text-charcoal text-sm">
                    ${(amount / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-body text-warm-gray text-sm">Delivery</span>
                  <span className="font-body text-charcoal text-sm">
                    {formData.scheduledDate ? 'Scheduled' : 'Instant (email)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-body text-warm-gray text-sm">Processing Fee</span>
                  <span className="font-body text-charcoal text-sm">Free</span>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-sand">
                <span className="font-display text-charcoal" style={{ fontWeight: 400 }}>Total</span>
                <span className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                  ${(amount / 100).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || amount === 0}
              className="w-full bg-terracotta text-warm-white py-4 font-body text-sm uppercase tracking-wider transition-colors hover:bg-terracotta-light disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Continue to Payment
                </>
              )}
            </button>

            <p className="font-body text-warm-gray text-xs text-center">
              Gift cards are delivered via email. Recipient must be 18+. Never expires.
            </p>
          </form>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="text-center">
            <div className="w-12 h-12 bg-terracotta/10 flex items-center justify-center mx-auto mb-3">
              <Gift className="w-5 h-5 text-terracotta" />
            </div>
            <h3 className="font-body text-charcoal text-sm font-medium mb-1">Instant Delivery</h3>
            <p className="font-body text-warm-gray text-xs">Sent directly to their inbox</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-terracotta/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-5 h-5 text-terracotta" />
            </div>
            <h3 className="font-body text-charcoal text-sm font-medium mb-1">Never Expires</h3>
            <p className="font-body text-warm-gray text-xs">Use it whenever you&apos;re ready</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-terracotta/10 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-5 h-5 text-terracotta" />
            </div>
            <h3 className="font-body text-charcoal text-sm font-medium mb-1">Discreet Billing</h3>
            <p className="font-body text-warm-gray text-xs">Shows &quot;CALŌR CO&quot; only</p>
          </div>
        </div>
      </div>
    </div>
  )
}

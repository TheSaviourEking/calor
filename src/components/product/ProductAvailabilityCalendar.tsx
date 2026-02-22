'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Bell, Check } from 'lucide-react'
import { toast } from 'sonner'

interface AvailabilityCalendarProps {
  productId: string
  productName: string
  isInStock: boolean
}

export default function ProductAvailabilityCalendar({
  productId,
  productName,
  isInStock,
}: AvailabilityCalendarProps) {
  const [showNotifyForm, setShowNotifyForm] = useState(false)
  const [email, setEmail] = useState('')
  const [notified, setNotified] = useState(false)
  const [loading, setLoading] = useState(false)

  // If in stock, show availability
  if (isInStock) {
    return (
      <div className="bg-green-50 border border-green-200 p-4">
        <div className="flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-body text-green-700 text-sm font-medium">In Stock</p>
            <p className="font-body text-green-600 text-xs">Ships within 1-2 business days</p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate expected restock date (7-14 days from now)
  const minDays = 7
  const maxDays = 14
  const restockDate = new Date()
  restockDate.setDate(restockDate.getDate() + minDays)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleNotifyMe = async () => {
    if (!email) {
      toast.error('Please enter your email')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/alerts/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, email }),
      })

      if (res.ok) {
        setNotified(true)
        toast.success("We'll notify you when this item is back in stock!")
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to set up notification')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-warm-white border border-sand p-4">
      <div className="flex items-start gap-3 mb-4">
        <Calendar className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-body text-charcoal text-sm font-medium">Expected Restock</p>
          <p className="font-body text-warm-gray text-xs mt-1">
            {formatDate(restockDate)} - {formatDate(new Date(restockDate.getTime() + (maxDays - minDays) * 24 * 60 * 60 * 1000))}
          </p>
        </div>
      </div>

      <div className="border-t border-sand pt-4">
        <p className="font-body text-charcoal text-sm mb-3">
          Get notified when it's back:
        </p>

        {notified ? (
          <div className="flex items-center gap-2 text-terracotta">
            <Bell className="w-4 h-4" />
            <span className="font-body text-sm">You'll be notified!</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
            />
            <button
              onClick={handleNotifyMe}
              disabled={loading}
              className="px-4 py-2 bg-charcoal text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors disabled:opacity-50"
            >
              {loading ? '...' : 'Notify Me'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

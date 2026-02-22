'use client'

import { useState, useEffect } from 'react'
import { Gift, Star, TrendingUp, Clock, Award } from 'lucide-react'
import Link from 'next/link'

interface Transaction {
  id: string
  points: number
  type: string
  description: string
  orderId: string | null
  createdAt: string
}

interface LoyaltyAccount {
  id: string
  points: number
  totalEarned: number
  totalUsed: number
  tier: string
  pointsValue: number
  progressToNextTier: number
  nextTier: string | null
  pointsToNextTier: number
  transactions: Transaction[]
}

export default function LoyaltyClient() {
  const [account, setAccount] = useState<LoyaltyAccount | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAccount()
  }, [])

  const fetchAccount = async () => {
    try {
      const res = await fetch('/api/loyalty')
      if (res.ok) {
        const data = await res.json()
        setAccount(data.account)
      }
    } catch (error) {
      console.error('Error fetching loyalty account:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`

  const tierStyles: Record<string, { bg: string; text: string; icon: string }> = {
    bronze: { bg: 'bg-amber-100', text: 'text-amber-800', icon: 'text-amber-600' },
    silver: { bg: 'bg-gray-100', text: 'text-gray-700', icon: 'text-gray-500' },
    gold: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'text-yellow-500' },
    platinum: { bg: 'bg-slate-100', text: 'text-slate-700', icon: 'text-slate-400' },
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="font-body text-warm-gray">Loading...</p>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="text-center py-16">
        <p className="font-body text-warm-gray">Please log in to view your loyalty account</p>
      </div>
    )
  }

  const tierStyle = tierStyles[account.tier] || tierStyles.bronze

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 
          className="font-display text-charcoal mb-2"
          style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 300 }}
        >
          Loyalty Rewards
        </h1>
        <p className="font-body text-warm-gray">
          Earn points with every purchase. 100 points = $1 credit.
        </p>
      </div>

      {/* Points Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Current Points */}
        <div className="p-6 bg-cream border border-sand">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-5 h-5 text-terracotta" />
            <span className="font-body text-warm-gray text-sm">Available Points</span>
          </div>
          <p className="font-display text-charcoal text-4xl" style={{ fontWeight: 400 }}>
            {account.points.toLocaleString()}
          </p>
          <p className="font-body text-warm-gray text-sm mt-1">
            = {formatPrice(account.pointsValue * 100)} credit
          </p>
        </div>

        {/* Total Earned */}
        <div className="p-6 bg-cream border border-sand">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-terracotta" />
            <span className="font-body text-warm-gray text-sm">Total Earned</span>
          </div>
          <p className="font-display text-charcoal text-4xl" style={{ fontWeight: 400 }}>
            {account.totalEarned.toLocaleString()}
          </p>
        </div>

        {/* Current Tier */}
        <div className={`p-6 ${tierStyle.bg} border border-sand`}>
          <div className="flex items-center gap-3 mb-2">
            <Award className={`w-5 h-5 ${tierStyle.icon}`} />
            <span className={`font-body text-sm ${tierStyle.text}`}>Current Tier</span>
          </div>
          <p className={`font-display text-4xl capitalize ${tierStyle.text}`} style={{ fontWeight: 400 }}>
            {account.tier}
          </p>
          {account.nextTier && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className={`font-body ${tierStyle.text}`}>Progress to {account.nextTier}</span>
                <span className={`font-body ${tierStyle.text}`}>{account.pointsToNextTier} pts to go</span>
              </div>
              <div className="h-2 bg-white/50 overflow-hidden">
                <div
                  className="h-full bg-terracotta transition-all"
                  style={{ width: `${account.progressToNextTier}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tier Benefits */}
      <div className="mb-8 p-6 bg-sand/20 border border-sand">
        <h3 className="font-body text-charcoal mb-4">Tier Benefits</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="p-4 bg-cream/50">
            <p className="font-body text-amber-700 text-sm font-medium">Bronze</p>
            <p className="font-body text-warm-gray text-xs mt-1">0-499 points</p>
          </div>
          <div className="p-4 bg-cream/50">
            <p className="font-body text-gray-700 text-sm font-medium">Silver</p>
            <p className="font-body text-warm-gray text-xs mt-1">500-999 points</p>
            <p className="font-body text-terracotta text-xs mt-1">+ 5% bonus points</p>
          </div>
          <div className="p-4 bg-cream/50">
            <p className="font-body text-yellow-700 text-sm font-medium">Gold</p>
            <p className="font-body text-warm-gray text-xs mt-1">1,000-2,499 points</p>
            <p className="font-body text-terracotta text-xs mt-1">+ 10% bonus points</p>
          </div>
          <div className="p-4 bg-cream/50">
            <p className="font-body text-slate-700 text-sm font-medium">Platinum</p>
            <p className="font-body text-warm-gray text-xs mt-1">2,500+ points</p>
            <p className="font-body text-terracotta text-xs mt-1">+ 15% bonus points</p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-body text-charcoal">Recent Activity</h3>
          <Link
            href="/account/orders"
            className="font-body text-sm text-terracotta hover:underline"
          >
            View all orders
          </Link>
        </div>

        {account.transactions.length === 0 ? (
          <div className="text-center py-8 bg-sand/20">
            <Clock className="w-12 h-12 text-warm-gray/50 mx-auto mb-4" />
            <p className="font-body text-warm-gray">No activity yet</p>
            <p className="font-body text-warm-gray/70 text-sm mt-1">
              Place an order to start earning points.
            </p>
            <Link
              href="/shop"
              className="inline-block mt-4 px-6 py-2 bg-charcoal text-cream font-body text-sm hover:bg-terracotta transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="border border-sand divide-y divide-sand">
            {account.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-cream">
                <div>
                  <p className="font-body text-charcoal text-sm">{tx.description}</p>
                  <p className="font-body text-warm-gray text-xs mt-1">
                    {formatDate(tx.createdAt)}
                  </p>
                </div>
                <span
                  className={`font-body text-sm ${
                    tx.points > 0 ? 'text-terracotta' : 'text-warm-gray'
                  }`}
                >
                  {tx.points > 0 ? '+' : ''}{tx.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How to Earn */}
      <div className="mt-8 p-6 bg-sand/20 border border-sand">
        <h3 className="font-body text-charcoal mb-4">How to Earn Points</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex gap-3">
            <Gift className="w-5 h-5 text-terracotta flex-shrink-0" />
            <div>
              <p className="font-body text-charcoal text-sm">Make a Purchase</p>
              <p className="font-body text-warm-gray text-xs mt-1">
                Earn 1 point per dollar spent
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Star className="w-5 h-5 text-terracotta flex-shrink-0" />
            <div>
              <p className="font-body text-charcoal text-sm">Tier Bonus</p>
              <p className="font-body text-warm-gray text-xs mt-1">
                Higher tiers earn bonus points
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <TrendingUp className="w-5 h-5 text-terracotta flex-shrink-0" />
            <div>
              <p className="font-body text-charcoal text-sm">Redeem at Checkout</p>
              <p className="font-body text-warm-gray text-xs mt-1">
                100 points = $1 off your order
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

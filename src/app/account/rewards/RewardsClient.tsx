'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import {
  Gift,
  Percent,
  Truck,
  Star,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

interface Reward {
  id: string
  name: string
  description: string | null
  type: string
  pointsCost: number
  discountCents: number | null
  discountPercent: number | null
  giftCardValue: number | null
  imageUrl: string | null
  iconName: string | null
  featured: boolean
  available: boolean
  unavailableReason: string | null
}

export default function RewardsClient({
  initialRewards,
  initialPointsBalance
}: {
  initialRewards: Reward[]
  initialPointsBalance: number
}) {
  const router = useRouter()
  const { customer, isAuthenticated } = useAuthStore()
  const [rewards, setRewards] = useState<Reward[]>(initialRewards)
  const [pointsBalance, setPointsBalance] = useState(initialPointsBalance)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/account')
    }
  }, [isAuthenticated, router])

  const handleRedeem = async (reward: Reward) => {
    if (!customer?.id) return

    setRedeeming(reward.id)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/points/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          rewardId: reward.id,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Failed to redeem reward')
        return
      }

      setSuccess(`Successfully redeemed: ${reward.name}`)
      setPointsBalance(json.newPointsBalance)

      // Refresh rewards
      const rewardsRes = await fetch(`/api/points/rewards?customerId=${customer.id}`)
      if (rewardsRes.ok) {
        const rewardsJson = await rewardsRes.json()
        setRewards(rewardsJson.rewards)
      }
    } catch (error) {
      setError('Failed to redeem reward')
    } finally {
      setRedeeming(null)
    }
  }

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'discount': return <Percent className="w-6 h-6" />
      case 'gift_card': return <Gift className="w-6 h-6" />
      case 'shipping': return <Truck className="w-6 h-6" />
      case 'product': return <Star className="w-6 h-6" />
      default: return <Gift className="w-6 h-6" />
    }
  }

  const getRewardValue = (reward: Reward) => {
    if (reward.discountPercent) return `${reward.discountPercent}% off`
    if (reward.discountCents) return `$${(reward.discountCents / 100).toFixed(0)} off`
    if (reward.giftCardValue) return `$${(reward.giftCardValue / 100).toFixed(0)} gift card`
    return 'Special reward'
  }

  const featuredRewards = rewards.filter(r => r.featured)
  const regularRewards = rewards.filter(r => !r.featured)

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="font-display text-charcoal mb-2"
          style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 300 }}
        >
          Rewards Store
        </h1>
        <p className="font-body text-warm-gray">Redeem your loyalty points for exclusive rewards</p>
      </div>

      {/* Points Balance */}
      <div className="bg-warm-white border border-sand p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <div className="text-sm font-body text-warm-gray uppercase tracking-wider mb-1">
              Your Points Balance
            </div>
            <div className="font-display text-4xl text-terracotta" style={{ fontWeight: 300 }}>
              {pointsBalance.toLocaleString()}
            </div>
          </div>
          <Link
            href="/account/vip"
            className="font-body text-charcoal border border-charcoal px-6 py-3 hover:bg-charcoal hover:text-cream transition-colors"
          >
            View VIP Status
          </Link>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <span className="font-body text-green-800">{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="font-body text-red-800">{error}</span>
        </div>
      )}

      {/* Featured Rewards */}
      {featuredRewards.length > 0 && (
        <div className="mb-12">
          <h2 className="font-display text-2xl text-charcoal mb-6" style={{ fontWeight: 300 }}>
            Featured Rewards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredRewards.map((reward) => (
              <div
                key={reward.id}
                className="bg-warm-white border border-terracotta p-6 relative"
              >
                <div className="absolute top-4 right-4 bg-terracotta text-cream text-xs font-body px-2 py-1 uppercase tracking-wider">
                  Featured
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-sand flex items-center justify-center text-terracotta">
                    {getRewardIcon(reward.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-xl text-charcoal mb-1" style={{ fontWeight: 300 }}>
                      {reward.name}
                    </h3>
                    <div className="font-body text-terracotta mb-2">
                      {getRewardValue(reward)}
                    </div>
                    {reward.description && (
                      <p className="font-body text-sm text-warm-gray mb-4">
                        {reward.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-sand flex items-center justify-between">
                  <div className="font-display text-2xl text-charcoal" style={{ fontWeight: 300 }}>
                    {reward.pointsCost.toLocaleString()} pts
                  </div>
                  <button
                    onClick={() => handleRedeem(reward)}
                    disabled={!reward.available || pointsBalance < reward.pointsCost || redeeming === reward.id}
                    className={`font-body px-6 py-3 border transition-colors ${!reward.available || pointsBalance < reward.pointsCost
                      ? 'border-warm-gray/30 text-warm-gray/50 cursor-not-allowed'
                      : 'border-charcoal text-charcoal hover:bg-charcoal hover:text-cream'
                      }`}
                  >
                    {redeeming === reward.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : !reward.available ? (
                      reward.unavailableReason || 'Unavailable'
                    ) : pointsBalance < reward.pointsCost ? (
                      'Not enough points'
                    ) : (
                      'Redeem'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Rewards */}
      <h2 className="font-display text-2xl text-charcoal mb-6" style={{ fontWeight: 300 }}>
        All Rewards
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {regularRewards.map((reward) => (
          <div
            key={reward.id}
            className="bg-warm-white border border-sand p-6 hover:border-terracotta transition-colors"
          >
            <div className="w-12 h-12 bg-sand flex items-center justify-center text-terracotta mb-4">
              {getRewardIcon(reward.type)}
            </div>
            <h3 className="font-display text-lg text-charcoal mb-1" style={{ fontWeight: 300 }}>
              {reward.name}
            </h3>
            <div className="font-body text-sm text-terracotta mb-2">
              {getRewardValue(reward)}
            </div>
            {reward.description && (
              <p className="font-body text-sm text-warm-gray mb-4 line-clamp-2">
                {reward.description}
              </p>
            )}
            <div className="pt-4 border-t border-sand flex items-center justify-between">
              <div className="font-display text-xl text-charcoal" style={{ fontWeight: 300 }}>
                {reward.pointsCost.toLocaleString()} pts
              </div>
              <button
                onClick={() => handleRedeem(reward)}
                disabled={!reward.available || pointsBalance < reward.pointsCost || redeeming === reward.id}
                className={`font-body text-sm px-4 py-2 border transition-colors ${!reward.available || pointsBalance < reward.pointsCost
                  ? 'border-warm-gray/30 text-warm-gray/50 cursor-not-allowed'
                  : 'border-charcoal text-charcoal hover:bg-charcoal hover:text-cream'
                  }`}
              >
                {redeeming === reward.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : !reward.available ? (
                  reward.unavailableReason || 'Unavailable'
                ) : pointsBalance < reward.pointsCost ? (
                  'Need more pts'
                ) : (
                  'Redeem'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {rewards.length === 0 && (
        <div className="text-center py-16 bg-warm-white border border-sand">
          <Gift className="w-12 h-12 text-warm-gray mx-auto mb-4" />
          <p className="font-body text-warm-gray">No rewards available at this time</p>
        </div>
      )}
    </>
  )
}

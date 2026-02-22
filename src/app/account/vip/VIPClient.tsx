'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import {
  Crown,
  Star,
  Gift,
  Truck,
  Sparkles,
  ChevronRight,
  Check,
} from 'lucide-react'
import Link from 'next/link'

interface VIPTier {
  id: string
  name: string
  slug: string
  level: number
  minPoints: number
  minSpent: number
  pointsMultiplier: number
  freeShippingThreshold: number | null
  birthdayBonus: number
  earlyAccess: boolean
  exclusiveProducts: boolean
  prioritySupport: boolean
  freeReturns: boolean
  iconName: string | null
  colorHex: string | null
  description: string | null
  benefits: Array<{
    id: string
    name: string
    description: string | null
    iconName: string | null
  }>
}

interface Progress {
  id: string
  lifetimePoints: number
  lifetimeSpent: number
  birthdayClaimed: boolean
  currentTier: VIPTier | null
}

interface VIPData {
  progress: Progress
  nextTier: VIPTier | null
  pointsToNextTier: number
  progressPercentage: number
  allTiers: VIPTier[]
}

export default function VIPClient() {
  const router = useRouter()
  const { customer, isAuthenticated } = useAuthStore()
  const [data, setData] = useState<VIPData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/account')
      return
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/vip/progress?customerId=${customer?.id}`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error('Error fetching VIP data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (customer?.id) {
      fetchData()
    }
  }, [customer?.id, isAuthenticated, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="font-body text-warm-gray">Loading...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="font-body text-warm-gray">Unable to load VIP data</p>
      </div>
    )
  }

  const { progress, nextTier, pointsToNextTier, progressPercentage, allTiers } = data

  const getTierIcon = (level: number) => {
    switch (level) {
      case 0: return <Star className="w-6 h-6" />
      case 1: return <Sparkles className="w-6 h-6" />
      case 2: return <Crown className="w-6 h-6" />
      case 3: return <Crown className="w-6 h-6 text-terracotta" />
      default: return <Star className="w-6 h-6" />
    }
  }

  const getTierColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-warm-gray/20 text-warm-gray border-warm-gray'
      case 1: return 'bg-sand text-charcoal border-charcoal/20'
      case 2: return 'bg-terracotta/20 text-terracotta border-terracotta'
      case 3: return 'bg-charcoal text-cream border-charcoal'
      default: return 'bg-warm-gray/20 text-warm-gray border-warm-gray'
    }
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 
          className="font-display text-charcoal mb-2"
          style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 300 }}
        >
          VIP Rewards
        </h1>
        <p className="font-body text-warm-gray">Earn points, unlock exclusive benefits, and enjoy premium perks</p>
      </div>

      {/* Current Status Card */}
      <div className="bg-warm-white border border-sand p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className={`w-20 h-20 flex items-center justify-center border ${getTierColor(progress.currentTier?.level ?? 0)}`}>
              {getTierIcon(progress.currentTier?.level ?? 0)}
            </div>
            <div>
              <div className="text-sm font-body text-warm-gray uppercase tracking-wider mb-1">
                Current Status
              </div>
              <h2 className="font-display text-3xl text-charcoal" style={{ fontWeight: 300 }}>
                {progress.currentTier?.name || 'Bronze'}
              </h2>
              <div className="font-body text-warm-gray mt-1">
                Member since 2024
              </div>
            </div>
          </div>
          <div className="text-center md:text-right">
            <div className="text-sm font-body text-warm-gray uppercase tracking-wider mb-1">
              Lifetime Points
            </div>
            <div className="font-display text-4xl text-terracotta" style={{ fontWeight: 300 }}>
              {progress.lifetimePoints.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Progress to Next Tier */}
        {nextTier && (
          <div className="mt-8 pt-8 border-t border-sand">
            <div className="flex items-center justify-between mb-3">
              <span className="font-body text-warm-gray">
                {pointsToNextTier.toLocaleString()} points to {nextTier.name}
              </span>
              <span className="font-body text-charcoal">
                {progressPercentage}%
              </span>
            </div>
            <div className="h-2 bg-sand">
              <div
                className="h-full bg-terracotta transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="font-body text-sm text-warm-gray">
                {progress.currentTier?.name || 'Bronze'}
              </span>
              <span className="font-body text-sm text-warm-gray">
                {nextTier.name}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <Link
          href="/account/rewards"
          className="flex items-center justify-between p-6 bg-warm-white border border-sand hover:border-terracotta transition-colors"
        >
          <div className="flex items-center gap-4">
            <Gift className="w-6 h-6 text-terracotta" />
            <div>
              <div className="font-body text-charcoal">Redeem Points</div>
              <div className="font-body text-sm text-warm-gray">Browse rewards</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-warm-gray" />
        </Link>

        <Link
          href="/account/orders"
          className="flex items-center justify-between p-6 bg-warm-white border border-sand hover:border-terracotta transition-colors"
        >
          <div className="flex items-center gap-4">
            <Truck className="w-6 h-6 text-terracotta" />
            <div>
              <div className="font-body text-charcoal">Order History</div>
              <div className="font-body text-sm text-warm-gray">Track your orders</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-warm-gray" />
        </Link>

        <Link
          href="/account/referrals"
          className="flex items-center justify-between p-6 bg-warm-white border border-sand hover:border-terracotta transition-colors"
        >
          <div className="flex items-center gap-4">
            <Sparkles className="w-6 h-6 text-terracotta" />
            <div>
              <div className="font-body text-charcoal">Refer Friends</div>
              <div className="font-body text-sm text-warm-gray">Earn bonus points</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-warm-gray" />
        </Link>
      </div>

      {/* Tier Comparison */}
      <h2 className="font-display text-2xl text-charcoal mb-6" style={{ fontWeight: 300 }}>
        VIP Tiers
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {allTiers.map((tier) => (
          <div
            key={tier.id}
            className={`p-6 border ${
              progress.currentTier?.level === tier.level
                ? 'border-terracotta bg-warm-white'
                : 'border-sand bg-warm-white'
            }`}
          >
            <div className={`w-12 h-12 flex items-center justify-center mb-4 ${getTierColor(tier.level)}`}>
              {getTierIcon(tier.level)}
            </div>
            <h3 className="font-display text-xl text-charcoal mb-2" style={{ fontWeight: 300 }}>
              {tier.name}
            </h3>
            <div className="font-body text-sm text-warm-gray mb-4">
              {tier.minPoints.toLocaleString()}+ points
            </div>
            <ul className="space-y-2">
              {tier.benefits.map((benefit) => (
                <li key={benefit.id} className="flex items-center gap-2 text-sm font-body text-charcoal">
                  <Check className="w-4 h-4 text-terracotta" />
                  {benefit.name}
                </li>
              ))}
              {tier.pointsMultiplier > 1 && (
                <li className="flex items-center gap-2 text-sm font-body text-charcoal">
                  <Check className="w-4 h-4 text-terracotta" />
                  {tier.pointsMultiplier}x points
                </li>
              )}
              {tier.earlyAccess && (
                <li className="flex items-center gap-2 text-sm font-body text-charcoal">
                  <Check className="w-4 h-4 text-terracotta" />
                  Early access
                </li>
              )}
              {tier.prioritySupport && (
                <li className="flex items-center gap-2 text-sm font-body text-charcoal">
                  <Check className="w-4 h-4 text-terracotta" />
                  Priority support
                </li>
              )}
            </ul>
            {progress.currentTier?.level === tier.level && (
              <div className="mt-4 pt-4 border-t border-sand">
                <span className="text-sm font-body text-terracotta">Current tier</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* How to Earn */}
      <div className="mt-12 p-8 bg-sand border border-sand">
        <h2 className="font-display text-2xl text-charcoal mb-6" style={{ fontWeight: 300 }}>
          How to Earn Points
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="font-display text-3xl text-terracotta mb-2" style={{ fontWeight: 300 }}>
              1 point
            </div>
            <div className="font-body text-charcoal">Per $1 spent</div>
          </div>
          <div>
            <div className="font-display text-3xl text-terracotta mb-2" style={{ fontWeight: 300 }}>
              100 points
            </div>
            <div className="font-body text-charcoal">Per referred friend</div>
          </div>
          <div>
            <div className="font-display text-3xl text-terracotta mb-2" style={{ fontWeight: 300 }}>
              50 points
            </div>
            <div className="font-body text-charcoal">Product review bonus</div>
          </div>
        </div>
      </div>
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Eye, ShoppingBag, Heart, AlertTriangle, Users, TrendingUp } from 'lucide-react'

interface SocialProofData {
  totalViews: number
  recentViews: number
  totalPurchases: number
  wishlistCount: number
  inventoryCount: number
  isLowStock: boolean
  isOutOfStock: boolean
}

interface SocialProofProps {
  productId: string
}

export default function SocialProof({ productId }: SocialProofProps) {
  const [data, setData] = useState<SocialProofData | null>(null)
  const [currentViewers, setCurrentViewers] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    
    async function loadSocialProof() {
      try {
        const response = await fetch(`/api/products/${productId}/views`)
        const socialData = await response.json()
        if (mounted) {
          setData(socialData)
          setLoading(false)
        }
      } catch {
        console.error('Failed to fetch social proof')
        if (mounted) setLoading(false)
      }
    }
    
    loadSocialProof()
    
    // Simulate real-time viewers (in production, this would be via WebSocket)
    const interval = setInterval(() => {
      if (mounted) {
        setCurrentViewers(Math.floor(Math.random() * 8) + 1)
      }
    }, 30000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [productId])

  if (loading || !data) return null

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  return (
    <div className="space-y-3">
      {/* Low Stock Alert */}
      {data.isLowStock && !data.isOutOfStock && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span className="font-body text-amber-700 text-sm">
            Only <strong>{data.inventoryCount}</strong> left in stock - order soon
          </span>
        </div>
      )}

      {/* Out of Stock */}
      {data.isOutOfStock && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span className="font-body text-red-700 text-sm">
            Currently out of stock
          </span>
        </div>
      )}

      {/* Social Proof Indicators */}
      <div className="grid grid-cols-2 gap-3">
        {/* Recent Views */}
        {data.recentViews > 5 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-cream border border-sand">
            <Eye className="w-4 h-4 text-terracotta" />
            <div>
              <p className="font-body text-charcoal text-sm font-medium">
                {formatNumber(data.recentViews)}+ views
              </p>
              <p className="font-body text-warm-gray text-xs">in the last 24 hours</p>
            </div>
          </div>
        )}

        {/* Current Viewers */}
        {currentViewers > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-cream border border-sand">
            <Users className="w-4 h-4 text-terracotta" />
            <div>
              <p className="font-body text-charcoal text-sm font-medium">
                {currentViewers} people viewing
              </p>
              <p className="font-body text-warm-gray text-xs">right now</p>
            </div>
          </div>
        )}

        {/* Purchase Count */}
        {data.totalPurchases > 10 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-cream border border-sand">
            <ShoppingBag className="w-4 h-4 text-terracotta" />
            <div>
              <p className="font-body text-charcoal text-sm font-medium">
                {formatNumber(data.totalPurchases)}+ sold
              </p>
              <p className="font-body text-warm-gray text-xs">all time</p>
            </div>
          </div>
        )}

        {/* Wishlist Count */}
        {data.wishlistCount > 5 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-cream border border-sand">
            <Heart className="w-4 h-4 text-terracotta" />
            <div>
              <p className="font-body text-charcoal text-sm font-medium">
                {formatNumber(data.wishlistCount)} wishlists
              </p>
              <p className="font-body text-warm-gray text-xs">people want this</p>
            </div>
          </div>
        )}

        {/* Trending Badge */}
        {data.recentViews > 50 && data.totalPurchases > 20 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-terracotta/10 border border-terracotta/20">
            <TrendingUp className="w-4 h-4 text-terracotta" />
            <div>
              <p className="font-body text-terracotta text-sm font-medium">
                Trending now
              </p>
              <p className="font-body text-warm-gray text-xs">popular this week</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

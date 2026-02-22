'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Users, Trophy, Heart, UserPlus, AlertTriangle, Moon, UserX,
  RefreshCw, Loader2, ChevronRight, Target, Mail, TrendingUp,
  DollarSign, ShoppingCart, Clock, Sparkles
} from 'lucide-react'

interface Segment {
  id: string
  slug: string
  name: string
  description: string | null
  color: string
  iconName: string
  customerCount: number
  totalRevenue: number
  avgOrderValue: number
  memberCount: number
  campaignCount: number
}

interface Overview {
  totalCustomers: number
  analyzedCustomers: number
  avgScores: {
    recency: number
    frequency: number
    monetary: number
  }
  avgChurnRisk: number
  avgPredictedLTV: number
}

interface LifecycleDistributionItem {
  stage: string
  count: number
}

type LifecycleDistribution = LifecycleDistributionItem[]

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy,
  Heart,
  UserPlus,
  AlertTriangle,
  Moon,
  UserX,
  Users,
  Target,
  Mail,
  TrendingUp,
}

const COLOR_MAP: Record<string, string> = {
  gold: 'bg-gold/10 border-gold text-gold',
  sage: 'bg-sage/10 border-sage text-sage',
  terracotta: 'bg-terracotta/10 border-terracotta text-terracotta',
  ember: 'bg-ember/10 border-ember text-ember',
  'warm-gray': 'bg-warm-gray/10 border-warm-gray text-warm-gray',
  charcoal: 'bg-charcoal/10 border-charcoal text-charcoal',
}

const LIFECYCLE_LABELS: Record<string, string> = {
  champion: 'Champions',
  active: 'Active',
  new: 'New',
  at_risk: 'At Risk',
  churned: 'Churned',
  lost: 'Lost',
}

export default function SegmentsClient() {
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [lifecycleDistribution, setLifecycleDistribution] = useState<LifecycleDistribution>([])
  const [stats, setStats] = useState({
    totalSegments: 0,
    totalSegmented: 0,
    totalCustomers: 0,
    unassigned: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [rfmRes, segmentsRes] = await Promise.all([
        fetch('/api/admin/rfm'),
        fetch('/api/admin/segments'),
      ])

      if (rfmRes.ok) {
        const rfmData = await rfmRes.json()
        setOverview(rfmData.overview)
        setLifecycleDistribution(rfmData.lifecycleDistribution)
      }

      if (segmentsRes.ok) {
        const segmentsData = await segmentsRes.json()
        setSegments(segmentsData.segments)
        setStats(segmentsData.stats)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCalculate = async () => {
    setCalculating(true)
    try {
      // First seed default segments if needed
      await fetch('/api/admin/rfm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed-segments' }),
      })

      // Then calculate RFM
      const res = await fetch('/api/admin/rfm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'calculate' }),
      })

      if (res.ok) {
        const data = await res.json()
        console.log('RFM calculated:', data)
        await fetchData()
      }
    } catch (error) {
      console.error('Error calculating RFM:', error)
    } finally {
      setCalculating(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100)
  }

  const getIcon = (iconName: string) => {
    const Icon = ICON_MAP[iconName] || Users
    return Icon
  }

  const getColorClass = (color: string) => {
    return COLOR_MAP[color] || 'bg-sand border-warm-gray text-charcoal'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl text-charcoal" style={{ fontWeight: 400 }}>
              Customer Segmentation
            </h1>
            <p className="font-body text-warm-gray mt-1">
              RFM analysis for targeted marketing campaigns
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="px-4 py-2 border border-sand bg-warm-white font-body text-sm text-charcoal hover:border-terracotta"
            >
              Back to Dashboard
            </Link>
            <button
              onClick={handleCalculate}
              disabled={calculating}
              className="flex items-center gap-2 px-4 py-2 bg-charcoal text-cream font-body text-sm hover:bg-terracotta disabled:opacity-50"
            >
              {calculating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {calculating ? 'Analyzing...' : 'Run RFM Analysis'}
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-6 bg-warm-white border border-sand">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-terracotta" />
                <span className="font-body text-warm-gray text-sm">Total Customers</span>
              </div>
              <p className="font-display text-3xl text-charcoal">{overview.totalCustomers}</p>
              <p className="font-body text-warm-gray text-xs mt-1">
                {overview.analyzedCustomers} analyzed
              </p>
            </div>

            <div className="p-6 bg-warm-white border border-sand">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-sage" />
                <span className="font-body text-warm-gray text-sm">Avg Predicted LTV</span>
              </div>
              <p className="font-display text-3xl text-charcoal">
                {formatCurrency(overview.avgPredictedLTV)}
              </p>
            </div>

            <div className="p-6 bg-warm-white border border-sand">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-5 h-5 text-ember" />
                <span className="font-body text-warm-gray text-sm">Avg Churn Risk</span>
              </div>
              <p className="font-display text-3xl text-charcoal">
                {(overview.avgChurnRisk * 100).toFixed(0)}%
              </p>
            </div>

            <div className="p-6 bg-warm-white border border-sand">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-gold" />
                <span className="font-body text-warm-gray text-sm">RFM Score Avg</span>
              </div>
              <p className="font-display text-3xl text-charcoal">
                {overview.avgScores.recency.toFixed(1)} / {overview.avgScores.frequency.toFixed(1)} / {overview.avgScores.monetary.toFixed(1)}
              </p>
              <p className="font-body text-warm-gray text-xs mt-1">R / F / M</p>
            </div>
          </div>
        )}

        {/* Lifecycle Distribution */}
        {lifecycleDistribution.length > 0 && (
          <div className="mb-8 p-6 bg-warm-white border border-sand">
            <h2 className="font-display text-lg text-charcoal mb-4">Lifecycle Distribution</h2>
            <div className="flex flex-wrap gap-2">
              {lifecycleDistribution.map(({ stage, count }) => (
                <div
                  key={stage}
                  className="px-4 py-2 border border-sand"
                >
                  <span className="font-body text-sm text-warm-gray">{LIFECYCLE_LABELS[stage] || stage}:</span>
                  <span className="font-body text-sm text-charcoal ml-2">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Segments Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-charcoal">Customer Segments</h2>
            <span className="font-body text-sm text-warm-gray">
              {stats.totalSegmented} of {stats.totalCustomers} customers assigned
            </span>
          </div>

          {segments.length === 0 ? (
            <div className="text-center py-12 bg-warm-white border border-sand">
              <Users className="w-12 h-12 text-sand mx-auto mb-4" />
              <p className="font-body text-charcoal mb-2">No segments yet</p>
              <p className="font-body text-warm-gray text-sm mb-4">
                Run RFM Analysis to create and populate segments
              </p>
              <button
                onClick={handleCalculate}
                disabled={calculating}
                className="px-4 py-2 bg-terracotta text-cream font-body text-sm hover:bg-charcoal"
              >
                Run RFM Analysis
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {segments.map((segment) => {
                const Icon = getIcon(segment.iconName)
                const colorClass = getColorClass(segment.color)

                return (
                  <Link
                    key={segment.id}
                    href={`/admin/segments/${segment.id}`}
                    className="p-6 bg-warm-white border border-sand hover:border-terracotta transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 flex items-center justify-center border ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-sand group-hover:text-terracotta transition-colors" />
                    </div>

                    <h3 className="font-display text-lg text-charcoal mb-1">{segment.name}</h3>
                    <p className="font-body text-warm-gray text-sm line-clamp-2 mb-4">
                      {segment.description}
                    </p>

                    <div className="flex items-center gap-4 pt-4 border-t border-sand">
                      <div>
                        <p className="font-body text-warm-gray text-xs">Customers</p>
                        <p className="font-body text-charcoal">{segment.customerCount || segment.memberCount}</p>
                      </div>
                      <div>
                        <p className="font-body text-warm-gray text-xs">Revenue</p>
                        <p className="font-body text-charcoal">{formatCurrency(segment.totalRevenue)}</p>
                      </div>
                      <div>
                        <p className="font-body text-warm-gray text-xs">Avg Order</p>
                        <p className="font-body text-charcoal">{formatCurrency(segment.avgOrderValue)}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* RFM Explanation */}
        <div className="p-6 bg-warm-white border border-sand">
          <h2 className="font-display text-lg text-charcoal mb-4">Understanding RFM Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-terracotta" />
                <span className="font-body text-charcoal font-medium">Recency (R)</span>
              </div>
              <p className="font-body text-warm-gray text-sm">
                How recently a customer made a purchase. Score 1-5 (5 = most recent). 
                Recent customers are more likely to purchase again.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="w-4 h-4 text-terracotta" />
                <span className="font-body text-charcoal font-medium">Frequency (F)</span>
              </div>
              <p className="font-body text-warm-gray text-sm">
                How often a customer makes purchases. Score 1-5 (5 = most frequent).
                Frequent buyers are more engaged and loyal.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-terracotta" />
                <span className="font-body text-charcoal font-medium">Monetary (M)</span>
              </div>
              <p className="font-body text-warm-gray text-sm">
                How much a customer spends. Score 1-5 (5 = highest spend).
                High spenders contribute most to revenue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

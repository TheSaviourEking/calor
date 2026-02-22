'use client'

import { useState, useEffect } from 'react'
import { Gift, Users, Copy, Check, Share2, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export interface ReferralCode {
  id: string
  code: string
  referralCount: number
  totalEarned: number
  isActive: boolean
  createdAt: string
  referrals: Array<{
    id: string
    referredEmail: string
    status: string
    rewardType: string
    rewardAmount: number
    createdAt: string
    qualifiedAt: string | null
    rewardedAt: string | null
  }>
}

export default function ReferralsClient({ initialReferralCode }: { initialReferralCode: ReferralCode | null }) {
  const [referralCode] = useState<ReferralCode | null>(initialReferralCode)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    if (!referralCode) return
    navigator.clipboard.writeText(referralCode.code)
    setCopied(true)
    toast.success('Referral code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const shareReferral = async () => {
    if (!referralCode) return
    const shareUrl = `${window.location.origin}?ref=${referralCode.code}`
    const shareText = `Use my referral code ${referralCode.code} at CALŌR for $10 off your first order!`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CALŌR Referral',
          text: shareText,
          url: shareUrl,
        })
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      toast.success('Referral link copied!')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@')
    return `${local.substring(0, 2)}***@${domain}`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <span className="eyebrow">Earn Rewards</span>
        <h1
          className="font-display text-charcoal mt-4"
          style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 300 }}
        >
          Referral Program
        </h1>
        <p className="font-body text-warm-gray text-lg max-w-2xl mx-auto mt-4">
          Share CALŌR with friends and you both get $10 off your next order.
        </p>
      </div>

      {/* Your Code */}
      <div className="bg-warm-white p-8 border border-sand text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Gift className="w-6 h-6 text-terracotta" />
          <h2 className="font-display text-charcoal text-xl" style={{ fontWeight: 400 }}>
            Your Referral Code
          </h2>
        </div>

        {referralCode ? (
          <>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="px-8 py-4 bg-cream border-2 border-terracotta">
                <span className="font-display text-charcoal text-3xl tracking-widest" style={{ fontWeight: 400 }}>
                  {referralCode.code}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center gap-2 px-6 py-3 bg-charcoal text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Code
                  </>
                )}
              </button>
              <button
                onClick={shareReferral}
                className="inline-flex items-center gap-2 px-6 py-3 border border-sand font-body text-sm text-charcoal uppercase tracking-wider hover:border-terracotta transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </>
        ) : (
          <p className="font-body text-warm-gray">
            Unable to generate referral code. Please contact support.
          </p>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-warm-white p-8 border border-sand">
        <h2 className="font-display text-charcoal text-xl mb-6 text-center" style={{ fontWeight: 400 }}>
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-terracotta/10 flex items-center justify-center mx-auto mb-3">
              <span className="font-display text-terracotta text-xl" style={{ fontWeight: 400 }}>1</span>
            </div>
            <h3 className="font-body text-charcoal text-sm font-medium mb-2">Share Your Code</h3>
            <p className="font-body text-warm-gray text-xs">
              Send your unique referral code to friends and family.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-terracotta/10 flex items-center justify-center mx-auto mb-3">
              <span className="font-display text-terracotta text-xl" style={{ fontWeight: 400 }}>2</span>
            </div>
            <h3 className="font-body text-charcoal text-sm font-medium mb-2">Friend Gets $10 Off</h3>
            <p className="font-body text-warm-gray text-xs">
              They enter your code at checkout for $10 off their first order.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-terracotta/10 flex items-center justify-center mx-auto mb-3">
              <span className="font-display text-terracotta text-xl" style={{ fontWeight: 400 }}>3</span>
            </div>
            <h3 className="font-body text-charcoal text-sm font-medium mb-2">You Earn $10</h3>
            <p className="font-body text-warm-gray text-xs">
              When they complete their purchase, you get $10 credit.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {referralCode && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-warm-white p-6 border border-sand text-center">
            <Users className="w-8 h-8 text-terracotta mx-auto mb-3" />
            <p className="font-display text-charcoal text-3xl" style={{ fontWeight: 400 }}>
              {referralCode.referralCount}
            </p>
            <p className="font-body text-warm-gray text-sm">Total Referrals</p>
          </div>
          <div className="bg-warm-white p-6 border border-sand text-center">
            <Gift className="w-8 h-8 text-terracotta mx-auto mb-3" />
            <p className="font-display text-charcoal text-3xl" style={{ fontWeight: 400 }}>
              ${referralCode.totalEarned / 100}
            </p>
            <p className="font-body text-warm-gray text-sm">Total Earned</p>
          </div>
          <div className="bg-warm-white p-6 border border-sand text-center">
            <ExternalLink className="w-8 h-8 text-terracotta mx-auto mb-3" />
            <p className="font-display text-charcoal text-3xl" style={{ fontWeight: 400 }}>
              {referralCode.referrals.filter(r => r.status === 'pending').length}
            </p>
            <p className="font-body text-warm-gray text-sm">Pending</p>
          </div>
        </div>
      )}

      {/* Referral History */}
      {referralCode && referralCode.referrals.length > 0 && (
        <div className="bg-warm-white border border-sand overflow-hidden">
          <div className="p-6 border-b border-sand">
            <h2 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
              Referral History
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-cream">
                  <th className="text-left py-3 px-6 font-body text-warm-gray text-xs uppercase tracking-wider">
                    Referred
                  </th>
                  <th className="text-left py-3 px-6 font-body text-warm-gray text-xs uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left py-3 px-6 font-body text-warm-gray text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right py-3 px-6 font-body text-warm-gray text-xs uppercase tracking-wider">
                    Reward
                  </th>
                </tr>
              </thead>
              <tbody>
                {referralCode.referrals.map((referral) => (
                  <tr key={referral.id} className="border-b border-sand">
                    <td className="py-4 px-6 font-body text-charcoal text-sm">
                      {maskEmail(referral.referredEmail)}
                    </td>
                    <td className="py-4 px-6 font-body text-warm-gray text-sm">
                      {formatDate(referral.createdAt)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2 py-1 text-xs font-body ${referral.status === 'rewarded'
                        ? 'bg-green-100 text-green-700'
                        : referral.status === 'qualified'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-body text-charcoal text-sm text-right">
                      ${referral.rewardAmount / 100}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {referralCode && referralCode.referrals.length === 0 && (
        <div className="bg-warm-white p-8 border border-sand text-center">
          <Users className="w-12 h-12 text-sand mx-auto mb-4" />
          <h3 className="font-display text-charcoal text-lg mb-2" style={{ fontWeight: 400 }}>
            No Referrals Yet
          </h3>
          <p className="font-body text-warm-gray text-sm max-w-md mx-auto">
            Share your referral code with friends to start earning rewards. When they make their first purchase, you&apos;ll both receive $10 credit.
          </p>
        </div>
      )}
    </div>
  )
}

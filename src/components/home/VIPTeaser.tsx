'use client'

import Link from 'next/link'
import { Crown, Sparkles, Gift, Star, ArrowRight } from 'lucide-react'

const tiers = [
  { name: 'Bronze', points: '0+', color: 'bg-amber-700', benefits: 'Free shipping over $50' },
  { name: 'Silver', points: '500+', color: 'bg-gray-400', benefits: '10% bonus points' },
  { name: 'Gold', points: '2,000+', color: 'bg-yellow-500', benefits: '15% bonus + early access' },
  { name: 'Platinum', points: '5,000+', color: 'bg-gradient-to-r from-slate-600 to-slate-400', benefits: 'VIP support + 20% bonus' }
]

export default function VIPTeaser() {
  return (
    <section className="py-20 bg-gradient-to-br from-charcoal via-charcoal to-charcoal/90">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span className="font-body text-yellow-500 text-sm uppercase tracking-wider">VIP Membership</span>
            </div>
            <h2 
              className="font-display text-cream mb-4"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 300 }}
            >
              Get Rewarded for Everything
            </h2>
            <p className="font-body text-cream/70 text-lg mb-6 leading-relaxed">
              Join our VIP program and earn points on every purchase, review, and referral. 
              Unlock exclusive benefits as you climb through tiers.
            </p>

            {/* Quick Benefits */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-terracotta/20">
                  <Gift className="w-4 h-4 text-terracotta" />
                </div>
                <span className="font-body text-cream/80 text-sm">Earn points on every purchase</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-terracotta/20">
                  <Star className="w-4 h-4 text-terracotta" />
                </div>
                <span className="font-body text-cream/80 text-sm">Redeem for discounts & free products</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-terracotta/20">
                  <Sparkles className="w-4 h-4 text-terracotta" />
                </div>
                <span className="font-body text-cream/80 text-sm">Exclusive early access to sales</span>
              </div>
            </div>

            <Link
              href="/account/vip"
              className="inline-flex items-center gap-2 px-8 py-3 bg-terracotta text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta/90 transition-colors group"
            >
              Join VIP Program
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Right: Tier Cards */}
          <div className="grid grid-cols-2 gap-4">
            {tiers.map((tier, index) => (
              <div
                key={tier.name}
                className={`bg-warm-white/5 border border-warm-white/10 p-6 ${index === 3 ? 'col-span-2 sm:col-span-1' : ''}`}
              >
                <div className={`w-10 h-10 ${tier.color} mb-4 flex items-center justify-center`}>
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display text-cream text-lg mb-1" style={{ fontWeight: 400 }}>
                  {tier.name}
                </h3>
                <p className="font-body text-cream/50 text-xs uppercase tracking-wider mb-2">
                  {tier.points} points
                </p>
                <p className="font-body text-cream/70 text-sm">
                  {tier.benefits}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

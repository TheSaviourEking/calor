'use client'

import Link from 'next/link'
import { Crown, Sparkles, Gift, Star } from 'lucide-react'

const tiers = [
  { name: 'Bronze', points: '0+', benefits: 'Free shipping over $50' },
  { name: 'Silver', points: '500+', benefits: '10% bonus points' },
  { name: 'Gold', points: '2,000+', benefits: '15% bonus + early access' },
  { name: 'Platinum', points: '5,000+', benefits: 'VIP support + 20% bonus' }
]

export default function VIPTeaser() {
  return (
    <section className="py-20 lg:py-32 bg-charcoal">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <span className="w-10 h-px bg-gold/40" />
              <span className="eyebrow text-gold">VIP Membership</span>
            </div>
            <h2
              className="font-display text-cream mb-6"
              style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 300 }}
            >
              Get rewarded for everything
            </h2>
            <p className="font-body text-warm-gray text-base leading-relaxed mb-8">
              Join our VIP program and earn points on every purchase, review, and referral.
              Unlock exclusive benefits as you climb through our understated, elegant tiers.
            </p>

            {/* Quick Benefits */}
            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-4">
                <Gift className="w-5 h-5 text-gold" />
                <span className="font-body text-cream text-sm">Earn points on every purchase</span>
              </div>
              <div className="flex items-center gap-4">
                <Star className="w-5 h-5 text-gold" />
                <span className="font-body text-cream text-sm">Redeem for discounts & complimentary items</span>
              </div>
              <div className="flex items-center gap-4">
                <Sparkles className="w-5 h-5 text-gold" />
                <span className="font-body text-cream text-sm">Exclusive early access to seasonal curations</span>
              </div>
            </div>

            <Link
              href="/account/vip"
              className="inline-block border border-gold text-gold px-8 py-4 font-body text-sm tracking-wider uppercase transition-all duration-300 hover:bg-gold hover:text-charcoal"
            >
              Join VIP Program
            </Link>
          </div>

          {/* Right: Tier Cards */}
          <div className="grid grid-cols-2 gap-4 lg:gap-6">
            {tiers.map((tier, index) => (
              <div
                key={tier.name}
                className={`bg-warm-white/5 border border-warm-white/10 p-8 transition-all duration-300 hover:border-gold/50 hover:-translate-y-1 ${index === 3 ? 'col-span-2 sm:col-span-1' : ''}`}
              >
                <Crown
                  className={`w-6 h-6 mb-6 ${index > 1 ? 'text-gold' : 'text-warm-gray'}`}
                />
                <h3
                  className="font-display text-cream text-xl mb-2"
                  style={{ fontWeight: 400 }}
                >
                  {tier.name}
                </h3>
                <p className="font-body text-gold text-xs uppercase tracking-widest mb-4">
                  {tier.points} PTS
                </p>
                <p className="font-body text-warm-gray text-sm leading-relaxed">
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

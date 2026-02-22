'use client'

import Link from 'next/link'
import { 
  Sparkles, Gift, Heart, Bot, Crown, Shield, 
  Radio, Gamepad2, Box, Zap, Users, ArrowRight
} from 'lucide-react'

const highlights = [
  {
    icon: Bot,
    title: 'AI Recommendations',
    description: 'Personalized product suggestions powered by AI',
    link: '/shop',
    color: 'bg-purple-500/10'
  },
  {
    icon: Radio,
    title: 'Live Shopping',
    description: 'Watch live demos and get exclusive deals',
    link: '/live',
    color: 'bg-red-500/10'
  },
  {
    icon: Gamepad2,
    title: 'Wellness Platform',
    description: 'Track habits, earn rewards, connect with partner',
    link: '/account/wellness',
    color: 'bg-green-500/10'
  },
  {
    icon: Crown,
    title: 'VIP Rewards',
    description: '4 tiers of exclusive benefits and points',
    link: '/account/vip',
    color: 'bg-yellow-500/10'
  },
  {
    icon: Gift,
    title: 'Gift Registry',
    description: 'Create registries for any occasion',
    link: '/registry',
    color: 'bg-pink-500/10'
  },
  {
    icon: Box,
    title: 'AR Try-On',
    description: 'Experience products with virtual try-on',
    link: '/experience',
    color: 'bg-blue-500/10'
  },
  {
    icon: Shield,
    title: 'Discreet Delivery',
    description: 'Plain packaging, total privacy guaranteed',
    link: '/account/packaging',
    color: 'bg-gray-500/10'
  },
  {
    icon: Users,
    title: 'Couples Accounts',
    description: 'Link with partner for shared experience',
    link: '/account/couple',
    color: 'bg-rose-500/10'
  }
]

export default function FeaturesShowcase() {
  return (
    <section className="py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-terracotta" />
            <span className="font-body text-terracotta text-sm uppercase tracking-wider">Platform Features</span>
          </div>
          <h2 
            className="font-display text-charcoal mb-4"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 300 }}
          >
            More Than a Store
          </h2>
          <p className="font-body text-warm-gray text-lg max-w-2xl mx-auto">
            CALŌR is a complete wellness platform. Discover features designed to 
            enhance every aspect of your journey.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 mb-12">
          {highlights.map((feature) => {
            const Icon = feature.icon
            return (
              <Link
                key={feature.title}
                href={feature.link}
                className="group bg-warm-white border border-sand p-6 hover:border-terracotta/50 transition-all hover:shadow-md"
              >
                <div className={`w-12 h-12 flex items-center justify-center ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-charcoal" />
                </div>
                <h3 className="font-display text-charcoal text-base mb-1 group-hover:text-terracotta transition-colors" style={{ fontWeight: 400 }}>
                  {feature.title}
                </h3>
                <p className="font-body text-warm-gray text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Link>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/features"
            className="inline-flex items-center gap-2 px-8 py-3 bg-charcoal text-cream font-body text-sm uppercase tracking-wider hover:bg-charcoal/90 transition-colors group"
          >
            Explore All Features
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}

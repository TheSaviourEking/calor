'use client'

import Link from 'next/link'
import {
  Sparkles, Gift, Heart, Crown, Shield,
  Video, Focus, Link2
} from 'lucide-react'

const highlights = [
  {
    icon: Sparkles,
    title: 'Personalized Curation',
    description: 'Bespoke product suggestions tailored to your journey.',
    link: '/shop',
  },
  {
    icon: Video,
    title: 'Live Experiences',
    description: 'Immersive demonstrations and exclusive broadcasts.',
    link: '/live',
  },
  {
    icon: Heart,
    title: 'Wellness Platform',
    description: 'Track habits, earn rewards, and connect deeper.',
    link: '/account/wellness',
  },
  {
    icon: Crown,
    title: 'VIP Rewards',
    description: 'Four tiers of exclusive benefits and elevated service.',
    link: '/account/vip',
  },
  {
    icon: Gift,
    title: 'Gift Registry',
    description: 'Curate wishlists for any occasion or celebration.',
    link: '/registry',
  },
  {
    icon: Focus,
    title: 'Virtual Try-On',
    description: 'Experience products through augmented reality.',
    link: '/experience',
  },
  {
    icon: Shield,
    title: 'Absolute Privacy',
    description: 'Plain packaging and discreet billing, guaranteed.',
    link: '/account/packaging',
  },
  {
    icon: Link2,
    title: 'Couples Accounts',
    description: 'Link profiles for a shared intimate experience.',
    link: '/account/couple',
  }
]

export default function FeaturesShowcase() {
  return (
    <section className="py-20 lg:py-32 bg-cream">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="w-10 h-px bg-terracotta/40" />
            <span className="eyebrow">Platform Features</span>
            <span className="w-10 h-px bg-terracotta/40" />
          </div>
          <h2
            className="font-display text-charcoal mb-4"
            style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 300 }}
          >
            More than a store
          </h2>
          <p className="font-body text-warm-gray text-lg max-w-2xl mx-auto">
            CALŌR is a complete wellness platform. Discover features designed to
            enhance every aspect of your intimate life.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {highlights.map((feature) => {
            const Icon = feature.icon
            return (
              <Link
                key={feature.title}
                href={feature.link}
                className="group block bg-warm-white p-8 border border-sand hover:border-terracotta transition-all duration-300 hover:-translate-y-1"
              >
                <Icon className="w-8 h-8 text-terracotta/60 mb-6 group-hover:text-terracotta transition-colors" />
                <h3
                  className="font-display text-charcoal text-lg mb-2"
                  style={{ fontWeight: 400 }}
                >
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
            className="inline-block border border-charcoal text-charcoal px-8 py-4 font-body text-sm tracking-wider uppercase transition-all duration-300 hover:bg-charcoal hover:text-cream"
          >
            Explore All Features
          </Link>
        </div>
      </div>
    </section>
  )
}

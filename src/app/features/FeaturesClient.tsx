'use client'

import Link from 'next/link'
import ClientWrapper from '@/components/layout/ClientWrapper'
import {
  Sparkles, Gift, Heart, Camera, Crown, Shield,
  Package, Users, Video, Focus,
  Star, Radio, Calendar, Target, MessageSquare,
  ChevronRight, HeartHandshake,
  Activity, Zap, User, Link2
} from 'lucide-react'

const featureCategories = [
  {
    title: 'Shopping Experience',
    description: 'A seamless, personalized journey tailored to your intimate needs.',
    features: [
      {
        icon: Sparkles,
        title: 'AI Curation',
        description: 'Personalized product suggestions based on your unique preferences and browsing behavior.',
        link: '/shop',
        badge: 'Intelligence'
      },
      {
        icon: Focus,
        title: 'Virtual Try-On',
        description: 'Experience products virtually with high-fidelity augmented reality and 360° detail.',
        link: '/experience',
        badge: 'Experience'
      },
      {
        icon: Link2,
        title: 'Product Comparison',
        description: 'Compare products side-by-side to find the perfect addition to your collection.',
        link: '/shop',
        badge: null
      },
      {
        icon: Star,
        title: 'Intimacy Quiz',
        description: 'Our thoughtful quiz guides you to discoveries tailored to your personal goals.',
        link: '/quiz',
        badge: 'Curated'
      },
      {
        icon: Zap,
        title: 'Member Access',
        description: 'Exclusive limited-time access to new releases and special inventory.',
        link: '/shop',
        badge: 'Priority'
      },
      {
        icon: Package,
        title: 'Curated Bundles',
        description: 'Thematically paired sets designed for seamless exploration and value.',
        link: '/shop/bundles',
        badge: 'Sets'
      }
    ]
  },
  {
    title: 'Wellness Platform',
    description: 'Tools for connection, reflection, and habit-building.',
    features: [
      {
        icon: Activity,
        title: 'Daily Reflection',
        description: 'Track your wellness journey with mindful daily check-ins and insights.',
        link: '/account/wellness',
        badge: 'Wellness'
      },
      {
        icon: Heart,
        title: 'Connection Score',
        description: 'Build intimacy with your partner through shared goals and synchronised tracking.',
        link: '/account/couple',
        badge: 'Partners'
      },
      {
        icon: Video,
        title: 'Smart Integration',
        description: 'Connect and control your compatible devices with precision and privacy.',
        link: '/account/toys',
        badge: 'Technology'
      },
      {
        icon: Calendar,
        title: 'Wellness Calendar',
        description: 'A visual map of your progress and upcoming milestones in your journey.',
        link: '/account/wellness',
        badge: null
      },
      {
        icon: HeartHandshake,
        title: 'Guided Sessions',
        description: 'Access library of expert-led sessions for every mood and intention.',
        link: '/account/wellness',
        badge: 'Expertise'
      },
      {
        icon: Target,
        title: 'Personal Goals',
        description: 'Set and achieve personal connection milestones at your own pace.',
        link: '/account/wellness',
        badge: null
      }
    ]
  },
  {
    title: 'Loyalty & Recognition',
    description: 'Understated rewards for our most dedicated community members.',
    features: [
      {
        icon: Crown,
        title: 'VIP Tiers',
        description: 'Unlock higher levels of service as you progress from Bronze to Platinum.',
        link: '/account/vip',
        badge: 'Membership'
      },
      {
        icon: Sparkles,
        title: 'Points & Privilege',
        description: 'Accumulate points through engagements and redeem for exclusive experiences.',
        link: '/account/vip',
        badge: 'Rewards'
      },
      {
        icon: Gift,
        title: 'Private Store',
        description: 'A collection of rare items and rewards available only via tier points.',
        link: '/account/rewards',
        badge: 'Exclusive'
      },
      {
        icon: Users,
        title: 'The Table',
        description: 'Refer those you care about and share the Calor experience with mutual benefits.',
        link: '/account/referrals',
        badge: 'Referrals'
      }
    ]
  },
  {
    title: 'Gifting & Registry',
    description: 'Elevated ways to celebrate milestones and connections.',
    features: [
      {
        icon: Gift,
        title: 'Gift Registry',
        description: 'Beautifully managed lists for weddings, anniversaries, and milestones.',
        link: '/registry',
        badge: 'Planning'
      },
      {
        icon: Users,
        title: 'Collective Gifting',
        description: 'Coordinate with others to contribute toward meaningful, high-value gifts.',
        link: '/registry',
        badge: 'Shared'
      },
      {
        icon: Star,
        title: 'Digital Gifts',
        description: 'Instant, personalized digital tokens of appreciation and care.',
        link: '/gift-cards',
        badge: null
      },
      {
        icon: Heart,
        title: 'Curated Wishlists',
        description: 'Maintain and share elegant lists of desired products with those you trust.',
        link: '/account/wishlist',
        badge: null
      }
    ]
  },
  {
    title: 'Privacy & Care',
    description: 'Your security and peace of mind are our primary focus.',
    features: [
      {
        icon: Shield,
        title: 'Absolute Privacy',
        description: 'Unbranded, discreet packaging and billing for complete peace of mind.',
        link: '/account/packaging',
        badge: 'Discreet'
      },
      {
        icon: Shield,
        title: 'Secure Operations',
        description: 'End-to-end encryption for all transactions and payment methods.',
        link: '/checkout',
        badge: 'Protected'
      },
      {
        icon: Shield,
        title: 'Access Control',
        description: 'Robust session management and granular controls over your data.',
        link: '/account/sessions',
        badge: null
      },
      {
        icon: Package,
        title: 'Seamless Care',
        description: 'A dedicated portal for hassle-free returns and ongoing support.',
        link: '/returns',
        badge: 'Support'
      }
    ]
  }
]

const stats = [
  { label: 'Curated Products', value: '500+' },
  { label: 'Intuitive Features', value: '90+' },
  { label: 'Trusted Community', value: '10K+' },
  { label: 'Global Reach', value: '50+' },
]

export default function FeaturesClient() {
  return (
    <ClientWrapper>
      <div className="min-h-screen bg-cream">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden bg-warm-white">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-cream/30 -skew-x-12 translate-x-1/4 pointer-events-none" />
          <div className="container relative max-w-6xl mx-auto px-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-4 mb-8">
                <span className="w-10 h-px bg-terracotta/40" />
                <span className="eyebrow text-terracotta">Capabilities</span>
              </div>
              <h1 className="font-display text-charcoal mb-8" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 300, lineHeight: 1.1 }}>
                Designed for <span className="italic text-terracotta">intimacy</span>.
                <br />Built for trust.
              </h1>
              <p className="font-body text-warm-gray text-lg mb-10 leading-relaxed max-w-xl">
                CALŌR merges advanced technology with elegant design to create a platform that respects your journey. Every feature is a deliberate step toward an elevated experience.
              </p>
              <div className="flex flex-wrap gap-6">
                <Link
                  href="/shop"
                  className="px-10 py-4 bg-charcoal text-cream font-body text-xs uppercase tracking-[0.2em] transition-all hover:bg-charcoal/90"
                >
                  Explore Collection
                </Link>
                <Link
                  href="/quiz"
                  className="px-10 py-4 border border-sand text-charcoal font-body text-xs uppercase tracking-[0.2em] transition-all hover:bg-cream"
                >
                  Take the Quiz
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <div className="border-y border-sand bg-warm-white/30 py-12">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center md:text-left">
                  <p className="font-display text-charcoal text-3xl mb-1" style={{ fontWeight: 300 }}>
                    {stat.value}
                  </p>
                  <span className="font-body text-warm-gray text-[10px] uppercase tracking-[0.2em]">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Categories */}
        <div className="max-w-6xl mx-auto px-6 py-24 lg:py-32">
          {featureCategories.map((category, idx) => (
            <div key={category.title} className={idx > 0 ? 'mt-32' : ''}>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="w-10 h-px bg-sand" />
                    <span className="eyebrow text-warm-gray">{category.title}</span>
                  </div>
                  <h2 className="font-display text-charcoal text-3xl md:text-4xl" style={{ fontWeight: 300 }}>
                    {category.description}
                  </h2>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8">
                {category.features.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <Link
                      key={feature.title}
                      href={feature.link}
                      className="group block"
                    >
                      <div className="bg-warm-white p-8 border border-sand transition-all duration-300 group-hover:border-terracotta/40 group-hover:-translate-y-1 group-hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.05)]">
                        <div className="flex justify-between items-start mb-8">
                          <div className="p-3 bg-cream/50 rounded-full group-hover:bg-terracotta/5 transition-colors">
                            <Icon className="w-6 h-6 text-terracotta/60 group-hover:text-terracotta transition-colors" />
                          </div>
                          {feature.badge && (
                            <span className="px-3 py-1 bg-cream border border-sand text-[9px] font-body uppercase tracking-wider text-charcoal/60">
                              {feature.badge}
                            </span>
                          )}
                        </div>
                        <h3 className="font-display text-charcoal text-xl mb-3" style={{ fontWeight: 400 }}>
                          {feature.title}
                        </h3>
                        <p className="font-body text-warm-gray text-sm leading-relaxed mb-6">
                          {feature.description}
                        </p>
                        <div className="flex items-center gap-2 text-terracotta/60 font-body text-[10px] uppercase tracking-widest group-hover:text-terracotta group-hover:gap-3 transition-all">
                          <span>Learn more</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <section className="py-24 lg:py-32 bg-charcoal">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className="w-10 h-px bg-gold/40" />
              <span className="eyebrow text-gold">Join the Community</span>
              <span className="w-10 h-px bg-gold/40" />
            </div>
            <h2 className="font-display text-cream mb-8" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 300, lineHeight: 1.2 }}>
              Ready to experience <br />the Calor difference?
            </h2>
            <p className="font-body text-cream/60 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
              Create your account today and gain access to our full suite of personalized wellness tools and exclusive member features.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link
                href="/account"
                className="px-12 py-4 bg-terracotta text-cream font-body text-xs uppercase tracking-[0.2em] transition-all hover:bg-terracotta/90"
              >
                Create Account
              </Link>
              <Link
                href="/quiz"
                className="px-12 py-4 border border-cream/20 text-cream font-body text-xs uppercase tracking-[0.2em] transition-all hover:bg-cream/10"
              >
                Intimacy Quiz
              </Link>
            </div>
          </div>
        </section>
      </div>
    </ClientWrapper>
  )
}

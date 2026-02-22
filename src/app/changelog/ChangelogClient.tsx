'use client'

import { useState } from 'react'
import Link from 'next/link'
import ClientWrapper from '@/components/layout/ClientWrapper'
import { 
  Sparkles, Gift, Heart, Bot, Crown, Shield, 
  Package, Video, Gamepad2, Box,
  ChevronDown, ChevronUp, Calendar, Star, Zap
} from 'lucide-react'

interface ChangelogEntry {
  version: string
  date: string
  title: string
  description: string
  type: 'major' | 'minor' | 'patch'
  icon: React.ComponentType<{ className?: string }>
  features: string[]
  improvements: string[]
  fixes: string[]
}

const changelogData: ChangelogEntry[] = [
  {
    version: '2.3.0',
    date: 'February 22, 2026',
    title: 'Checkout Enhancements & Sharing',
    description: 'Use loyalty points at checkout, easier address entry, live stock updates, and share your wishlist with friends.',
    type: 'minor',
    icon: Zap,
    features: [
      'Redeem loyalty points at checkout (100 points = $1 off)',
      'Smart address suggestions for faster checkout',
      'Real-time stock indicators on product pages',
      'Share your wishlist with a public link',
      'Get notified when out-of-stock items return'
    ],
    improvements: [
      'Easy slider to choose how many points to use',
      'Low stock warnings so you can grab items fast',
      'See how many times your shared wishlist was viewed'
    ],
    fixes: []
  },
  {
    version: '2.1.1',
    date: 'February 18, 2026',
    title: 'Better Navigation Experience',
    description: 'Improved menus and navigation across all sections for a smoother experience.',
    type: 'patch',
    icon: Shield,
    features: [
      'Consistent navigation menus everywhere',
      'Better mobile menu experience',
      'Active page highlighting'
    ],
    improvements: [
      'Unified sidebar design across all sections',
      'Mobile-friendly overlay menus'
    ],
    fixes: [
      'Fixed navigation issues on several pages',
      'Fixed missing menus on mobile devices'
    ]
  },
  {
    version: '2.1.0',
    date: 'February 15, 2026',
    title: 'Gift Registry & Event Lists',
    description: 'Create beautiful gift registries for weddings, anniversaries, birthdays, and special occasions.',
    type: 'major',
    icon: Gift,
    features: [
      'Wedding, Anniversary, Birthday, Baby Shower registries',
      '5 beautiful themes to choose from',
      'Password protection for private registries',
      'Group gifting - friends can chip in together',
      'Thank you notes tracking',
      'Share links with progress tracking',
      'Mark items as "Must Have" or by priority'
    ],
    improvements: [
      'Easy sharing with friends and family',
      'See what has been purchased'
    ],
    fixes: []
  },
  {
    version: '2.0.0',
    date: 'February 12, 2026',
    title: 'Interactive Product Experience',
    description: 'Explore products in new ways with AR try-on, 3D viewing, and detailed previews.',
    type: 'major',
    icon: Box,
    features: [
      'Virtual Try-On with your camera',
      '3D Product Viewer with 360° rotation',
      'Product customizer for colors and options',
      'Sensory previews showing texture and feel',
      'Size visualizer comparing to everyday objects',
      'Interactive step-by-step guides',
      'Side-by-side product comparison'
    ],
    improvements: [
      'Full touch and mobile support',
      'Improved product image galleries'
    ],
    fixes: [
      'Improved image loading speed'
    ]
  },
  {
    version: '1.9.0',
    date: 'February 8, 2026',
    title: 'Wellness Platform & Smart Features',
    description: 'Complete wellness ecosystem with gamification, achievements, and couple experiences.',
    type: 'major',
    icon: Gamepad2,
    features: [
      'Daily Check-in with streak tracking',
      '7-Day Reward Calendar',
      'Achievement badges with tiers',
      'Challenge system with progress tracking',
      'Couple shared goals and connection scores',
      'Smart device integration',
      'Session tracking with loyalty points'
    ],
    improvements: [
      'Earn 5 loyalty points per minute during sessions',
      'Visual pattern library'
    ],
    fixes: []
  },
  {
    version: '1.8.0',
    date: 'February 5, 2026',
    title: 'Videos & Social Sign-In',
    description: 'Watch product videos and sign in easily with Google or Apple.',
    type: 'minor',
    icon: Video,
    features: [
      'Product video galleries',
      'YouTube and Vimeo video support',
      'Sign in with Google',
      'Sign in with Apple',
      'Video thumbnails with duration',
      'Quiz results can be added to cart'
    ],
    improvements: [
      'Combined media gallery for images and videos',
      'Auto-play for video previews'
    ],
    fixes: [
      'Quiz recommendations now add directly to cart'
    ]
  },
  {
    version: '1.7.0',
    date: 'February 1, 2026',
    title: 'AI & Personalization',
    description: 'Personalized product recommendations, AI chatbot support, and enhanced VIP loyalty program.',
    type: 'major',
    icon: Bot,
    features: [
      'AI-powered product recommendations',
      'AI Support Chatbot for quick help',
      'VIP Membership Tiers (Bronze, Silver, Gold, Platinum)',
      'Points Redemption Store',
      'Personalized suggestions based on preferences'
    ],
    improvements: [
      'Floating chat button available on all pages',
      '4 VIP tiers with exclusive benefits',
      'More ways to earn points'
    ],
    fixes: [
      'Order confirmation emails sent reliably'
    ]
  },
  {
    version: '1.6.0',
    date: 'January 28, 2026',
    title: 'Support System',
    description: 'New support ticket system for better customer service experience.',
    type: 'minor',
    icon: Crown,
    features: [
      'Create support tickets easily',
      'Track ticket status and history',
      'Get help from our support team',
      'Quick responses with SLA targets'
    ],
    improvements: [
      'Better ticket categorization',
      'Faster response times'
    ],
    fixes: []
  },
  {
    version: '1.5.0',
    date: 'January 24, 2026',
    title: 'Returns & Couples Accounts',
    description: 'Easy returns portal, couples account linking, and discreet packaging options.',
    type: 'major',
    icon: Package,
    features: [
      'Returns Portal with easy item selection',
      'Multiple refund options (original payment, store credit, exchange)',
      'Link accounts with your partner',
      'Shared wishlist and orders for couples',
      'Discreet packaging preferences',
      'Custom delivery instructions'
    ],
    improvements: [
      'Track return status',
      'Partner invitation system'
    ],
    fixes: []
  },
  {
    version: '1.4.0',
    date: 'January 20, 2026',
    title: 'Security & Account Management',
    description: 'Enhanced security with password reset, email verification, and session management.',
    type: 'minor',
    icon: Shield,
    features: [
      'Password Reset via email',
      'Email Verification for account security',
      'Session management - see where you are logged in',
      'Security alert notifications'
    ],
    improvements: [
      'Better stock availability before ordering',
      'Improved account security'
    ],
    fixes: [
      'Guest orders now tracked properly'
    ]
  },
  {
    version: '1.3.0',
    date: 'January 15, 2026',
    title: 'Content & Guides',
    description: 'Blog section, size guides, and product comparison tools for informed decisions.',
    type: 'minor',
    icon: Star,
    features: [
      'Blog/Magazine section with articles',
      'Size/Fit Guide with measurement tips',
      'Product Comparison (up to 4 products)',
      'Author profiles on blog posts',
      'Estimated read time for articles'
    ],
    improvements: [
      'Better SEO for blog posts',
      'Per-product fit recommendations'
    ],
    fixes: []
  },
  {
    version: '1.2.0',
    date: 'January 10, 2026',
    title: 'Marketing & Promotions',
    description: 'Flash sales, promo codes, product bundles, and referral program.',
    type: 'minor',
    icon: Zap,
    features: [
      'Flash Sales with countdown timers',
      'Promo Codes for discounts',
      'Product Bundles with savings',
      'Referral Program ($10 credit for you and friends)',
      'Promo code validation at checkout'
    ],
    improvements: [
      'Category-specific promotions',
      'Bundle discounts automatically applied'
    ],
    fixes: []
  },
  {
    version: '1.1.0',
    date: 'January 5, 2026',
    title: 'Customer Care',
    description: 'Product reviews, social proof, gift cards, and cart recovery.',
    type: 'minor',
    icon: Heart,
    features: [
      'Product Reviews & Ratings',
      'Review helpfulness voting',
      'Social Proof indicators (popular items)',
      'Digital Gift Cards',
      'Price Drop and Stock Alerts'
    ],
    improvements: [
      'Better review moderation',
      '10% discount for abandoned cart recovery'
    ],
    fixes: []
  },
  {
    version: '1.0.0',
    date: 'January 1, 2026',
    title: 'Foundation Launch',
    description: 'Initial platform launch with core shopping functionality.',
    type: 'major',
    icon: Sparkles,
    features: [
      'Product catalog with categories',
      'Shopping cart and secure checkout',
      'Multiple payment methods (Card, Crypto, Bank)',
      'Customer accounts and authentication',
      'Loyalty points system',
      'Wishlist functionality',
      'Age verification',
      'Responsive design for all devices'
    ],
    improvements: [],
    fixes: []
  }
]

const typeStyles = {
  major: 'bg-terracotta text-cream',
  minor: 'bg-charcoal text-cream',
  patch: 'bg-sand text-charcoal'
}

const typeLabels = {
  major: 'Major Release',
  minor: 'Feature Update',
  patch: 'Improvements'
}

export default function ChangelogClient() {
  const [expandedVersions, setExpandedVersions] = useState<string[]>(['2.3.0', '2.1.1', '2.1.0', '2.0.0'])

  const toggleVersion = (version: string) => {
    setExpandedVersions(prev => 
      prev.includes(version) 
        ? prev.filter(v => v !== version)
        : [...prev, version]
    )
  }

  const expandAll = () => {
    setExpandedVersions(changelogData.map(entry => entry.version))
  }

  const collapseAll = () => {
    setExpandedVersions([])
  }

  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20 bg-cream">
        {/* Hero */}
        <div className="bg-gradient-to-br from-sand/50 via-cream to-terracotta/10 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-terracotta" />
              <span className="font-body text-warm-gray text-sm uppercase tracking-wider">Product Updates</span>
            </div>
            <h1 
              className="font-display text-charcoal mb-4"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 300 }}
            >
              Changelog
            </h1>
            <p className="font-body text-warm-gray text-lg max-w-2xl">
              Track our progress and see what&apos;s new. We&apos;re constantly improving 
              your wellness shopping experience with new features and enhancements.
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-charcoal py-6">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="font-display text-cream text-2xl" style={{ fontWeight: 300 }}>
                  {changelogData.length}
                </p>
                <p className="font-body text-cream/60 text-xs uppercase tracking-wider">Releases</p>
              </div>
              <div>
                <p className="font-display text-cream text-2xl" style={{ fontWeight: 300 }}>
                  {changelogData.filter(e => e.type === 'major').length}
                </p>
                <p className="font-body text-cream/60 text-xs uppercase tracking-wider">Major Updates</p>
              </div>
              <div>
                <p className="font-display text-cream text-2xl" style={{ fontWeight: 300 }}>
                  {changelogData.reduce((acc, e) => acc + e.features.length, 0)}+
                </p>
                <p className="font-body text-cream/60 text-xs uppercase tracking-wider">Features</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <p className="font-body text-warm-gray text-sm">
              All changes from v1.0.0 to present
            </p>
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="px-4 py-2 border border-sand font-body text-xs text-charcoal hover:border-terracotta transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-4 py-2 border border-sand font-body text-xs text-charcoal hover:border-terracotta transition-colors"
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>

        {/* Changelog Entries */}
        <div className="max-w-4xl mx-auto px-6 pb-16">
          <div className="space-y-4">
            {changelogData.map((entry) => {
              const Icon = entry.icon
              const isExpanded = expandedVersions.includes(entry.version)
              
              return (
                <div key={entry.version} className="bg-warm-white border border-sand overflow-hidden">
                  {/* Header */}
                  <button
                    onClick={() => toggleVersion(entry.version)}
                    className="w-full p-6 text-left hover:bg-sand/10 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 flex items-center justify-center ${typeStyles[entry.type]}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className="font-mono text-terracotta text-sm">v{entry.version}</span>
                          <span className={`px-2 py-0.5 text-xs font-body ${typeStyles[entry.type]}`}>
                            {typeLabels[entry.type]}
                          </span>
                          <span className="font-body text-warm-gray text-xs">{entry.date}</span>
                        </div>
                        <h2 
                          className="font-display text-charcoal mb-1"
                          style={{ fontSize: '1.25rem', fontWeight: 400 }}
                        >
                          {entry.title}
                        </h2>
                        <p className="font-body text-warm-gray text-sm line-clamp-2">
                          {entry.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0 pt-2">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-warm-gray" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-warm-gray" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-sand p-6 bg-cream/30">
                      {entry.features.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-body text-charcoal text-sm font-medium mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-terracotta" />
                            New Features
                          </h4>
                          <ul className="grid md:grid-cols-2 gap-2">
                            {entry.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2 font-body text-warm-gray text-sm">
                                <span className="text-terracotta mt-1">•</span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {entry.improvements.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-body text-charcoal text-sm font-medium mb-3 flex items-center gap-2">
                            <Crown className="w-4 h-4 text-charcoal" />
                            Improvements
                          </h4>
                          <ul className="space-y-1">
                            {entry.improvements.map((improvement, idx) => (
                              <li key={idx} className="flex items-start gap-2 font-body text-warm-gray text-sm">
                                <span className="text-charcoal mt-1">+</span>
                                {improvement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {entry.fixes.length > 0 && (
                        <div>
                          <h4 className="font-body text-charcoal text-sm font-medium mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-green-600" />
                            Fixes
                          </h4>
                          <ul className="space-y-1">
                            {entry.fixes.map((fix, idx) => (
                              <li key={idx} className="flex items-start gap-2 font-body text-warm-gray text-sm">
                                <span className="text-green-600 mt-1">✓</span>
                                {fix}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="bg-charcoal py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 
              className="font-display text-cream mb-4"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 300 }}
            >
              Ready to experience CALŌR?
            </h2>
            <p className="font-body text-cream/70 mb-8 max-w-lg mx-auto">
              Join thousands of customers who trust us for their wellness journey. 
              Explore our curated collection today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/shop"
                className="px-8 py-3 bg-terracotta text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta/90 transition-colors"
              >
                Shop Now
              </Link>
              <Link
                href="/our-story"
                className="px-8 py-3 border border-cream text-cream font-body text-sm uppercase tracking-wider hover:bg-cream hover:text-charcoal transition-colors"
              >
                Our Story
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ClientWrapper>
  )
}

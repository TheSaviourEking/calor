'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Sparkles, Gift, Heart, Camera, Bot, Crown, Shield, 
  Package, Users, BarChart3, Video, Gamepad2, Box,
  ChevronDown, ChevronUp, Calendar, Star, Zap, Globe,
  Database, Server, Code, FileText
} from 'lucide-react'

interface ChangelogEntry {
  version: string
  date: string
  title: string
  description: string
  type: 'major' | 'minor' | 'patch' | 'internal'
  icon: React.ComponentType<{ className?: string }>
  features: string[]
  improvements: string[]
  fixes: string[]
  technical?: string[]
  apis?: number
  models?: number
}

const changelogData: ChangelogEntry[] = [
  {
    version: '2.3.0',
    date: 'February 22, 2026',
    title: 'Checkout Enhancements & Sharing',
    description: 'Points redemption at checkout, address autocomplete, real-time stock updates, and wishlist public sharing.',
    type: 'minor',
    icon: Zap,
    features: [
      'Loyalty Points redemption at checkout (100 pts = $1)',
      'Google Places address autocomplete for shipping',
      'Real-time stock indicators on product pages',
      'Product availability calendar with restock dates',
      'Wishlist public sharing with unique links',
      "Notify me when back in stock functionality"
    ],
    improvements: [
      'Points slider for easy amount selection',
      'Keyboard navigation for address dropdown',
      'Low stock warnings (5 or less remaining)',
      'Copy/share wishlist links',
      'View count tracking for shared wishlists'
    ],
    fixes: [],
    technical: [
      'POST /api/checkout/loyalty-points - Fetch available points',
      'GET/POST /api/address/autocomplete - Google Places suggestions',
      'GET/POST /api/address/details - Full address lookup',
      'GET/POST /api/products/stock - Stock status endpoint',
      'POST /api/wishlist/share - Create shared wishlist',
      'GET /api/wishlist/shared - Fetch by share code',
      'SharedWishlist model added to Prisma schema'
    ],
    apis: 125,
    models: 118
  },
  {
    version: '2.2.0',
    date: 'February 20, 2026',
    title: 'Developer Tools & Pitch Deck',
    description: 'Developer documentation, environment configuration, mini services guide, and downloadable investor pitch deck.',
    type: 'internal',
    icon: Code,
    features: [
      'Environment variables documentation (.env.example)',
      'Mini services documentation with WebSocket guides',
      'Downloadable investor pitch deck PDF (15 slides)',
      'Pitch deck API endpoint for PDF generation',
      'Updated /pitch page with PDF download button'
    ],
    improvements: [
      'Comprehensive env variable list with categories',
      'Mini services architecture diagram and port mapping',
      'WebSocket event documentation for live stream & support chat',
      'Brand-colored PDF with 119 APIs, 117 models stats'
    ],
    fixes: [],
    technical: [
      'GET /api/pitch-deck - Generate PDF pitch deck',
      'WebSocket service on port 3003 for live streaming',
      'WebSocket service on port 3004 for support chat',
      '.env.example with all required environment variables'
    ],
    apis: 119,
    models: 117
  },
  {
    version: '2.1.1',
    date: 'February 18, 2026',
    title: 'UI Consistency & Layout Fixes',
    description: 'Major UI/UX improvements with consistent sidebar navigation across all dashboard sections and critical bug fixes.',
    type: 'patch',
    icon: Shield,
    features: [
      'Consistent sidebar navigation for Admin dashboard',
      'Consistent sidebar navigation for Account section',
      'New sidebar navigation for Gift Registry management',
      'New sidebar navigation for Host Studio section',
      'Responsive mobile menu on all dashboard sections'
    ],
    improvements: [
      'Removed redundant "Back to account" links (sidebar provides navigation)',
      'Unified charcoal sidebar theme for Admin and Host sections',
      'Unified warm-white sidebar theme for Account and Registry sections',
      'Active state highlighting on all navigation items',
      'Mobile-friendly overlay menus with close functionality'
    ],
    fixes: [
      'Fixed broken AccountLayout import in RegistryDashboard (was causing build errors)',
      'Fixed broken AccountLayout import in ManageRegistryClient',
      'Fixed missing sidebar on /admin/products, /admin/orders, /admin/analytics pages',
      'Fixed missing sidebar on /account/orders, /account/wishlist, /account/vip pages',
      'Fixed missing sidebar on /host/dashboard and /host/streams/new pages',
      'Fixed ESLint error: calling setState synchronously within useEffect',
      'Changed to use isLoading from auth store instead of local mounted state'
    ],
    apis: 119,
    models: 117
  },
  {
    version: '2.1.0',
    date: 'February 15, 2026',
    title: 'Premium Gift Registry & Events',
    description: 'Create beautiful gift registries for weddings, anniversaries, birthdays, and special occasions with group gifting support.',
    type: 'major',
    icon: Gift,
    features: [
      'Wedding, Anniversary, Birthday, Baby Shower, and Custom registry types',
      '5 beautiful themes (Classic, Romantic, Modern, Minimalist, Bold)',
      'Privacy controls with password-protected registries',
      'Group gifting with partial contributions',
      'Thank you notes tracking and management',
      'Event timeline with multiple events per registry',
      'Share links with progress tracking',
      'Item priority levels (Must Have, High, Medium, Low)',
      'Public registry page with category filtering',
      'Registry dashboard with stats and management'
    ],
    improvements: [
      'Added Gift Registry link to Account Navigation',
      'Created 7 new API endpoints for registry management'
    ],
    fixes: [],
    technical: [
      'Registry, RegistryItem, RegistryEvent, RegistryGuest models',
      'GroupContribution model for partial payments',
      'ThankYouNote model for tracking',
      'GET/POST /api/registry - List/create registries',
      'GET/PUT/DELETE /api/registry/[id] - CRUD operations',
      'POST /api/registry/[id]/items - Add items',
      'POST /api/registry/[id]/events - Add events',
      'POST /api/registry/[id]/purchases - Record purchases'
    ],
    apis: 112,
    models: 110
  },
  {
    version: '2.0.0',
    date: 'February 12, 2026',
    title: 'Interactive Product Experience Hub',
    description: 'Explore products like never before with AR try-on, 3D viewing, interactive guides, and sensory previews.',
    type: 'major',
    icon: Box,
    features: [
      'Virtual Try-On with real-time camera AR',
      '3D Product Viewer with 360° rotation and hotspots',
      'Product Configurator for customization',
      'Sensory Preview showing texture, vibration profiles',
      'Size Visualizer comparing to everyday objects',
      'Interactive Step-by-Step Guides with timers',
      'Experience Gallery for community stories',
      'Product Comparison side-by-side view'
    ],
    improvements: [
      '8 new experience components in /components/experience/',
      '6 new API endpoints for experience data',
      'Full touch and mobile support for 3D viewer'
    ],
    fixes: [
      'Improved image loading in product galleries'
    ],
    technical: [
      'Product3DModel, ProductHotspot models',
      'ProductConfiguration, SavedConfiguration models',
      'ProductExperience, ExperienceLike, ExperienceComment models',
      'SensoryProfile, SizeVisualization, ProductFeature models',
      'GET/POST /api/experience/configurations',
      'GET/POST /api/experience/experiences',
      'GET/POST /api/experience/sensory',
      'GET/POST /api/experience/size-visualizer',
      'GET/POST /api/experience/features',
      'GET/POST /api/experience/3d-models'
    ],
    apis: 105,
    models: 100
  },
  {
    version: '1.9.0',
    date: 'February 8, 2026',
    title: 'Wellness Platform & Smart Toys',
    description: 'Complete wellness ecosystem with smart toy management, gamification, and couple experiences.',
    type: 'major',
    icon: Gamepad2,
    features: [
      'Smart Toy Management dashboard',
      'Custom Vibration Pattern Creator with visual editor',
      'Real-time Control Panel with intensity controls',
      'Partner Play Mode for remote control',
      'Session Analytics with loyalty points',
      'Daily Check-in with streak tracking',
      '7-Day Reward Calendar visualization',
      'Achievement/Badge System with tiers',
      'Challenge System with progress tracking',
      'Couple Shared Goals and connection scores'
    ],
    improvements: [
      'Wellness Dashboard as highlighted Account item',
      'Pattern library with visual waveforms',
      '5pts/min loyalty points for toy sessions'
    ],
    fixes: [],
    technical: [
      'SmartToyBrand, SmartToyModel, CustomerSmartToy models',
      'VibrationPattern, ToySession models',
      'DailyCheckIn, UserStreak, Achievement, UserAchievement models',
      'Challenge, ChallengeCompletion, DailyReward models',
      'CoupleGoal, CoupleMilestone, ConnectionScore models',
      'WellnessEntry, WellnessProfile, LeaderboardEntry models',
      'GET/POST/PUT/DELETE /api/wellness/toys',
      'GET/POST/PUT/DELETE /api/wellness/patterns',
      'GET/POST/PUT /api/wellness/sessions',
      'GET/POST /api/wellness/checkin',
      'GET/POST /api/wellness/achievements',
      'GET/POST/PUT /api/wellness/challenges',
      'GET/POST/PUT /api/wellness/couple-goals'
    ],
    apis: 99,
    models: 90
  },
  {
    version: '1.8.0',
    date: 'February 5, 2026',
    title: 'Media & Social Authentication',
    description: 'Product video support with YouTube/Vimeo embeds and OAuth login for Google and Apple.',
    type: 'minor',
    icon: Video,
    features: [
      'Product video gallery with modal playback',
      'YouTube and Vimeo embed support',
      'Google OAuth sign-in',
      'Apple Sign In with JWT verification',
      'Quiz to Cart conversion with tracking',
      'Video thumbnails with duration display'
    ],
    improvements: [
      'Combined media gallery for images and videos',
      'Auto-conversion of video URLs to embeds'
    ],
    fixes: [
      'Quiz recommendations now link directly to cart'
    ],
    technical: [
      'ProductVideo model added',
      'Customer model: googleId, appleId, authProvider fields',
      'GET/POST /api/auth/oauth/google - Google OAuth flow',
      'GET/POST /api/auth/oauth/apple - Apple OAuth flow',
      'ES256 JWT signing for Apple client secret',
      'POST /api/quiz/convert - Track quiz to cart conversion',
      'Env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET',
      'Env vars: APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY'
    ],
    apis: 85,
    models: 72
  },
  {
    version: '1.7.0',
    date: 'February 1, 2026',
    title: 'AI & Personalization',
    description: 'AI-powered product recommendations, support chatbot, and enhanced VIP loyalty program.',
    type: 'major',
    icon: Bot,
    features: [
      'AI Product Recommendations Engine',
      'AI Support Chatbot with intent detection',
      'VIP Membership Tiers (Bronze, Silver, Gold, Platinum)',
      'Points Redemption Store',
      'Knowledge base for chatbot responses',
      'Personalized product suggestions'
    ],
    improvements: [
      'Floating chatbot widget site-wide',
      '4 VIP tiers with 13 benefits',
      '7 chatbot knowledge base entries seeded'
    ],
    fixes: [
      'Email service configuration improved',
      'Order confirmation emails now sent reliably'
    ],
    technical: [
      'ProductRecommendation, UserRecommendation models',
      'ChatbotConversation, ChatbotMessage, ChatbotKnowledge models',
      'VIPTier, VIPBenefit, CustomerVIPProgress models',
      'PointsReward, PointsRedemption, CustomerPreferences models',
      'GET/POST /api/recommendations',
      'GET /api/recommendations/product/[id]',
      'GET/POST /api/chatbot',
      'GET/POST/PUT /api/vip/tiers',
      'GET/PUT /api/vip/progress',
      'GET/POST /api/points/rewards',
      'GET/POST /api/points/redeem',
      'Seeded: 4 VIP tiers, 13 benefits, 7 rewards, 7 KB entries'
    ],
    apis: 77,
    models: 62
  },
  {
    version: '1.6.0',
    date: 'January 28, 2026',
    title: 'Admin Tools & Support System',
    description: 'Comprehensive admin dashboard with analytics, support ticket management, and email campaigns.',
    type: 'major',
    icon: BarChart3,
    features: [
      'Admin Analytics Dashboard with charts',
      'Customer Support Ticket System',
      'Admin Support Management panel',
      'Email Campaign Manager',
      'Audit Log for admin actions',
      'Period filtering (7d, 30d, 90d, 1y)'
    ],
    improvements: [
      'Ticket categories with SLA targets',
      'Internal notes on support tickets',
      'Campaign segment targeting'
    ],
    fixes: [],
    technical: [
      'AnalyticsSnapshot, ReportSchedule models',
      'SupportTicket, TicketMessage, SupportTicketCategory models',
      'AuditLog, EmailCampaign, CampaignRecipient models',
      'GET /api/admin/analytics - Dashboard metrics',
      'GET/POST /api/tickets - Customer tickets',
      'GET/PUT /api/tickets/[id] - Ticket detail',
      'POST /api/tickets/[id]/messages - Add message',
      'GET/POST /api/tickets/categories',
      'GET/POST /api/admin/audit-logs',
      'GET/POST/PUT/DELETE /api/admin/campaigns'
    ],
    apis: 65,
    models: 50
  },
  {
    version: '1.5.0',
    date: 'January 24, 2026',
    title: 'Returns Portal & Couples Accounts',
    description: 'Hassle-free returns, couples account linking, and discreet packaging preferences.',
    type: 'major',
    icon: Package,
    features: [
      'Returns Portal with item selection',
      'Multiple refund methods (original, store credit, exchange)',
      'Couples Account Linking',
      'Shared wishlist and orders for couples',
      'Discreet Packaging Builder',
      'Custom delivery preferences'
    ],
    improvements: [
      'Return reason tracking',
      'Partner invitation system'
    ],
    fixes: [],
    technical: [
      'ReturnRequest, ReturnItem models',
      'CouplesLink model for partner connections',
      'PackagingPreference, PackagingOption models',
      'GET/POST/PUT /api/returns',
      'GET/POST/PUT /api/couples',
      'GET/POST /api/packaging'
    ],
    apis: 50,
    models: 40
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
      'Email Verification system',
      'Product Image Upload for admins',
      'Inventory deduction on orders',
      'Session management and revocation',
      'Security alert notifications'
    ],
    improvements: [
      'Stock validation before order creation',
      'Admin image management interface'
    ],
    fixes: [
      'Guest orders now properly tracked'
    ],
    technical: [
      'Customer model: emailVerified, passwordResetToken fields',
      'Session model for auth tracking',
      'POST /api/auth/forgot-password',
      'POST /api/auth/reset-password',
      'GET /api/auth/verify-email',
      'POST /api/auth/resend-verification',
      'POST /api/admin/products/[id]/images',
      'DELETE/PATCH /api/images/[id]',
      'POST /api/sessions/revoke'
    ],
    apis: 40,
    models: 32
  },
  {
    version: '1.3.0',
    date: 'January 15, 2026',
    title: 'Content & Guides',
    description: 'Blog section, size guides, and product comparison tools for informed decisions.',
    type: 'minor',
    icon: Star,
    features: [
      'Blog/Magazine section with categories',
      'Size/Fit Guide with unit conversion',
      'Product Comparison (up to 4 products)',
      'Author profiles on blog posts',
      'Estimated read time for articles',
      'Comparison bar persisting across site'
    ],
    improvements: [
      'SEO meta fields for blog posts',
      'Per-product fit recommendations'
    ],
    fixes: [],
    technical: [
      'BlogPost, BlogAuthor, BlogCategory models',
      'SizeGuide, SizeChart, SizeRecommendation models',
      'SavedComparison model',
      'GET/POST /api/blog',
      'GET /api/blog/[slug]',
      'GET/POST /api/size-guides',
      'ComparisonContext provider for state'
    ],
    apis: 30,
    models: 25
  },
  {
    version: '1.2.0',
    date: 'January 10, 2026',
    title: 'Marketing & Promotions',
    description: 'Flash sales, promo codes, product bundles, and referral program for growth.',
    type: 'minor',
    icon: Zap,
    features: [
      'Flash Sales with countdown timers',
      'Promo Codes with usage limits',
      'Product Bundles with savings display',
      'Referral Program ($10 credit)',
      'Promo code validation at checkout',
      'Bundle add-to-cart functionality'
    ],
    improvements: [
      'Category-specific promotions',
      'Minimum order requirements for codes'
    ],
    fixes: [],
    technical: [
      'Promotion model (enhanced with flash sale support)',
      'ProductBundle, BundleItem models',
      'ReferralCode, Referral models',
      'GET/POST /api/promotions',
      'POST /api/promotions/check',
      'GET/POST /api/bundles',
      'GET/POST /api/referrals/code',
      'POST /api/referrals/validate',
      'GET/POST /api/flash-sales'
    ],
    apis: 22,
    models: 18
  },
  {
    version: '1.1.0',
    date: 'January 5, 2026',
    title: 'Customer Care',
    description: 'Product reviews, social proof, gift cards, and abandoned cart recovery.',
    type: 'minor',
    icon: Heart,
    features: [
      'Product Reviews & Ratings',
      'Review helpfulness voting',
      'Social Proof indicators',
      'Digital Gift Cards',
      'Abandoned Cart Recovery emails',
      'Price Drop and Stock Alerts'
    ],
    improvements: [
      'Admin moderation for reviews',
      '10% discount for cart recovery'
    ],
    fixes: [],
    technical: [
      'Review, ReviewVote models',
      'GiftCard, GiftCardTransaction models',
      'AbandonedCart model',
      'GET/POST /api/reviews',
      'POST /api/reviews/[id]/vote',
      'GET/POST /api/gift-cards',
      'POST /api/gift-cards/redeem',
      'POST /api/gift-cards/check',
      'GET/POST /api/abandoned-cart',
      'POST /api/abandoned-cart/recover',
      'POST /api/alerts/price-drop',
      'POST /api/alerts/stock',
      'POST /api/cron/price-alerts',
      'POST /api/cron/stock-alerts',
      'POST /api/cron/abandoned-cart',
      'POST /api/cron/gift-cards'
    ],
    apis: 15,
    models: 12
  },
  {
    version: '1.0.0',
    date: 'January 1, 2026',
    title: 'Foundation Launch',
    description: 'Initial platform launch with core e-commerce functionality and brand identity.',
    type: 'major',
    icon: Sparkles,
    features: [
      'Product catalog with categories',
      'Shopping cart and checkout',
      'Stripe, Crypto, and Bank payment methods',
      'Admin dashboard for products and orders',
      'Customer accounts and authentication',
      'Loyalty points system',
      'Wishlist functionality',
      'Age verification gate',
      'Responsive design with CALŌR brand'
    ],
    improvements: [],
    fixes: [],
    technical: [
      'Product, ProductVariant, ProductImage, Category models',
      'Customer, Session models',
      'Order, OrderItem models',
      'Wishlist, WishlistItem models',
      'LoyaltyPoint, LoyaltyTier models',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'POST /api/auth/logout',
      'GET /api/auth/me',
      'GET/POST /api/products',
      'GET/POST /api/orders',
      'POST /api/payment/create-intent',
      'POST /api/payment/crypto-charge',
      'POST /api/payment/bank-transfer',
      'GET/POST /api/wishlist',
      'GET/POST /api/loyalty'
    ],
    apis: 5,
    models: 5
  }
]

const typeStyles = {
  major: 'bg-terracotta text-cream',
  minor: 'bg-charcoal text-cream',
  patch: 'bg-sand text-charcoal',
  internal: 'bg-purple-600 text-cream'
}

const typeLabels = {
  major: 'Major Release',
  minor: 'Feature Update',
  patch: 'Bug Fixes',
  internal: 'Internal'
}

export default function AdminChangelogClient() {
  const [expandedVersions, setExpandedVersions] = useState<string[]>(['2.3.0', '2.2.0', '2.1.1', '2.1.0'])

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

  const totalApis = changelogData[0]?.apis || 125
  const totalModels = changelogData[0]?.models || 118

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-charcoal py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Code className="w-5 h-5 text-terracotta" />
                <span className="font-body text-cream/60 text-sm uppercase tracking-wider">Internal Documentation</span>
              </div>
              <h1 
                className="font-display text-cream"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 300 }}
              >
                Development Changelog
              </h1>
              <p className="font-body text-cream/60 text-sm mt-2">
                Full technical history of platform development. This page is admin-only.
              </p>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 border border-cream/30 text-cream font-body text-sm hover:bg-cream/10 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-sand/50 py-6 border-b border-sand">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            <div>
              <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
                {changelogData.length}
              </p>
              <p className="font-body text-warm-gray text-xs uppercase tracking-wider">Releases</p>
            </div>
            <div>
              <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
                {changelogData.filter(e => e.type === 'major').length}
              </p>
              <p className="font-body text-warm-gray text-xs uppercase tracking-wider">Major</p>
            </div>
            <div>
              <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
                {totalApis}+
              </p>
              <p className="font-body text-warm-gray text-xs uppercase tracking-wider">API Endpoints</p>
            </div>
            <div>
              <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
                {totalModels}+
              </p>
              <p className="font-body text-warm-gray text-xs uppercase tracking-wider">DB Models</p>
            </div>
            <div>
              <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
                {changelogData.reduce((acc, e) => acc + e.features.length, 0)}+
              </p>
              <p className="font-body text-warm-gray text-xs uppercase tracking-wider">Features</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <p className="font-body text-warm-gray text-sm">
            Complete development history from v1.0.0 to present
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
      <div className="max-w-6xl mx-auto px-6 pb-16">
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
                        {entry.apis && (
                          <span className="px-2 py-0.5 bg-cream text-xs font-mono text-warm-gray">
                            {entry.apis} APIs / {entry.models} models
                          </span>
                        )}
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
                          <Server className="w-4 h-4 text-charcoal" />
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
                      <div className="mb-6">
                        <h4 className="font-body text-charcoal text-sm font-medium mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-green-600" />
                          Bug Fixes
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

                    {entry.technical && entry.technical.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-sand">
                        <h4 className="font-body text-charcoal text-sm font-medium mb-3 flex items-center gap-2">
                          <Database className="w-4 h-4 text-purple-600" />
                          Technical Details
                        </h4>
                        <div className="bg-charcoal/5 p-4 font-mono text-xs text-charcoal overflow-x-auto">
                          {entry.technical.map((tech, idx) => (
                            <div key={idx} className="py-0.5">{tech}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

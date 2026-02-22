'use client'

import Link from 'next/link'
import ClientWrapper from '@/components/layout/ClientWrapper'
import { 
  Sparkles, Gift, Heart, Camera, Bot, Crown, Shield, 
  Package, Users, BarChart3, Video, Gamepad2, Box,
  Zap, Star, Radio, Calendar, Target, MessageSquare,
  ChevronRight, ArrowRight, Play, HeartHandshake,
  Luggage, Ticket, BadgeCheck, Wand2, Flame, CoupleIcon
} from 'lucide-react'

const featureCategories = [
  {
    title: 'Shopping Experience',
    description: 'A seamless, personalized shopping journey',
    color: 'terracotta',
    features: [
      {
        icon: Bot,
        title: 'AI Product Recommendations',
        description: 'Personalized suggestions based on your preferences, purchase history, and browsing behavior.',
        link: '/shop',
        badge: 'AI-Powered'
      },
      {
        icon: Box,
        title: 'AR Try-On & 3D Viewer',
        description: 'Experience products virtually with augmented reality try-on and 360° 3D viewing.',
        link: '/experience',
        badge: 'Interactive'
      },
      {
        icon: Target,
        title: 'Product Comparison',
        description: 'Compare up to 4 products side-by-side to find your perfect match.',
        link: '/shop',
        badge: null
      },
      {
        icon: Star,
        title: 'Smart Quiz',
        description: 'Take our intelligent quiz to discover products tailored to your preferences and goals.',
        link: '/quiz',
        badge: 'Popular'
      },
      {
        icon: Zap,
        title: 'Flash Sales',
        description: 'Exclusive limited-time offers with countdown timers. Act fast before they are gone.',
        link: '/shop',
        badge: 'Limited'
      },
      {
        icon: Package,
        title: 'Product Bundles',
        description: 'Curated bundles with built-in savings. Get more value with every purchase.',
        link: '/shop/bundles',
        badge: 'Save 20%+'
      }
    ]
  },
  {
    title: 'Wellness Platform',
    description: 'Track your journey, earn rewards, connect with your partner',
    color: 'purple',
    features: [
      {
        icon: Flame,
        title: 'Daily Check-ins & Streaks',
        description: 'Build healthy habits with daily wellness check-ins. Maintain streaks for bonus rewards.',
        link: '/account/wellness',
        badge: 'Gamified'
      },
      {
        icon: Crown,
        title: 'Achievements & Badges',
        description: 'Earn achievement badges across bronze, silver, gold, and platinum tiers.',
        link: '/account/wellness',
        badge: 'Fun'
      },
      {
        icon: Gamepad2,
        title: 'Smart Toy Integration',
        description: 'Connect smart devices, create custom patterns, and track sessions with loyalty rewards.',
        link: '/account/toys',
        badge: 'Advanced'
      },
      {
        icon: HeartHandshake,
        title: 'Couple Wellness',
        description: 'Link accounts with your partner, set shared goals, and track your connection score.',
        link: '/account/couple',
        badge: 'Couples'
      },
      {
        icon: Calendar,
        title: '7-Day Reward Calendar',
        description: 'Log in daily to unlock rewards, bonuses, and exclusive offers.',
        link: '/account/wellness',
        badge: null
      },
      {
        icon: Target,
        title: 'Challenges & Goals',
        description: 'Participate in wellness challenges and track progress toward personal goals.',
        link: '/account/wellness',
        badge: null
      }
    ]
  },
  {
    title: 'Loyalty & Rewards',
    description: 'Get rewarded for every interaction',
    color: 'gold',
    features: [
      {
        icon: Crown,
        title: 'VIP Membership Tiers',
        description: 'Progress through Bronze, Silver, Gold, and Platinum tiers with exclusive benefits.',
        link: '/account/vip',
        badge: '4 Tiers'
      },
      {
        icon: Sparkles,
        title: 'Points on Everything',
        description: 'Earn points on purchases, reviews, referrals, and wellness activities.',
        link: '/account/vip',
        badge: 'Earn More'
      },
      {
        icon: Gift,
        title: 'Rewards Store',
        description: 'Redeem points for discounts, free products, and exclusive experiences.',
        link: '/account/rewards',
        badge: 'Redeem'
      },
      {
        icon: Users,
        title: 'Referral Program',
        description: 'Invite friends and earn $10 credit for both of you when they make their first purchase.',
        link: '/account/referrals',
        badge: '$10 Each'
      }
    ]
  },
  {
    title: 'Gifting & Registry',
    description: 'Perfect for special occasions',
    color: 'terracotta',
    features: [
      {
        icon: Gift,
        title: 'Gift Registry',
        description: 'Create registries for weddings, birthdays, baby showers, and special occasions.',
        link: '/registry',
        badge: 'New'
      },
      {
        icon: Users,
        title: 'Group Gifting',
        description: 'Friends and family can contribute toward bigger gifts together.',
        link: '/registry',
        badge: 'Collaborative'
      },
      {
        icon: Gift,
        title: 'Digital Gift Cards',
        description: 'Send personalized gift cards instantly or schedule for special dates.',
        link: '/gift-cards',
        badge: null
      },
      {
        icon: Heart,
        title: 'Wishlist Sharing',
        description: 'Create and share wishlists with unique links. Perfect for gift ideas.',
        link: '/account/wishlist',
        badge: null
      }
    ]
  },
  {
    title: 'Live Shopping',
    description: 'Interactive, real-time shopping experiences',
    color: 'red',
    features: [
      {
        icon: Radio,
        title: 'Live Streams',
        description: 'Watch live product demos, tutorials, and exclusive reveals from hosts.',
        link: '/live',
        badge: 'Live'
      },
      {
        icon: MessageSquare,
        title: 'Live Chat',
        description: 'Ask questions in real-time and get instant answers from hosts.',
        link: '/live',
        badge: null
      },
      {
        icon: Zap,
        title: 'Flash Offers',
        description: 'Exclusive in-stream discounts available only during live broadcasts.',
        link: '/live',
        badge: 'Exclusive'
      },
      {
        icon: Video,
        title: 'Stream Replays',
        description: 'Missed a live stream? Watch replays anytime at your convenience.',
        link: '/live',
        badge: null
      }
    ]
  },
  {
    title: 'Expert Services',
    description: 'Professional guidance when you need it',
    color: 'blue',
    features: [
      {
        icon: Calendar,
        title: 'Virtual Consultations',
        description: 'Book 1-on-1 video sessions with certified wellness experts and coaches.',
        link: '/consultations',
        badge: 'Expert'
      },
      {
        icon: Package,
        title: 'Subscription Boxes',
        description: 'Curated monthly boxes delivered to your door with handpicked products.',
        link: '/subscriptions',
        badge: 'Monthly'
      },
      {
        icon: Bot,
        title: 'AI Support Chat',
        description: 'Get instant answers to common questions with our intelligent chatbot.',
        link: '/support',
        badge: '24/7'
      },
      {
        icon: MessageSquare,
        title: 'Support Tickets',
        description: 'Detailed support requests with tracking and priority handling.',
        link: '/account/support',
        badge: null
      }
    ]
  },
  {
    title: 'Privacy & Security',
    description: 'Your privacy is our priority',
    color: 'charcoal',
    features: [
      {
        icon: Shield,
        title: 'Discreet Packaging',
        description: 'Plain packaging with no branding. Your privacy is guaranteed.',
        link: '/account/packaging',
        badge: 'Private'
      },
      {
        icon: Shield,
        title: 'Secure Payments',
        description: 'Stripe, crypto, and bank transfer options with full encryption.',
        link: '/checkout',
        badge: 'Secure'
      },
      {
        icon: Shield,
        title: 'Session Management',
        description: 'View and revoke active sessions. Control your account security.',
        link: '/account/sessions',
        badge: null
      },
      {
        icon: Shield,
        title: 'Anonymous Gifting',
        description: 'Send gifts without revealing your identity to the recipient.',
        link: '/gifts',
        badge: null
      }
    ]
  },
  {
    title: 'Returns & Support',
    description: 'Hassle-free customer care',
    color: 'green',
    features: [
      {
        icon: Package,
        title: 'Easy Returns Portal',
        description: 'Simple return process with multiple refund options and tracking.',
        link: '/returns',
        badge: 'Easy'
      },
      {
        icon: Star,
        title: 'Product Reviews',
        description: 'Read verified purchase reviews and share your own experiences.',
        link: '/shop',
        badge: null
      },
      {
        icon: Zap,
        title: 'Stock Alerts',
        description: 'Get notified when out-of-stock items are back in inventory.',
        link: '/account/alerts',
        badge: null
      },
      {
        icon: Zap,
        title: 'Price Drop Alerts',
        description: 'Set alerts for price drops on products in your wishlist.',
        link: '/account/alerts',
        badge: null
      }
    ]
  }
]

const stats = [
  { label: 'Products', value: '500+' },
  { label: 'Features', value: '90+' },
  { label: 'Happy Customers', value: '10K+' },
  { label: 'Countries', value: '50+' },
]

export default function FeaturesClient() {
  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20 bg-cream">
        {/* Hero */}
        <div className="bg-gradient-to-br from-charcoal via-charcoal to-charcoal/90 py-20 lg:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-terracotta" />
                <span className="font-body text-terracotta text-sm uppercase tracking-wider">Platform Features</span>
              </div>
              <h1 
                className="font-display text-cream mb-6"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 300 }}
              >
                Everything You Need
              </h1>
              <p className="font-body text-cream/70 text-lg max-w-2xl mx-auto mb-8">
                CALŌR is more than a store. It is a complete wellness platform designed 
                to enhance every aspect of your intimate journey.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/shop"
                  className="px-8 py-3 bg-terracotta text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta/90 transition-colors"
                >
                  Start Shopping
                </Link>
                <Link
                  href="/quiz"
                  className="px-8 py-3 border border-cream/30 text-cream font-body text-sm uppercase tracking-wider hover:bg-cream/10 transition-colors"
                >
                  Take the Quiz
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-sand/50 py-8 border-b border-sand">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-charcoal text-3xl" style={{ fontWeight: 300 }}>
                    {stat.value}
                  </p>
                  <p className="font-body text-warm-gray text-sm uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Categories */}
        <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
          {featureCategories.map((category, categoryIndex) => (
            <div key={category.title} className={categoryIndex > 0 ? 'mt-20 pt-12 border-t border-sand' : ''}>
              <div className="mb-10">
                <h2 
                  className="font-display text-charcoal mb-2"
                  style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 400 }}
                >
                  {category.title}
                </h2>
                <p className="font-body text-warm-gray">{category.description}</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.features.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <Link
                      key={feature.title}
                      href={feature.link}
                      className="group bg-warm-white border border-sand p-6 hover:border-terracotta/50 transition-all hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 flex items-center justify-center bg-cream">
                          <Icon className="w-6 h-6 text-terracotta" />
                        </div>
                        {feature.badge && (
                          <span className="px-2 py-1 bg-terracotta/10 text-terracotta text-xs font-body uppercase tracking-wider">
                            {feature.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-charcoal text-lg mb-2 group-hover:text-terracotta transition-colors" style={{ fontWeight: 400 }}>
                        {feature.title}
                      </h3>
                      <p className="font-body text-warm-gray text-sm leading-relaxed">
                        {feature.description}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-terracotta font-body text-sm group-hover:gap-3 transition-all">
                        <span>Learn more</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-charcoal py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 
              className="font-display text-cream mb-4"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 300 }}
            >
              Ready to Experience CALŌR?
            </h2>
            <p className="font-body text-cream/70 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of customers who trust us for their wellness journey. 
              Create your free account and start exploring all features today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/account"
                className="px-8 py-3 bg-terracotta text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta/90 transition-colors"
              >
                Create Account
              </Link>
              <Link
                href="/quiz"
                className="px-8 py-3 border border-cream/30 text-cream font-body text-sm uppercase tracking-wider hover:bg-cream/10 transition-colors"
              >
                Take the Quiz
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ClientWrapper>
  )
}

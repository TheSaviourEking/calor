'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ChevronLeft, ChevronRight, Sparkles, Users, ShoppingCart, 
  Video, MessageCircle, Heart, Gift, Star, TrendingUp,
  Shield, Zap, Globe, Award, Target, Layers, Play, Download
} from 'lucide-react'
import ClientWrapper from '@/components/layout/ClientWrapper'

const slides = [
  // Slide 1: Title
  {
    type: 'title',
    content: {
      headline: 'CALOR',
      tagline: 'The Future of Intimate Commerce',
      subtitle: 'Investor Pitch Deck 2025',
    }
  },
  // Slide 2: Problem
  {
    type: 'problem',
    content: {
      title: 'The Problem',
      points: [
        { stat: '$58.6B', label: 'Sexual Wellness Market by 2032', growth: '7% CAGR' },
        { stat: '73%', label: 'Consumers prefer discreet online shopping' },
        { stat: '0', label: 'Platforms offering complete wellness journey' },
      ],
      statement: 'The adult wellness industry lacks a unified platform that combines commerce, education, community, and personalization.',
    }
  },
  // Slide 3: Solution
  {
    type: 'solution',
    content: {
      title: 'Our Solution: CALOR',
      subtitle: 'A comprehensive platform that transforms how people discover, purchase, and enjoy intimate products.',
      features: [
        { icon: ShoppingCart, title: 'Premium E-commerce', desc: 'Curated products with detailed guides' },
        { icon: Sparkles, title: 'AI-Powered Discovery', desc: 'Personalized recommendations via quiz' },
        { icon: Video, title: 'Live Shopping', desc: 'Interactive streams with real-time offers' },
        { icon: Heart, title: 'Wellness Journey', desc: 'Complete intimate wellness platform' },
      ]
    }
  },
  // Slide 4: Platform Features
  {
    type: 'features',
    content: {
      title: 'Platform Capabilities',
      subtitle: '119 API Endpoints | 117 Data Models | Full-Stack Solution',
      categories: [
        {
          name: 'Core Commerce',
          items: ['Product Catalog', 'Multi-variant SKUs', 'Cart & Checkout', 'Multi-payment (Card/Crypto/Bank)', 'Guest Checkout', 'Order Tracking']
        },
        {
          name: 'AI & Personalization',
          items: ['Product Recommendation Quiz', 'AI Chatbot Support', 'Personalized Suggestions', 'Smart Search', 'Behavior Tracking']
        },
        {
          name: 'Customer Experience',
          items: ['Reviews & Ratings', 'Size Guides', 'Video Tutorials', 'Virtual Consultations', 'Support Tickets']
        },
        {
          name: 'Retention & Loyalty',
          items: ['Points System', 'VIP Tiers', 'Referral Program', 'Subscription Boxes', 'Gift Cards', 'Flash Sales']
        },
      ]
    }
  },
  // Slide 5: Live Shopping
  {
    type: 'live-shopping',
    content: {
      title: 'Live Shopping Platform',
      subtitle: 'The fastest-growing e-commerce channel: $1 Trillion by 2026',
      features: [
        { icon: Video, title: 'Real-time Streaming', desc: 'Host-controlled live video with viewer interaction' },
        { icon: MessageCircle, title: 'Live Chat', desc: 'Moderated chat with reactions and pinned messages' },
        { icon: Zap, title: 'Flash Offers', desc: 'Time-limited exclusive deals during streams' },
        { icon: TrendingUp, title: 'Analytics Dashboard', desc: 'Viewer metrics, sales tracking, engagement stats' },
      ],
      stats: [
        { value: '3x', label: 'Higher conversion vs traditional e-commerce' },
        { value: '10x', label: 'Longer session duration' },
        { value: '40%', label: 'Lower return rates' },
      ]
    }
  },
  // Slide 6: Customer Journey
  {
    type: 'journey',
    content: {
      title: 'Complete Customer Journey',
      stages: [
        { step: 1, title: 'Discover', desc: 'AI Quiz matches products to preferences' },
        { step: 2, title: 'Learn', desc: 'Video tutorials & expert consultations' },
        { step: 3, title: 'Shop', desc: 'Seamless checkout with discreet options' },
        { step: 4, title: 'Engage', desc: 'Live streams & community features' },
        { step: 5, title: 'Return', desc: 'Loyalty rewards & VIP benefits' },
      ]
    }
  },
  // Slide 7: Discretion Features
  {
    type: 'discretion',
    content: {
      title: 'Privacy & Discretion First',
      subtitle: 'Industry-leading privacy features that build trust',
      features: [
        { icon: Shield, title: 'Plain Packaging', desc: 'Unmarked boxes with no branding' },
        { icon: Globe, title: 'Discreet Billing', desc: 'Neutral transaction descriptors' },
        { icon: Users, title: 'Couples Accounts', desc: 'Shared wishlists & privacy controls' },
        { icon: Gift, title: 'Anonymous Gifting', desc: 'Send gifts without revealing identity' },
      ]
    }
  },
  // Slide 8: Technology
  {
    type: 'tech',
    content: {
      title: 'Technology Stack',
      subtitle: 'Built for scale, designed for experience',
      stack: [
        { layer: 'Frontend', tech: 'Next.js 16, React 19, TypeScript, Tailwind CSS' },
        { layer: 'Backend', tech: 'API Routes, Prisma ORM, WebSocket (Socket.io)' },
        { layer: 'Database', tech: 'SQLite (dev) / PostgreSQL (production ready)' },
        { layer: 'AI/ML', tech: 'LLM Integration, Recommendation Engine' },
        { layer: 'Payments', tech: 'Stripe, Coinbase Commerce, Bank Transfer' },
        { layer: 'Auth', tech: 'Email, Google OAuth, Apple Sign-In' },
      ]
    }
  },
  // Slide 9: Market Opportunity
  {
    type: 'market',
    content: {
      title: 'Market Opportunity',
      tam: { value: '$58.6B', label: 'Total Addressable Market by 2032' },
      sam: { value: '$12B', label: 'Serviceable Market (North America)' },
      growth: '7% CAGR',
      trends: [
        'Destigmatization of sexual wellness',
        'E-commerce shift accelerated by pandemic',
        'Gen Z & Millennials driving growth',
        'Personalization demand increasing',
        'Live shopping becoming mainstream',
      ]
    }
  },
  // Slide 10: Competitive Advantage
  {
    type: 'competitive',
    content: {
      title: 'Competitive Moat',
      vs: [
        { competitor: 'Lovehoney', ours: 'AI personalization + Live shopping + Wellness journey' },
        { competitor: 'Adam & Eve', ours: 'Modern UX + Real-time features + Subscription' },
        { competitor: 'Amazon', ours: 'Specialized expertise + Privacy focus + Community' },
        { competitor: 'Dame', ours: 'Broader audience + Live shopping + Full platform' },
      ],
      differentiators: [
        'Only platform with integrated live shopping',
        'AI-powered product discovery',
        'Complete wellness journey tracking',
        'Couples & relationship features',
        'Virtual consultation marketplace',
      ]
    }
  },
  // Slide 11: Business Model
  {
    type: 'business',
    content: {
      title: 'Business Model',
      streams: [
        { name: 'Product Sales', margin: '40-60%', desc: 'Direct retail with premium margins' },
        { name: 'Subscription Box', margin: 'Recurring', desc: 'Monthly curated packages' },
        { name: 'Live Shopping', margin: '8-12% take rate', desc: 'Commission on stream sales' },
        { name: 'Consultations', margin: '20%', desc: 'Expert session marketplace' },
        { name: 'Premium Membership', margin: 'Recurring', desc: 'VIP benefits & exclusive access' },
      ]
    }
  },
  // Slide 12: Traction
  {
    type: 'traction',
    content: {
      title: 'Platform Status',
      metrics: [
        { value: '119', label: 'API Endpoints Built' },
        { value: '117', label: 'Data Models' },
        { value: '74', label: 'Pages' },
        { value: '46', label: 'Client Components' },
      ],
      completed: [
        'Core E-commerce Platform',
        'AI Product Quiz & Recommendations',
        'Subscription Box System',
        'VIP Loyalty Program',
        'Live Shopping Platform',
        'Admin Analytics Dashboard',
        'Multi-payment Integration',
        'OAuth Authentication',
        'Gift Registry System',
        'Smart Toy Integration',
        'Gamification Engine',
      ]
    }
  },
  // Slide 13: Roadmap
  {
    type: 'roadmap',
    content: {
      title: 'Product Roadmap',
      phases: [
        { phase: 'Q1 2024', status: 'Complete', items: ['Core Platform', 'AI Quiz', 'Subscriptions'] },
        { phase: 'Q2 2024', status: 'Complete', items: ['Returns', 'Couples', 'Analytics'] },
        { phase: 'Q3 2024', status: 'Complete', items: ['AI Chatbot', 'VIP Program', 'Live Shopping'] },
        { phase: 'Q4 2024', status: 'Complete', items: ['Gift Registry', 'Smart Toys', 'Gamification'] },
        { phase: 'Q1 2025', status: 'In Progress', items: ['Mobile App', 'AR Preview', 'International'] },
        { phase: '2025+', status: 'Vision', items: ['Marketplace', 'Wellness App', 'Smart Home'] },
      ]
    }
  },
  // Slide 14: Team Ask
  {
    type: 'ask',
    content: {
      title: 'Investment Opportunity',
      raise: '$2M Seed Round',
      use: [
        { category: 'Engineering', percent: 40, desc: 'Mobile app, AR features, AI enhancement' },
        { category: 'Marketing', percent: 30, desc: 'Customer acquisition, brand building' },
        { category: 'Operations', percent: 20, desc: 'Fulfillment, customer support' },
        { category: 'Working Capital', percent: 10, desc: 'Inventory, runway extension' },
      ],
      milestones: [
        'Launch mobile app',
        '50,000 active users',
        '$5M ARR',
        'Smart toy integration',
      ]
    }
  },
  // Slide 15: Closing
  {
    type: 'closing',
    content: {
      headline: 'CALOR',
      tagline: 'Redefining Intimate Commerce',
      cta: 'Let\'s Build the Future Together',
      contact: 'investors@calor.com',
    }
  },
]

export default function PitchDeckPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const nextSlide = () => {
    if (animating || currentSlide >= slides.length - 1) return
    setAnimating(true)
    setCurrentSlide(prev => prev + 1)
    setTimeout(() => setAnimating(false), 500)
  }

  const prevSlide = () => {
    if (animating || currentSlide <= 0) return
    setAnimating(true)
    setCurrentSlide(prev => prev - 1)
    setTimeout(() => setAnimating(false), 500)
  }

  const downloadPDF = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch('/api/pitch-deck')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'CALOR-Investor-Pitch-Deck-2025.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download PDF:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide()
      if (e.key === 'ArrowLeft') prevSlide()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSlide, animating])

  const slide = slides[currentSlide]

  return (
    <ClientWrapper>
      <div className="min-h-screen bg-charcoal text-cream overflow-hidden">
        {/* Navigation */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-display text-xl" style={{ fontWeight: 300 }}>CALOR</span>
            <span className="text-warm-gray/50">|</span>
            <span className="font-body text-sm text-warm-gray">Investor Pitch Deck</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={downloadPDF}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 border border-terracotta text-terracotta hover:bg-terracotta hover:text-cream transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="font-body text-sm">{isDownloading ? 'Downloading...' : 'Download PDF'}</span>
            </button>
            <span className="font-body text-sm text-warm-gray">
              {currentSlide + 1} / {slides.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="w-10 h-10 border border-warm-gray/30 flex items-center justify-center hover:border-terracotta disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                disabled={currentSlide === slides.length - 1}
                className="w-10 h-10 border border-warm-gray/30 flex items-center justify-center hover:border-terracotta disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="fixed top-[72px] left-0 right-0 h-1 bg-warm-gray/10 z-50">
          <div 
            className="h-full bg-terracotta transition-all duration-500"
            style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          />
        </div>

        {/* Slide Content */}
        <div className="pt-24 pb-16 px-6 min-h-screen flex items-center justify-center">
          <div className={`max-w-6xl w-full transition-opacity duration-300 ${animating ? 'opacity-0' : 'opacity-100'}`}>
            {slide.type === 'title' && (
              <div className="text-center py-20">
                <h1 
                  className="font-display text-terracotta mb-6"
                  style={{ fontSize: 'clamp(4rem, 12vw, 10rem)', fontWeight: 300, letterSpacing: '0.1em' }}
                >
                  {slide.content.headline}
                </h1>
                <p 
                  className="font-display text-cream mb-4"
                  style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 300 }}
                >
                  {slide.content.tagline}
                </p>
                <p className="font-body text-warm-gray text-lg tracking-widest uppercase">
                  {slide.content.subtitle}
                </p>
              </div>
            )}

            {slide.type === 'problem' && (
              <div>
                <h2 className="font-display text-terracotta text-4xl mb-12" style={{ fontWeight: 300 }}>
                  {slide.content.title}
                </h2>
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                  {slide.content.points.map((point, i) => (
                    <div key={i} className="text-center p-8 border border-warm-gray/20">
                      <div className="font-display text-terracotta text-5xl mb-2" style={{ fontWeight: 300 }}>
                        {point.stat}
                      </div>
                      <div className="font-body text-cream mb-2">{point.label}</div>
                      {point.growth && (
                        <div className="font-body text-warm-gray text-sm">{point.growth}</div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="font-body text-xl text-warm-gray text-center max-w-3xl mx-auto leading-relaxed">
                  {slide.content.statement}
                </p>
              </div>
            )}

            {slide.type === 'solution' && (
              <div>
                <h2 className="font-display text-terracotta text-4xl mb-4" style={{ fontWeight: 300 }}>
                  {slide.content.title}
                </h2>
                <p className="font-body text-warm-gray text-lg mb-12 max-w-3xl">
                  {slide.content.subtitle}
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {slide.content.features.map((feature, i) => (
                    <div key={i} className="p-6 border border-warm-gray/20 hover:border-terracotta transition-colors">
                      <feature.icon className="w-10 h-10 text-terracotta mb-4" />
                      <h3 className="font-display text-cream text-lg mb-2" style={{ fontWeight: 400 }}>
                        {feature.title}
                      </h3>
                      <p className="font-body text-warm-gray text-sm">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'features' && (
              <div>
                <h2 className="font-display text-terracotta text-4xl mb-4" style={{ fontWeight: 300 }}>
                  {slide.content.title}
                </h2>
                <p className="font-body text-warm-gray text-lg mb-8">{slide.content.subtitle}</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {slide.content.categories.map((cat, i) => (
                    <div key={i} className="bg-warm-gray/5 p-6">
                      <h3 className="font-display text-terracotta text-lg mb-4" style={{ fontWeight: 400 }}>
                        {cat.name}
                      </h3>
                      <ul className="space-y-2">
                        {cat.items.map((item, j) => (
                          <li key={j} className="font-body text-cream text-sm flex items-start gap-2">
                            <span className="text-terracotta mt-1">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'live-shopping' && (
              <div>
                <h2 className="font-display text-terracotta text-4xl mb-4" style={{ fontWeight: 300 }}>
                  {slide.content.title}
                </h2>
                <p className="font-body text-warm-gray text-lg mb-8">{slide.content.subtitle}</p>
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="grid grid-cols-2 gap-4">
                    {slide.content.features.map((feature, i) => (
                      <div key={i} className="p-4 border border-warm-gray/20">
                        <feature.icon className="w-8 h-8 text-terracotta mb-3" />
                        <h3 className="font-display text-cream text-base mb-1" style={{ fontWeight: 400 }}>
                          {feature.title}
                        </h3>
                        <p className="font-body text-warm-gray text-xs">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col justify-center gap-4">
                    {slide.content.stats.map((stat, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-terracotta/10">
                        <span className="font-display text-terracotta text-3xl" style={{ fontWeight: 300 }}>
                          {stat.value}
                        </span>
                        <span className="font-body text-cream text-sm">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {slide.type === 'journey' && (
              <div>
                <h2 className="font-display text-terracotta text-4xl mb-12 text-center" style={{ fontWeight: 300 }}>
                  {slide.content.title}
                </h2>
                <div className="flex flex-wrap justify-center gap-4">
                  {slide.content.stages.map((stage, i) => (
                    <div key={i} className="flex items-center">
                      <div className="text-center p-6 border border-warm-gray/20 w-48">
                        <div className="w-10 h-10 bg-terracotta text-cream font-display text-lg flex items-center justify-center mx-auto mb-3" style={{ fontWeight: 300 }}>
                          {stage.step}
                        </div>
                        <h3 className="font-display text-cream text-lg mb-2" style={{ fontWeight: 400 }}>
                          {stage.title}
                        </h3>
                        <p className="font-body text-warm-gray text-sm">{stage.desc}</p>
                      </div>
                      {i < slide.content.stages.length - 1 && (
                        <ChevronRight className="w-6 h-6 text-warm-gray/30 hidden md:block" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'discretion' && (
              <div>
                <h2 className="font-display text-terracotta text-4xl mb-4" style={{ fontWeight: 300 }}>
                  {slide.content.title}
                </h2>
                <p className="font-body text-warm-gray text-lg mb-12">{slide.content.subtitle}</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {slide.content.features.map((feature, i) => (
                    <div key={i} className="p-6 border border-warm-gray/20 hover:border-terracotta transition-colors text-center">
                      <feature.icon className="w-10 h-10 text-terracotta mx-auto mb-4" />
                      <h3 className="font-display text-cream text-lg mb-2" style={{ fontWeight: 400 }}>
                        {feature.title}
                      </h3>
                      <p className="font-body text-warm-gray text-sm">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'tech' && (
              <div>
                <h2 className="font-display text-terracotta text-4xl mb-4" style={{ fontWeight: 300 }}>
                  {slide.content.title}
                </h2>
                <p className="font-body text-warm-gray text-lg mb-8">{slide.content.subtitle}</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {slide.content.stack.map((item, i) => (
                    <div key={i} className="p-4 bg-warm-gray/5 border border-warm-gray/10">
                      <h3 className="font-display text-terracotta text-sm uppercase tracking-wider mb-2" style={{ fontWeight: 400 }}>
                        {item.layer}
                      </h3>
                      <p className="font-body text-cream text-sm">{item.tech}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'market' && (
              <div>
                <h2 className="font-display text-terracotta text-4xl mb-12" style={{ fontWeight: 300 }}>
                  {slide.content.title}
                </h2>
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                  <div className="p-8 border border-terracotta text-center">
                    <div className="font-display text-terracotta text-5xl mb-2" style={{ fontWeight: 300 }}>
                      {slide.content.tam.value}
                    </div>
                    <div className="font-body text-cream">{slide.content.tam.label}</div>
                  </div>
                  <div className="p-8 border border-warm-gray/20 text-center">
                    <div className="font-display text-cream text-5xl mb-2" style={{ fontWeight: 300 }}>
                      {slide.content.sam.value}
                    </div>
                    <div className="font-body text-warm-gray">{slide.content.sam.label}</div>
                  </div>
                  <div className="p-8 border border-warm-gray/20 text-center">
                    <div className="font-display text-cream text-5xl mb-2" style={{ fontWeight: 300 }}>
                      {slide.content.growth}
                    </div>
                    <div className="font-body text-warm-gray">Annual Growth Rate</div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {slide.content.trends.map((trend, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-warm-gray/5">
                      <TrendingUp className="w-5 h-5 text-terracotta" />
                      <span className="font-body text-cream text-sm">{trend}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'competitive' && (
              <div>
                <h2 className="font-display text-terracotta text-4xl mb-8" style={{ fontWeight: 300 }}>
                  {slide.content.title}
                </h2>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {slide.content.vs.map((item, i) => (
                    <div key={i} className="p-4 border border-warm-gray/20">
                      <div className="font-body text-warm-gray text-sm mb-1">vs. {item.competitor}</div>
                      <div className="font-body text-cream">{item.ours}</div>
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-terracotta/10 border border-terracotta/30">
                  <h3 className="font-display text-cream text-lg mb-4" style={{ fontWeight: 400 }}>
                    Key Differentiators
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {slide.content.differentiators.map((diff, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-terracotta" />
                        <span className="font-body text-cream text-sm">{diff}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {slide.type === 'business' && (
              <div>
                <h2 className="font-display text-terracotta text-4xl mb-8" style={{ fontWeight: 300 }}>
                  {slide.content.title}
                </h2>
                <div className="space-y-4">
                  {slide.content.streams.map((stream, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-warm-gray/20 hover:border-terracotta transition-colors">
                      <div className="flex-1">
                        <h3 className="font-display text-cream text-lg" style={{ fontWeight: 400 }}>
                          {stream.name}
                        </h3>
                        <p className="font-body text-warm-gray text-sm">{stream.desc}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-terracotta text-xl" style={{ fontWeight: 300 }}>
                          {stream.margin}
                        </div>
                        <div className="font-body text-warm-gray text-xs">margin</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'traction' && (
              <div>
                <h2 className="font-display text-terracotta text-4xl mb-8" style={{ fontWeight: 300 }}>
                  {slide.content.title}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                  {slide.content.metrics.map((metric, i) => (
                    <div key={i} className="text-center p-6 border border-warm-gray/20">
                      <div className="font-display text-terracotta text-4xl mb-2" style={{ fontWeight: 300 }}>
                        {metric.value}
                      </div>
                      <div className="font-body text-warm-gray text-sm">{metric.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {slide.content.completed.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-warm-gray/5">
                      <div className="w-6 h-6 bg-terracotta flex items-center justify-center">
                        <svg className="w-4 h-4 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="font-body text-cream text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'roadmap' && (
              <div>
                <h2 className="font-display text-terracotta text-4xl mb-8" style={{ fontWeight: 300 }}>
                  {slide.content.title}
                </h2>
                <div className="space-y-4">
                  {slide.content.phases.map((phase, i) => (
                    <div key={i} className="flex gap-6 items-start">
                      <div className="w-24 text-right">
                        <div className="font-display text-cream" style={{ fontWeight: 400 }}>{phase.phase}</div>
                        <div className={`font-body text-xs ${
                          phase.status === 'Complete' ? 'text-green-500' :
                          phase.status === 'In Progress' ? 'text-terracotta' : 'text-warm-gray'
                        }`}>
                          {phase.status}
                        </div>
                      </div>
                      <div className={`w-3 h-3 mt-1.5 ${
                        phase.status === 'Complete' ? 'bg-green-500' :
                        phase.status === 'In Progress' ? 'bg-terracotta' : 'bg-warm-gray/30'
                      }`} />
                      <div className="flex-1 flex flex-wrap gap-2">
                        {phase.items.map((item, j) => (
                          <span key={j} className="px-3 py-1 bg-warm-gray/10 font-body text-cream text-sm">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'ask' && (
              <div>
                <h2 className="font-display text-terracotta text-4xl mb-8" style={{ fontWeight: 300 }}>
                  {slide.content.title}
                </h2>
                <div className="text-center mb-12">
                  <div className="font-display text-terracotta text-6xl mb-2" style={{ fontWeight: 300 }}>
                    {slide.content.raise}
                  </div>
                  <div className="font-body text-warm-gray">Seed Round</div>
                </div>
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="font-display text-cream text-lg mb-4" style={{ fontWeight: 400 }}>
                      Use of Funds
                    </h3>
                    <div className="space-y-3">
                      {slide.content.use.map((item, i) => (
                        <div key={i}>
                          <div className="flex justify-between mb-1">
                            <span className="font-body text-cream text-sm">{item.category}</span>
                            <span className="font-body text-terracotta text-sm">{item.percent}%</span>
                          </div>
                          <div className="h-2 bg-warm-gray/10">
                            <div className="h-full bg-terracotta" style={{ width: `${item.percent}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-cream text-lg mb-4" style={{ fontWeight: 400 }}>
                      Key Milestones
                    </h3>
                    <div className="space-y-3">
                      {slide.content.milestones.map((milestone, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-warm-gray/5">
                          <Target className="w-5 h-5 text-terracotta" />
                          <span className="font-body text-cream text-sm">{milestone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {slide.type === 'closing' && (
              <div className="text-center py-20">
                <h1 
                  className="font-display text-terracotta mb-6"
                  style={{ fontSize: 'clamp(4rem, 12vw, 10rem)', fontWeight: 300, letterSpacing: '0.1em' }}
                >
                  {slide.content.headline}
                </h1>
                <p 
                  className="font-display text-cream mb-8"
                  style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 300 }}
                >
                  {slide.content.tagline}
                </p>
                <div className="inline-block px-8 py-4 border border-terracotta mb-8">
                  <span className="font-body text-terracotta text-lg">{slide.content.cta}</span>
                </div>
                <p className="font-body text-warm-gray">{slide.content.contact}</p>
              </div>
            )}
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2 h-2 transition-colors ${
                i === currentSlide ? 'bg-terracotta' : 'bg-warm-gray/30'
              }`}
            />
          ))}
        </div>

        {/* Keyboard Hints */}
        <div className="fixed bottom-6 right-6 font-body text-warm-gray/50 text-xs">
          Use arrow keys or spacebar to navigate
        </div>
      </div>
    </ClientWrapper>
  )
}

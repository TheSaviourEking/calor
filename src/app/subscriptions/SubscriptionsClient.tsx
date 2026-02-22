'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { 
  Gift, Check, Star, ChevronRight, Loader2, Package, 
  Truck, Pause, Play, Calendar, CreditCard, ArrowRight
} from 'lucide-react'

interface SubscriptionPlan {
  id: string
  slug: string
  name: string
  description: string
  shortDescription: string
  priceCents: number
  interval: string
  intervalCount: number
  features: string
  boxContents: string
  imageUrl: string | null
  _count?: { subscriptions: number }
}

interface Subscription {
  id: string
  status: string
  startDate: Date
  currentPeriodEnd: Date
  nextBoxDate: Date | null
  cancelAtPeriodEnd: boolean
  plan: SubscriptionPlan
  shippingAddress: any
  orders: any[]
}

export default function SubscriptionsClient() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [userSubscriptions, setUserSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [subscribing, setSubscribing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    fetchPlans()
    checkAuth()
  }, [])

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/subscriptions/plans')
      const data = await res.json()
      if (data.plans) {
        setPlans(data.plans.map((p: any) => ({
          ...p,
          features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features,
          boxContents: typeof p.boxContents === 'string' ? JSON.parse(p.boxContents) : p.boxContents
        })))
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    }
  }

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        setIsLoggedIn(true)
        const subRes = await fetch('/api/subscriptions')
        const subData = await subRes.json()
        if (subData.subscriptions) {
          setUserSubscriptions(subData.subscriptions.map((s: any) => ({
            ...s,
            plan: {
              ...s.plan,
              features: typeof s.plan.features === 'string' ? JSON.parse(s.plan.features) : s.plan.features,
              boxContents: typeof s.plan.boxContents === 'string' ? JSON.parse(s.plan.boxContents) : s.plan.boxContents
            }
          })))
        }
      }
    } catch (error) {
      // Not logged in
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!isLoggedIn) {
      window.location.href = '/account?redirect=/subscriptions'
      return
    }

    setSelectedPlan(plan)
    setSubscribing(true)

    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id })
      })
      
      const data = await res.json()
      if (data.success) {
        setShowSuccess(true)
        checkAuth() // Refresh subscriptions
      }
    } catch (error) {
      console.error('Failed to subscribe:', error)
    } finally {
      setSubscribing(false)
    }
  }

  const handleSubscriptionAction = async (subscriptionId: string, action: string) => {
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, action })
      })
      
      const data = await res.json()
      if (data.success) {
        checkAuth() // Refresh subscriptions
      }
    } catch (error) {
      console.error('Failed to update subscription:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-cream">
        <Loader2 className="h-8 w-8 animate-spin text-terracotta" />
      </div>
    )
  }

  if (showSuccess && selectedPlan) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-cream">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-terracotta/10 flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-terracotta" />
          </div>
          <h1 className="font-display text-charcoal text-3xl mb-4" style={{ fontWeight: 300 }}>
            Welcome to {selectedPlan.name}
          </h1>
          <p className="font-body text-warm-gray mb-6">
            Your first box will be curated and shipped soon. Get ready for a delightful experience.
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => {
                setShowSuccess(false)
                setSelectedPlan(null)
              }}
              className="border border-charcoal text-charcoal px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-charcoal hover:text-cream transition-colors"
            >
              Continue Browsing
            </button>
            <Link href="/account">
              <span className="bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors inline-block">
                Manage Subscription
              </span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 bg-cream">
      {/* Hero Section */}
      <div className="bg-charcoal py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center">
          <span className="eyebrow text-terracotta-light">Curated Monthly</span>
          <h1 
            className="font-display text-cream mt-4"
            style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)', fontWeight: 300 }}
          >
            Subscription Boxes
          </h1>
          <p className="font-body text-warm-gray max-w-2xl mx-auto mt-4">
            Discover new favorites with our expertly curated subscription boxes. 
            Premium products, discreet delivery, exceptional value.
          </p>
        </div>
      </div>

      {/* Active Subscriptions */}
      {isLoggedIn && userSubscriptions.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
          <h2 className="font-display text-charcoal text-2xl mb-6" style={{ fontWeight: 300 }}>Your Subscriptions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {userSubscriptions.map((sub) => (
              <div key={sub.id} className="bg-warm-white border border-sand p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>{sub.plan.name}</h3>
                    <p className="font-body text-warm-gray text-sm">
                      ${(sub.plan.priceCents / 100).toFixed(0)}/{sub.plan.interval === 'quarterly' ? 'quarter' : 'month'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 font-body text-xs ${
                    sub.status === 'active' ? 'bg-terracotta/10 text-terracotta' :
                    sub.status === 'paused' ? 'bg-sand text-warm-gray' :
                    'bg-sand text-warm-gray'
                  }`}>
                    {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 font-body text-warm-gray text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Next box: {sub.nextBoxDate ? format(new Date(sub.nextBoxDate), 'MMMM d, yyyy') : 'Processing'}</span>
                  </div>
                  <div className="flex items-center gap-2 font-body text-warm-gray text-sm">
                    <CreditCard className="h-4 w-4" />
                    <span>Renews: {format(new Date(sub.currentPeriodEnd), 'MMMM d, yyyy')}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-sand">
                  {sub.status === 'active' && (
                    <>
                      <button 
                        onClick={() => handleSubscriptionAction(sub.id, 'skip_next')}
                        className="px-4 py-2 border border-sand font-body text-xs uppercase tracking-wider hover:border-terracotta hover:text-terracotta transition-colors"
                      >
                        Skip Next
                      </button>
                      <button 
                        onClick={() => handleSubscriptionAction(sub.id, 'pause')}
                        className="px-4 py-2 border border-sand font-body text-xs uppercase tracking-wider hover:border-terracotta hover:text-terracotta transition-colors flex items-center gap-1"
                      >
                        <Pause className="h-3 w-3" />
                        Pause
                      </button>
                    </>
                  )}
                  {sub.status === 'paused' && (
                    <button 
                      onClick={() => handleSubscriptionAction(sub.id, 'resume')}
                      className="px-4 py-2 bg-charcoal text-cream font-body text-xs uppercase tracking-wider hover:bg-terracotta transition-colors flex items-center gap-1"
                    >
                      <Play className="h-3 w-3" />
                      Resume
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        <h2 className="font-display text-charcoal text-2xl mb-2" style={{ fontWeight: 300 }}>Choose Your Box</h2>
        <p className="font-body text-warm-gray mb-8">
          Select the perfect subscription for your wellness journey
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isPopular = plan.slug === 'intimacy-box'
            const isPremium = plan.slug === 'luxury-box'
            
            return (
              <div 
                key={plan.id} 
                className={`bg-warm-white border transition-colors ${
                  isPopular ? 'border-terracotta' : 'border-sand hover:border-terracotta/50'
                }`}
              >
                {isPopular && (
                  <div className="bg-terracotta text-cream px-3 py-1 font-body text-xs uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                {isPremium && (
                  <div className="bg-gold text-cream px-3 py-1 font-body text-xs uppercase tracking-wider">
                    Premium
                  </div>
                )}

                <div className="p-6">
                  <h3 className="font-display text-charcoal text-xl mb-2" style={{ fontWeight: 400 }}>{plan.name}</h3>
                  <p className="font-body text-warm-gray text-sm mb-4">
                    {plan.shortDescription}
                  </p>

                  <div className="mb-6">
                    <span className="font-display text-charcoal text-3xl" style={{ fontWeight: 400 }}>
                      ${(plan.priceCents / 100).toFixed(0)}
                    </span>
                    <span className="font-body text-warm-gray text-sm">
                      /{plan.interval === 'quarterly' ? 'quarter' : 'month'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-6">
                    {(typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features).slice(0, 5).map((feature: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-terracotta mt-0.5 flex-shrink-0" />
                        <span className="font-body text-charcoal text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    className={`w-full py-3 font-body text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                      isPopular 
                        ? 'bg-terracotta text-cream hover:bg-terracotta-light' 
                        : 'bg-charcoal text-cream hover:bg-terracotta'
                    }`}
                    onClick={() => handleSubscribe(plan)}
                    disabled={subscribing && selectedPlan?.id === plan.id}
                  >
                    {subscribing && selectedPlan?.id === plan.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Subscribe
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* What's Inside */}
                <div className="px-6 pb-6 pt-4 border-t border-sand bg-sand/20">
                  <p className="font-body text-xs uppercase tracking-wider text-warm-gray mb-3">
                    What's Inside
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(typeof plan.boxContents === 'string' ? JSON.parse(plan.boxContents) : plan.boxContents).slice(0, 4).map((item: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-warm-white font-body text-xs text-charcoal">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-sand/30 py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <h2 className="font-display text-charcoal text-2xl text-center mb-12" style={{ fontWeight: 300 }}>How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Gift, title: "Choose Your Box", desc: "Select the subscription that fits your preferences" },
              { icon: Package, title: "We Curate", desc: "Our experts handpick premium products just for you" },
              { icon: Truck, title: "Discreet Delivery", desc: "Shipped in plain packaging to your door" },
              { icon: Star, title: "Enjoy & Repeat", desc: "Discover new favorites every month" }
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-terracotta/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-6 w-6 text-terracotta" />
                </div>
                <h3 className="font-body text-charcoal font-medium mb-2">{step.title}</h3>
                <p className="font-body text-warm-gray text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-16">
        <h2 className="font-display text-charcoal text-2xl text-center mb-8" style={{ fontWeight: 300 }}>Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            { q: "Can I cancel anytime?", a: "Yes! You can cancel your subscription at any time. If you cancel, you'll still receive any boxes you've already paid for." },
            { q: "Is shipping discreet?", a: "Absolutely. All packages are shipped in plain, unmarked boxes with no indication of contents." },
            { q: "Can I skip a month?", a: "Yes, you can skip any upcoming box from your account page. There's no limit to how many times you can skip." },
            { q: "What if I'm not satisfied?", a: "We offer a satisfaction guarantee. If you're not happy with your box, contact us and we'll make it right." }
          ].map((faq, i) => (
            <details key={i} className="group bg-warm-white border border-sand">
              <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                <span className="font-body text-charcoal">{faq.q}</span>
                <ChevronRight className="h-4 w-4 text-warm-gray transition-transform group-open:rotate-90" />
              </summary>
              <p className="px-4 pb-4 font-body text-warm-gray text-sm">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { 
  Heart, User, Mail, Loader2, Check, X, Link2, Users, 
  Gift, ShoppingCart, Settings
} from 'lucide-react'
import { toast } from 'sonner'

interface Partner {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface CouplesLink {
  id: string
  customer1: Partner
  customer2: Partner
  status: string
  requestedById: string
  createdAt: string
  acceptedAt?: string
  sharedWishlist: boolean
  sharedOrders: boolean
}

export default function CoupleClient() {
  const [loading, setLoading] = useState(true)
  const [activeLink, setActiveLink] = useState<CouplesLink | null>(null)
  const [pendingInvitations, setPendingInvitations] = useState<CouplesLink[]>([])
  const [sentInvitation, setSentInvitation] = useState<CouplesLink | null>(null)
  const [customerId, setCustomerId] = useState<string | null>(null)
  
  // Form state
  const [partnerEmail, setPartnerEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/couples')
      const data = await res.json()
      setCustomerId(data.customerId)
      setActiveLink(data.activeLink || null)
      setPendingInvitations(data.pendingInvitations || [])
      
      // Find sent invitation (where user is customer1 and status is pending)
      const sent = data.links?.find(
        (l: CouplesLink) => l.customer1.id === data.customerId && l.status === 'pending'
      )
      setSentInvitation(sent || null)
    } catch (error) {
      console.error('Failed to fetch couples data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!partnerEmail) {
      toast.error('Please enter your partner\'s email')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/couples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerEmail })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setSentInvitation(data.link)
        setPartnerEmail('')
      } else {
        toast.error(data.error || 'Failed to send invitation')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAction = async (linkId: string, action: 'accept' | 'reject' | 'unlink' | 'cancel') => {
    try {
      const res = await fetch('/api/couples', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId, action })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        fetchData()
      } else {
        toast.error(data.error || 'Failed')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 
          className="font-display text-charcoal mb-2"
          style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 300 }}
        >
          Couples Account
        </h1>
        <p className="font-body text-warm-gray">Link accounts with your partner for shared experiences</p>
      </div>

      {/* Active Link */}
      {activeLink && (
        <div className="bg-warm-white border border-sand p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-terracotta/10 flex items-center justify-center">
              <Heart className="h-6 w-6 text-terracotta" />
            </div>
            <div>
              <h2 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                Linked with {activeLink.customer1.id === customerId 
                  ? `${activeLink.customer2.firstName} ${activeLink.customer2.lastName}`
                  : `${activeLink.customer1.firstName} ${activeLink.customer1.lastName}`}
              </h2>
              <p className="font-body text-warm-gray text-sm">
                Since {activeLink.acceptedAt ? format(new Date(activeLink.acceptedAt), 'MMMM d, yyyy') : 'Recently'}
              </p>
            </div>
          </div>

          {/* Shared Features */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-cream border border-sand">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="h-4 w-4 text-terracotta" />
                <span className="font-body text-charcoal text-sm">Shared Wishlist</span>
              </div>
              <p className="font-body text-warm-gray text-xs">
                {activeLink.sharedWishlist ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div className="p-4 bg-cream border border-sand">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="h-4 w-4 text-terracotta" />
                <span className="font-body text-charcoal text-sm">Shared Orders</span>
              </div>
              <p className="font-body text-warm-gray text-xs">
                {activeLink.sharedOrders ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div className="p-4 bg-cream border border-sand">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-terracotta" />
                <span className="font-body text-charcoal text-sm">Couple Perks</span>
              </div>
              <p className="font-body text-warm-gray text-xs">
                Exclusive discounts
              </p>
            </div>
          </div>

          <button
            onClick={() => handleAction(activeLink.id, 'unlink')}
            className="border border-sand px-4 py-2 font-body text-sm hover:border-terracotta hover:text-terracotta transition-colors"
          >
            Unlink Account
          </button>
        </div>
      )}

      {/* Pending Invitations Received */}
      {!activeLink && pendingInvitations.length > 0 && (
        <div className="bg-warm-white border border-sand p-6 mb-8">
          <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
            Pending Invitation
          </h2>
          {pendingInvitations.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between p-4 bg-cream border border-sand">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sand flex items-center justify-center">
                  <User className="h-5 w-5 text-warm-gray" />
                </div>
                <div>
                  <p className="font-body text-charcoal">
                    {inv.customer1.firstName} {inv.customer1.lastName}
                  </p>
                  <p className="font-body text-warm-gray text-xs">
                    Sent {format(new Date(inv.createdAt), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(inv.id, 'reject')}
                  className="border border-sand px-4 py-2 font-body text-sm hover:border-ember hover:text-ember transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleAction(inv.id, 'accept')}
                  className="bg-charcoal text-cream px-4 py-2 font-body text-sm hover:bg-terracotta transition-colors"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sent Invitation Pending */}
      {!activeLink && sentInvitation && (
        <div className="bg-warm-white border border-sand p-6 mb-8">
          <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
            Invitation Sent
          </h2>
          <div className="flex items-center justify-between p-4 bg-cream border border-sand">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sand flex items-center justify-center">
                <Mail className="h-5 w-5 text-warm-gray" />
              </div>
              <div>
                <p className="font-body text-charcoal">
                  {sentInvitation.customer2.email}
                </p>
                <p className="font-body text-warm-gray text-xs">
                  Waiting for response
                </p>
              </div>
            </div>
            <button
              onClick={() => handleAction(sentInvitation.id, 'cancel')}
              className="border border-sand px-4 py-2 font-body text-sm hover:border-ember hover:text-ember transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Send Invitation Form */}
      {!activeLink && !sentInvitation && (
        <div className="bg-warm-white border border-sand p-6">
          <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
            Link with Your Partner
          </h2>
          <p className="font-body text-warm-gray text-sm mb-6">
            Enter your partner's email address to send a couples account invitation. 
            They must have a CALŌR account to accept.
          </p>

          <form onSubmit={handleSendInvitation} className="space-y-4">
            <div>
              <label className="font-body text-charcoal text-sm block mb-2">
                Partner's Email Address
              </label>
              <input
                type="email"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder="partner@example.com"
                className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Send Invitation
                </>
              )}
            </button>
          </form>

          {/* Benefits */}
          <div className="mt-8 pt-6 border-t border-sand">
            <h3 className="font-body text-charcoal mb-4">Couples Account Benefits</h3>
            <div className="space-y-3">
              {[
                { icon: Gift, text: 'Shared wishlist for gifts' },
                { icon: Heart, text: 'See each other\'s favorites' },
                { icon: Users, text: 'Exclusive couple discounts' },
                { icon: Settings, text: 'Coordinate preferences' }
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <benefit.icon className="h-4 w-4 text-terracotta" />
                  <span className="font-body text-warm-gray text-sm">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

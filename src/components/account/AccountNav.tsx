'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  User, 
  Package, 
  Heart, 
  Star, 
  Bell, 
  Shield, 
  MonitorSmartphone,
  Users,
  Gift,
  Calendar,
  RefreshCw,
  Settings,
  MessageSquare,
  Crown,
  Sparkles,
  Activity,
  Flame,
  Gamepad2
} from 'lucide-react'

const accountLinks = [
  { label: 'Wellness Dashboard', href: '/account/wellness', icon: Flame, highlight: true },
  { label: 'Smart Toys', href: '/account/toys', icon: Gamepad2, highlight: true },
  { label: 'Gift Registry', href: '/registry', icon: Gift },
  { label: 'Orders', href: '/account/orders', icon: Package },
  { label: 'Wishlist', href: '/account/wishlist', icon: Heart },
  { label: 'VIP Status', href: '/account/vip', icon: Crown },
  { label: 'Rewards Store', href: '/account/rewards', icon: Sparkles },
  { label: 'Loyalty Points', href: '/account/loyalty', icon: Star },
  { label: 'Referrals', href: '/account/referrals', icon: Users },
  { label: 'Subscriptions', href: '/subscriptions', icon: Calendar },
  { label: 'Consultations', href: '/consultations', icon: Calendar },
  { label: 'Returns', href: '/returns', icon: RefreshCw },
  { label: 'Support', href: '/account/support', icon: MessageSquare },
  { label: 'Couple Account', href: '/account/couple', icon: Heart },
  { label: 'Packaging', href: '/account/packaging', icon: Settings },
  { label: 'Alerts', href: '/account/alerts', icon: Bell },
  { label: 'Security', href: '/account/security', icon: Shield },
  { label: 'Sessions', href: '/account/sessions', icon: MonitorSmartphone },
]

export default function AccountNav() {
  const pathname = usePathname()

  return (
    <div className="bg-warm-white border border-sand p-4">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-sand">
        <div className="w-10 h-10 bg-terracotta/10 flex items-center justify-center">
          <User className="w-5 h-5 text-terracotta" />
        </div>
        <div>
          <p className="font-display text-charcoal text-sm" style={{ fontWeight: 400 }}>
            My Account
          </p>
          <p className="font-body text-warm-gray text-xs">Manage your preferences</p>
        </div>
      </div>
      
      <nav className="space-y-1">
        {accountLinks.map((link) => {
          const isActive = pathname === link.href
          const Icon = link.icon
          const isHighlight = 'highlight' in link && link.highlight
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 transition-colors ${
                isActive
                  ? 'bg-terracotta/10 text-terracotta'
                  : isHighlight
                    ? 'bg-terracotta text-cream hover:bg-terracotta/90'
                    : 'text-warm-gray hover:bg-sand/50 hover:text-charcoal'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-body text-sm">{link.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

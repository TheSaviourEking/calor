'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Package, Heart, Gift, Star, Users,
  Bell, Shield, Menu, X, Crown, Headphones,
  Flame, Gamepad2, MonitorSmartphone
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import ClientWrapper from '@/components/layout/ClientWrapper'
import { Loader2 } from 'lucide-react'

const accountNavItems = [
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/account/vip', label: 'VIP Status', icon: Crown },
  { href: '/account/loyalty', label: 'Loyalty Points', icon: Star },
  { href: '/account/rewards', label: 'Rewards', icon: Gift },
  { href: '/account/referrals', label: 'Referrals', icon: Users },
  { href: '/account/couple', label: 'Couple Profile', icon: Heart },
  { href: '/account/wellness', label: 'Wellness', icon: Flame, highlight: true },
  { href: '/account/toys', label: 'Smart Toys', icon: Gamepad2, highlight: true },
  { href: '/account/packaging', label: 'Packaging', icon: Gift },
  { href: '/account/support', label: 'Support Tickets', icon: Headphones },
  { href: '/account/alerts', label: 'Alerts', icon: Bell },
  { href: '/account/security', label: 'Security', icon: Shield },
  { href: '/account/sessions', label: 'Sessions', icon: MonitorSmartphone },
]

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  // Login/register page doesn't need sidebar
  const isLoginPage = pathname === '/account'
  
  // Show sidebar for authenticated users on protected pages
  const showSidebar = !isLoading && isAuthenticated && !isLoginPage

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  // Loading state while hydrating
  if (isLoading) {
    return (
      <ClientWrapper>
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
        </div>
      </ClientWrapper>
    )
  }

  // Login page - just children with ClientWrapper
  if (isLoginPage) {
    return (
      <ClientWrapper>
        {children}
      </ClientWrapper>
    )
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return (
      <ClientWrapper>
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="text-center">
            <p className="font-body text-warm-gray mb-4">Please log in to access this page</p>
            <button 
              onClick={() => router.push('/account')}
              className="px-6 py-3 bg-terracotta text-cream font-body text-sm uppercase tracking-wider"
            >
              Go to Login
            </button>
          </div>
        </div>
      </ClientWrapper>
    )
  }

  // Authenticated pages - show sidebar layout
  return (
    <ClientWrapper>
      <div className="min-h-screen bg-cream flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed lg:static inset-y-0 left-0 z-50 w-64 bg-warm-white border-r border-sand transition-transform lg:translate-x-0`}>
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <Link href="/account/orders" className="font-display text-charcoal text-xl tracking-wider" style={{ fontWeight: 300 }}>
                My Account
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1 flex-1 overflow-y-auto">
              {accountNavItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                const isHighlight = 'highlight' in item && item.highlight
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 font-body text-sm transition-colors ${
                      active
                        ? 'bg-terracotta/10 text-terracotta border-l-2 border-terracotta'
                        : isHighlight
                          ? 'bg-terracotta text-cream hover:bg-terracotta/90'
                          : 'text-warm-gray hover:bg-sand/50 hover:text-charcoal'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Quick Links */}
            <div className="pt-6 mt-6 border-t border-sand">
              <Link
                href="/shop"
                className="flex items-center gap-3 px-4 py-3 font-body text-sm text-warm-gray hover:text-terracotta transition-colors"
              >
                <Package className="w-5 h-5" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 pt-20 lg:pt-8">
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mb-6 flex items-center gap-2 font-body text-charcoal"
          >
            <Menu className="w-5 h-5" />
            Menu
          </button>

          {children}
        </main>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-charcoal/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </ClientWrapper>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import ClientWrapper from '@/components/layout/ClientWrapper'
import { Loader2 } from 'lucide-react'
import AccountNav from '@/components/account/AccountNav'

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  // Login/register page doesn't need sidebar
  const isLoginPage = pathname === '/account'

  if (isLoginPage) {
    return (
      <ClientWrapper>
        {children}
      </ClientWrapper>
    )
  }

  if (isLoading) {
    return (
      <ClientWrapper>
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
        </div>
      </ClientWrapper>
    )
  }

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

  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20 bg-cream">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Mobile: horizontal scrollable tab nav */}
          <div className="lg:hidden mb-6 border-b border-sand">
            <MobileAccountNav pathname={pathname} />
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-28">
                <AccountNav />
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ClientWrapper>
  )
}

// Mobile-only horizontal tab bar
function MobileAccountNav({ pathname }: { pathname: string }) {
  const mobileLinks = [
    { label: 'Orders', href: '/account/orders' },
    { label: 'Wishlist', href: '/account/wishlist' },
    { label: 'Wellness', href: '/account/wellness' },
    { label: 'VIP', href: '/account/vip' },
    { label: 'Rewards', href: '/account/rewards' },
    { label: 'Referrals', href: '/account/referrals' },
    { label: 'Support', href: '/account/support' },
    { label: 'Security', href: '/account/security' },
    { label: 'Sessions', href: '/account/sessions' },
  ]

  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <div className="flex gap-0 whitespace-nowrap pb-0">
        {mobileLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-shrink-0 px-4 py-2.5 font-body text-xs uppercase tracking-wider transition-colors duration-200 border-b-2 ${
                isActive
                  ? 'text-terracotta border-terracotta'
                  : 'text-warm-gray border-transparent hover:text-charcoal'
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import ClientWrapper from '@/components/layout/ClientWrapper'
import { Loader2 } from 'lucide-react'
import AccountNav from '@/components/account/AccountNav'

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading, logout, customer } = useAuthStore()

  // Login/register page doesn't need sidebar
  const isLoginPage = pathname === '/account'

  // Show sidebar for authenticated users on protected pages
  const showSidebar = !isLoading && isAuthenticated && !isLoginPage

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
      <div className="min-h-screen pt-20 bg-cream">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed lg:static inset-y-0 left-0 z-50 w-64 bg-warm-white lg:bg-transparent lg:w-64 flex-shrink-0 border-r border-sand lg:border-none transition-transform lg:translate-x-0`}>
              <div className="p-6 lg:p-0 h-full flex flex-col">
                <div className="flex items-center justify-between mb-8 lg:hidden">
                  <Link href="/account/orders" className="font-display text-charcoal text-xl tracking-wider" style={{ fontWeight: 300 }}>
                    My Account
                  </Link>
                  <button onClick={() => setSidebarOpen(false)} className="text-charcoal">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 lg:overflow-visible lg:h-auto -mx-6 px-6 lg:mx-0 lg:px-0">
                  <AccountNav />
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
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
        </div>
      </div>
    </ClientWrapper>
  )
}

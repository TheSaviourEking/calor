'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Video, Plus, LayoutDashboard, Calendar, Settings, 
  Menu, X, ChevronLeft
} from 'lucide-react'
import ClientWrapper from '@/components/layout/ClientWrapper'

const hostNavItems = [
  { href: '/host/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/host/streams/new', label: 'Create Stream', icon: Plus },
]

export default function HostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Don't show sidebar on the root host page (it redirects)
  const isRootHost = pathname === '/host'

  // If root host page, just render children
  if (isRootHost) {
    return <ClientWrapper>{children}</ClientWrapper>
  }

  return (
    <ClientWrapper>
      <div className="min-h-screen bg-cream flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed lg:static inset-y-0 left-0 z-50 w-64 bg-charcoal transition-transform lg:translate-x-0`}>
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <Link href="/host/dashboard" className="font-display text-cream text-xl tracking-wider" style={{ fontWeight: 300 }}>
                Host Studio
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-cream">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1 flex-1">
              {hostNavItems.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 font-body text-sm transition-colors ${
                      active
                        ? 'bg-terracotta/10 text-terracotta'
                        : 'text-warm-gray hover:bg-warm-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Back to Account */}
            <div className="pt-6 mt-6 border-t border-warm-gray/20">
              <Link
                href="/account/orders"
                className="flex items-center gap-3 px-4 py-3 font-body text-sm text-warm-gray hover:text-terracotta transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Back to Account
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

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Gift, Plus, Settings, ChevronLeft, Menu, X
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import ClientWrapper from '@/components/layout/ClientWrapper'

const registryNavItems = [
  { href: '/registry', label: 'All Registries', icon: Gift },
]

export default function RegistryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { isAuthenticated } = useAuthStore()

  // Don't show sidebar on public registry view or new registry creation wizard
  const isPublicView = pathname.match(/\/registry\/[^/]+$/) && !pathname.includes('/manage')
  const isNewRegistry = pathname === '/registry/new'
  const showSidebar = isAuthenticated && !isPublicView && !isNewRegistry

  // If no sidebar should be shown, just render children
  if (!showSidebar) {
    return <ClientWrapper>{children}</ClientWrapper>
  }

  return (
    <ClientWrapper>
      <div className="min-h-screen bg-cream flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed lg:static inset-y-0 left-0 z-50 w-64 bg-warm-white border-r border-sand transition-transform lg:translate-x-0`}>
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <Link href="/registry" className="font-display text-charcoal text-xl tracking-wider" style={{ fontWeight: 300 }}>
                Gift Registry
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1 flex-1">
              <Link
                href="/registry"
                className={`flex items-center gap-3 px-4 py-3 font-body text-sm transition-colors ${
                  pathname === '/registry'
                    ? 'bg-terracotta/10 text-terracotta border-l-2 border-terracotta'
                    : 'text-warm-gray hover:bg-sand/50 hover:text-charcoal'
                }`}
              >
                <Gift className="w-5 h-5" />
                My Registries
              </Link>
              
              <Link
                href="/registry/new"
                className="flex items-center gap-3 px-4 py-3 font-body text-sm text-terracotta hover:bg-terracotta/5 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create New
              </Link>
            </nav>

            {/* Back to Account */}
            <div className="pt-6 mt-6 border-t border-sand">
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

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Package, ShoppingBag, Users, MessageSquare,
    BarChart3, Mail, Menu, X, Target, Code
} from 'lucide-react'

const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: Package },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/segments', label: 'Segments', icon: Target },
    { href: '/admin/support', label: 'Support Tickets', icon: MessageSquare },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/campaigns', label: 'Email Campaigns', icon: Mail },
    { href: '/admin/changelog', label: 'Dev Changelog', icon: Code },
]

export default function AdminLayoutClient({
    children,
}: {
    children: React.ReactNode
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const pathname = usePathname()

    const isActive = (href: string) => {
        if (href === '/admin') {
            return pathname === '/admin'
        }
        return pathname.startsWith(href)
    }

    return (
        <div className="min-h-screen bg-cream flex">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed lg:static inset-y-0 left-0 z-50 w-64 bg-charcoal transition-transform lg:translate-x-0`}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-8">
                        <Link href="/admin" className="font-display text-cream text-xl tracking-wider" style={{ fontWeight: 300 }}>
                            CALŌR Admin
                        </Link>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-cream">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <nav className="space-y-1">
                        {adminNavItems.map((item) => {
                            const Icon = item.icon
                            const active = isActive(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 font-body text-sm transition-colors ${active
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
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 lg:p-8">
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
    )
}

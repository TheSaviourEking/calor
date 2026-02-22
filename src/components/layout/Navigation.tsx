'use client'

import { useState, useEffect } from 'react'
import { Search, User, ShoppingBag, Menu, X, Heart, Radio } from 'lucide-react'
import { useCartStore, useWishlistStore } from '@/stores'
import SearchModal from './SearchModal'
import Link from 'next/link'

const navLinks = [
  { label: 'Shop', href: '/shop' },
  { label: 'Live', href: '/live', icon: Radio },
  { label: 'Features', href: '/features' },
  { label: 'Quiz', href: '/quiz' },
  { label: 'Subscriptions', href: '/subscriptions' },
  { label: 'Consultations', href: '/consultations' },
  { label: 'Gifts', href: '/gifts' },
]

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { toggleCart, getItemCount } = useCartStore()
  const { items: wishlistItems } = useWishlistStore()
  const itemCount = getItemCount()
  const wishlistCount = wishlistItems.length

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'bg-warm-white/92 backdrop-blur-xl border-b border-sand'
          : 'bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="font-display text-charcoal text-xl lg:text-2xl tracking-[0.3em]"
              style={{ fontWeight: 300 }}
            >
              CALŌR
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="font-body text-sm text-mid-gray tracking-wider uppercase transition-colors duration-300 hover:text-terracotta relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-px bg-terracotta transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-4 lg:gap-6">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-charcoal hover:text-terracotta transition-colors duration-300"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <Link
                href="/account"
                className="text-charcoal hover:text-terracotta transition-colors duration-300 hidden sm:block"
                aria-label="Account"
              >
                <User className="w-5 h-5" />
              </Link>
              <Link
                href="/account/wishlist"
                className="text-charcoal hover:text-terracotta transition-colors duration-300 relative hidden sm:block"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-terracotta text-warm-white text-[10px] font-body font-medium flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <button
                onClick={toggleCart}
                className="text-charcoal hover:text-terracotta transition-colors duration-300 relative"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-terracotta text-warm-white text-[10px] font-body font-medium flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden text-charcoal hover:text-terracotta transition-colors duration-300"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-charcoal">
          <div className="flex flex-col h-full p-6">
            <div className="flex justify-between items-center mb-12">
              <span
                className="font-display text-cream text-xl tracking-[0.3em]"
                style={{ fontWeight: 300 }}
              >
                CALŌR
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-cream hover:text-terracotta transition-colors"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="font-display text-cream text-2xl tracking-wider transition-colors duration-300 hover:text-terracotta"
                  style={{ fontWeight: 300 }}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-display text-cream text-2xl tracking-wider transition-colors duration-300 hover:text-terracotta"
                style={{ fontWeight: 300 }}
              >
                Account
              </Link>
              <Link
                href="/account/wishlist"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-display text-cream text-2xl tracking-wider transition-colors duration-300 hover:text-terracotta flex items-center gap-3"
                style={{ fontWeight: 300 }}
              >
                Wishlist
                {wishlistCount > 0 && (
                  <span className="text-sm font-body text-terracotta">({wishlistCount})</span>
                )}
              </Link>
            </div>
            <div className="mt-auto">
              <p className="font-body text-warm-gray text-sm tracking-wider">
                Warmth lives here
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}

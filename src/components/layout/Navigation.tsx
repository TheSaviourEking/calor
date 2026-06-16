'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, User, ShoppingBag, Menu, X, Heart, Radio, ChevronDown } from 'lucide-react'
import { useCartStore, useWishlistStore } from '@/stores'
import SearchModal from './SearchModal'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { label: 'Shop', href: '/shop', hasDropdown: true },
  { label: 'Live', href: '/live', icon: Radio },
  { label: 'Features', href: '/features' },
  { label: 'Quiz', href: '/quiz' },
  { label: 'Subscriptions', href: '/subscriptions' },
  { label: 'Consultations', href: '/consultations' },
  { label: 'Gifts', href: '/gifts' },
]

const shopCategories = [
  { label: 'Intimacy & Toys', href: '/shop/intimacy-toys' },
  { label: 'Wellness & Body', href: '/shop/wellness-body' },
  { label: 'Lingerie & Apparel', href: '/shop/lingerie-apparel' },
  { label: 'Adult Fiction', href: '/shop/adult-fiction' },
  { label: 'Education & Media', href: '/shop/education-media' },
  { label: 'Couples & Connection', href: '/shop/couples' },
  { label: 'Sexual Health', href: '/shop/sexual-health' },
  { label: 'Kink & Fetish', href: '/shop/kink-fetish' },
]

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false)
  const [cartBounce, setCartBounce] = useState(false)
  const prevItemCount = useRef(0)
  const pathname = usePathname()

  const { toggleCart, getItemCount } = useCartStore()
  const { items: wishlistItems } = useWishlistStore()
  const itemCount = getItemCount()
  const wishlistCount = wishlistItems.length

  const handleScroll = useCallback(() => {
    const scrolled = window.scrollY > 50
    setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev))
  }, [])

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [handleScroll])

  // Cart bounce notification when item count increases
  // Using setTimeout to avoid calling setState synchronously in the effect body
  useEffect(() => {
    if (itemCount > prevItemCount.current) {
      const t1 = setTimeout(() => setCartBounce(true), 0)
      const t2 = setTimeout(() => setCartBounce(false), 650)
      prevItemCount.current = itemCount
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
    prevItemCount.current = itemCount
  }, [itemCount])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-warm-white/92 backdrop-blur-xl border-b border-sand'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="font-display text-charcoal text-xl lg:text-2xl tracking-[0.3em] transition-all duration-300 hover:tracking-[0.35em]"
              style={{ fontWeight: 300 }}
            >
              CALŌR
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => {
                const active = isActive(link.href)
                if (link.hasDropdown) {
                  return (
                    <div
                      key={link.label}
                      className="relative"
                      onMouseEnter={() => setShopDropdownOpen(true)}
                      onMouseLeave={() => setShopDropdownOpen(false)}
                    >
                      <Link
                        href={link.href}
                        className={`font-body text-sm tracking-wider uppercase transition-colors duration-300 relative group flex items-center gap-1 ${
                          active ? 'text-terracotta' : 'text-mid-gray hover:text-terracotta'
                        }`}
                      >
                        {link.label}
                        <ChevronDown
                          className={`w-3 h-3 transition-transform duration-200 ${
                            shopDropdownOpen ? 'rotate-180' : ''
                          }`}
                        />
                        {/* Animated underline */}
                        <span
                          className={`absolute bottom-0 left-0 h-px bg-terracotta transition-all duration-300 ${
                            active ? 'w-full' : 'w-0 group-hover:w-full'
                          }`}
                        />
                      </Link>

                      {/* Shop dropdown — outer div bridges the gap so mouse doesn't exit hover zone */}
                      <div
                        className={`absolute top-full left-1/2 -translate-x-1/2 w-56 pt-2 transition-all duration-200 ${
                          shopDropdownOpen
                            ? 'opacity-100 translate-y-0 pointer-events-auto'
                            : 'opacity-0 -translate-y-2 pointer-events-none'
                        }`}
                      >
                        <div className="bg-warm-white border-b-2 border-terracotta shadow-lg">
                          <div className="py-2">
                            {shopCategories.map((cat) => (
                              <Link
                                key={cat.href}
                                href={cat.href}
                                onClick={() => setShopDropdownOpen(false)}
                                className="block px-4 py-2.5 font-body text-sm text-mid-gray hover:text-terracotta hover:bg-cream transition-colors duration-200"
                              >
                                {cat.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`font-body text-sm tracking-wider uppercase transition-colors duration-300 hover:text-terracotta relative group ${
                      active ? 'text-terracotta' : 'text-mid-gray'
                    }`}
                  >
                    {link.label}
                    <span
                      className={`absolute bottom-0 left-0 h-px bg-terracotta transition-all duration-300 ${
                        active ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </Link>
                )
              })}
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
                <ShoppingBag
                  className={`w-5 h-5 ${cartBounce ? 'animate-bounce-once' : ''}`}
                />
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
              {navLinks.map((link, index) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="font-display text-cream text-2xl tracking-wider transition-colors duration-300 hover:text-terracotta animate-word-in"
                  style={{
                    fontWeight: 300,
                    animationDelay: `${index * 60}ms`,
                  }}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-display text-cream text-2xl tracking-wider transition-colors duration-300 hover:text-terracotta animate-word-in"
                style={{ fontWeight: 300, animationDelay: `${navLinks.length * 60}ms` }}
              >
                Account
              </Link>
              <Link
                href="/account/wishlist"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-display text-cream text-2xl tracking-wider transition-colors duration-300 hover:text-terracotta flex items-center gap-3 animate-word-in"
                style={{ fontWeight: 300, animationDelay: `${(navLinks.length + 1) * 60}ms` }}
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

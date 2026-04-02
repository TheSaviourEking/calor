'use client'

import { useState, useEffect } from 'react'

interface ConsentState {
  essential: boolean
  analytics: boolean
}

export default function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = document.cookie
      .split('; ')
      .find(row => row.startsWith('calor_consent='))
    if (!consent) {
      // Small delay so it doesn't flash on initial load
      const timer = setTimeout(() => setShow(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  function acceptAll() {
    saveConsent({ essential: true, analytics: true })
  }

  function acceptEssential() {
    saveConsent({ essential: true, analytics: false })
  }

  function saveConsent(consent: ConsentState) {
    const value = JSON.stringify(consent)
    const maxAge = 365 * 24 * 60 * 60 // 1 year
    document.cookie = `calor_consent=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-charcoal border-t border-warm-white/10 p-4 md:p-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex-1">
          <p className="font-body text-cream text-sm leading-relaxed">
            We use essential cookies for site functionality and age verification.
            Optional cookies help us improve your experience.{' '}
            <a href="/legal/privacy" className="text-terracotta hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={acceptEssential}
            className="px-5 py-2.5 border border-warm-white/20 text-cream font-body text-sm uppercase tracking-wider hover:border-warm-white/40 transition-colors"
          >
            Essential Only
          </button>
          <button
            onClick={acceptAll}
            className="px-5 py-2.5 bg-terracotta text-warm-white font-body text-sm uppercase tracking-wider hover:bg-terracotta/90 transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}

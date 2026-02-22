'use client'

import { useState } from 'react'
import { Globe, X } from 'lucide-react'
import { useLocaleStore, LOCALE_CONFIG, type Locale } from '@/stores'

interface CountryModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CountryModal({ isOpen, onClose }: CountryModalProps) {
  const { locale, setLocale } = useLocaleStore()
  const [selected, setSelected] = useState<Locale>(locale)
  const [search, setSearch] = useState('')

  const locales = Object.values(LOCALE_CONFIG).filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleConfirm = () => {
    setLocale(selected)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-warm-white max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-sand">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-terracotta" />
            <h2 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
              Where are you shopping from?
            </h2>
          </div>
          <button onClick={onClose} className="text-warm-gray hover:text-charcoal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-sand">
          <input
            type="text"
            placeholder="Search country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
          />
        </div>

        {/* Countries */}
        <div className="max-h-64 overflow-y-auto p-4">
          <div className="space-y-1">
            {locales.map((l) => (
              <button
                key={l.locale}
                onClick={() => setSelected(l.locale)}
                className={`w-full flex items-center justify-between p-3 transition-colors ${
                  selected === l.locale ? 'bg-terracotta/10 border border-terracotta' : 'hover:bg-cream'
                }`}
              >
                <span className="font-body text-charcoal text-sm">{l.name}</span>
                <span className="font-body text-warm-gray text-sm">{l.symbol}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-sand">
          <button
            onClick={handleConfirm}
            className="w-full bg-charcoal text-cream py-3 font-body text-sm uppercase tracking-wider transition-colors hover:bg-terracotta"
          >
            Continue
          </button>
          <p className="font-body text-warm-gray text-xs text-center mt-4">
            You can change this anytime in the footer.
          </p>
        </div>
      </div>
    </div>
  )
}

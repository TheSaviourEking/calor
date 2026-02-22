'use client'

import { ChevronDown } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col lg:flex-row">
      {/* Left Content */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-16 py-16 lg:py-24 relative z-10">
        {/* Eyebrow */}
        <span className="eyebrow mb-6">Intimacy & Wellness</span>
        
        {/* Headline */}
        <h1 className="font-display font-light leading-[0.95] mb-6" style={{ fontSize: 'clamp(3rem, 5vw, 5.5rem)' }}>
          Where{' '}
          <span className="italic text-terracotta">warmth</span>
          <br />
          lives in every touch.
        </h1>
        
        {/* Subtitle */}
        <p className="font-body font-light text-lg text-warm-gray max-w-md mb-10 leading-relaxed">
          An elevated destination for intimacy, wellness, and pleasure. Curated with care. Delivered discreetly.
        </p>
        
        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button className="bg-charcoal text-cream px-8 py-4 font-body font-medium text-sm tracking-wider uppercase transition-all duration-300 hover:bg-terracotta">
            Explore Collection
          </button>
          <button className="border border-charcoal text-charcoal px-8 py-4 font-body font-medium text-sm tracking-wider uppercase transition-all duration-300 hover:bg-charcoal hover:text-cream">
            Shop Gift Sets
          </button>
        </div>
      </div>

      {/* Right Visual Panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-cream via-sand to-blush">
        {/* Decorative oversized initial letter */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="font-display font-light select-none"
            style={{ 
              fontSize: '12rem', 
              color: 'rgba(196, 120, 90, 0.15)',
              lineHeight: 1 
            }}
          >
            C
          </span>
        </div>
        
        {/* Rotating badge */}
        <div className="absolute bottom-12 right-12">
          <RotatingBadge />
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="relative h-12 w-[2px] bg-sand overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-terracotta animate-scroll-pulse" />
        </div>
        <ChevronDown className="w-4 h-4 text-terracotta animate-bounce" />
      </div>
    </section>
  )
}

function RotatingBadge() {
  return (
    <div className="relative w-24 h-24 animate-spin-slow">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <path
            id="circlePath"
            d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
          />
        </defs>
        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(196, 120, 90, 0.2)" />
        <text fill="#C4785A" className="font-body" style={{ fontSize: '7px', letterSpacing: '0.1em' }}>
          <textPath href="#circlePath" startOffset="0%">
            DISCREET · DELIVERY · ALWAYS ·
          </textPath>
        </text>
      </svg>
      {/* Center dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-terracotta opacity-30" />
      </div>
    </div>
  )
}

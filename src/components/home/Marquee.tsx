'use client'

import Link from 'next/link'

const marqueeItems = [
  { text: 'Free discreet shipping over $75', href: '/returns' },
  { text: 'Crypto, card & bank transfer accepted', href: '/gift-cards' },
  { text: 'Age-verified. Privacy-first.', href: '/our-story' },
  { text: 'New arrivals every week', href: '/shop' },
  { text: 'Curated by intimacy experts', href: '/our-story' },
]

function DiamondSeparator() {
  return (
    <span
      className="mx-6 w-1.5 h-1.5 bg-terracotta flex-shrink-0"
      style={{ transform: 'rotate(45deg)', display: 'inline-block' }}
      aria-hidden="true"
    />
  )
}

export default function Marquee() {
  // Duplicate items for seamless loop
  const items = [...marqueeItems, ...marqueeItems]

  return (
    <div className="bg-charcoal overflow-hidden py-4 animate-marquee-container">
      <div className="animate-marquee flex whitespace-nowrap items-center">
        {items.map((item, index) => (
          <span key={index} className="flex items-center flex-shrink-0">
            <Link
              href={item.href}
              className="font-body font-light text-sm text-warm-white tracking-wide hover:text-terracotta transition-colors duration-300"
              tabIndex={index < marqueeItems.length ? 0 : -1}
              aria-hidden={index >= marqueeItems.length}
            >
              {item.text}
            </Link>
            {index < items.length - 1 && <DiamondSeparator />}
          </span>
        ))}
      </div>
    </div>
  )
}

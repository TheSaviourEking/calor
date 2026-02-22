'use client'

const marqueeItems = [
  'Free discreet shipping over $75',
  'Crypto, card & bank transfer accepted',
  'Age-verified. Privacy-first.',
  'New arrivals every week',
  'Curated by intimacy experts',
]

export default function Marquee() {
  // Duplicate items for seamless loop
  const items = [...marqueeItems, ...marqueeItems]

  return (
    <div className="bg-charcoal overflow-hidden py-4">
      <div className="animate-marquee flex whitespace-nowrap">
        {items.map((item, index) => (
          <div key={index} className="flex items-center mx-6">
            <span className="font-body font-light text-sm text-warm-white tracking-wide">
              {item}
            </span>
            {/* Terracotta dot separator */}
            {index < items.length - 1 && (
              <span className="w-1.5 h-1.5 bg-terracotta rounded-full ml-6" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

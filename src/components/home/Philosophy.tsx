import { Package, Truck, RotateCcw, Shield } from 'lucide-react'

const stats = [
  {
    value: '12k+',
    label: 'Products curated and reviewed',
    icon: Package,
  },
  {
    value: '100%',
    label: 'Discreet packaging on every order',
    icon: Shield,
  },
  {
    value: '48h',
    label: 'Average delivery time',
    icon: Truck,
  },
  {
    value: '30-day',
    label: 'No-questions returns',
    icon: RotateCcw,
  },
]

export default function Philosophy() {
  return (
    <section id="our-story" className="py-20 lg:py-32 bg-charcoal">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left: Brand Statement */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <span className="w-10 h-px bg-terracotta/40" />
              <span className="eyebrow text-terracotta">Our Philosophy</span>
            </div>
            <h2 
              className="font-display text-cream mb-6"
              style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 300 }}
            >
              Less shame. More{' '}
              <span className="italic text-terracotta">warmth</span>. Always.
            </h2>
            <p className="font-body text-warm-gray text-base leading-relaxed mb-8">
              CALŌR occupies the space between Apple and Aesop. An elevated wellness and intimacy destination. Not a shop, not a pharmacy, not a bookstore. All three, unified under one philosophy: that intimacy deserves the same design attention and dignity as anything else you bring into your life.
            </p>
            <a
              href="/our-story"
              className="inline-block border border-terracotta text-terracotta px-8 py-4 font-body text-sm tracking-wider uppercase transition-all duration-300 hover:bg-terracotta hover:text-warm-white"
            >
              Read our story
            </a>
          </div>

          {/* Right: Statistics Grid */}
          <div className="grid grid-cols-2 gap-6">
            {stats.map((stat) => (
              <div 
                key={stat.label}
                className="p-6 bg-warm-white/5 border border-warm-white/10"
              >
                <stat.icon className="w-6 h-6 text-terracotta mb-4" />
                <p 
                  className="font-display text-cream text-2xl lg:text-3xl mb-2"
                  style={{ fontWeight: 300 }}
                >
                  {stat.value}
                </p>
                <p className="font-body text-warm-gray text-sm leading-relaxed">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

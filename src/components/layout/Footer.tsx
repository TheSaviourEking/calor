import { Instagram, Twitter, Globe } from 'lucide-react'

const shopLinks = [
  { label: 'Intimacy & Toys', href: '/shop/intimacy-toys' },
  { label: 'Wellness & Body', href: '/shop/wellness-body' },
  { label: 'Lingerie & Apparel', href: '/shop/lingerie-apparel' },
  { label: 'Adult Fiction', href: '/shop/adult-fiction' },
  { label: 'Education & Media', href: '/shop/education-media' },
  { label: 'Couples & Connection', href: '/shop/couples' },
  { label: 'Sexual Health', href: '/shop/sexual-health' },
  { label: 'Kink & Fetish', href: '/shop/kink-fetish' },
]

const featureLinks = [
  { label: 'All Features', href: '/features' },
  { label: 'VIP Program', href: '/account/vip' },
  { label: 'Wellness Platform', href: '/account/wellness' },
  { label: 'Gift Registry', href: '/registry' },
  { label: 'Live Shopping', href: '/live' },
  { label: 'AI Recommendations', href: '/shop' },
  { label: 'AR Experience', href: '/experience' },
]

const helpLinks = [
  { label: 'Track Order', href: '/track-order' },
  { label: 'Returns', href: '/legal/returns' },
  { label: 'Discreet Billing', href: '/legal/discreet-billing' },
  { label: 'Support', href: '/support' },
]

const companyLinks = [
  { label: 'Our Story', href: '/our-story' },
  { label: 'Become a Member', href: '/members' },
  { label: 'Gift Cards', href: '/gift-cards' },
  { label: 'Bundles', href: '/shop/bundles' },
  { label: 'Blog', href: '/blog' },
  { label: 'Size Guide', href: '/size-guide' },
  { label: 'Changelog', href: '/changelog' },
]

export default function Footer() {
  return (
    <footer className="mt-auto" style={{ background: '#1A1410' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6">
          {/* Column 1: Brand */}
          <div className="col-span-2 md:col-span-1">
            <h2 
              className="font-display text-cream text-xl tracking-[0.3em] mb-4"
              style={{ fontWeight: 300 }}
            >
              CALŌR
            </h2>
            <p className="font-body text-warm-gray text-sm leading-relaxed mb-6">
              An elevated destination for intimacy, wellness, and pleasure. Curated with care. Delivered discreetly.
            </p>
            {/* Country Selector */}
            <button 
              className="flex items-center gap-2 font-body text-warm-gray text-sm hover:text-terracotta transition-colors mb-4"
            >
              <Globe className="w-4 h-4" />
              <span>United States (USD)</span>
            </button>
            <div className="flex gap-4">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-warm-gray hover:text-terracotta transition-colors duration-300"
                aria-label="Instagram"
              >
                <Instagram className="w-[18px] h-[18px]" />
              </a>
              <a 
                href="https://tiktok.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-warm-gray hover:text-terracotta transition-colors duration-300"
                aria-label="TikTok"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 12a4 4 0 1 0 4 4V4c.5 2.5 2.5 4.5 5 5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a 
                href="https://pinterest.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-warm-gray hover:text-terracotta transition-colors duration-300"
                aria-label="Pinterest"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4" strokeLinecap="round"/>
                  <path d="M12 16v4" strokeLinecap="round"/>
                </svg>
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-warm-gray hover:text-terracotta transition-colors duration-300"
                aria-label="Twitter/X"
              >
                <Twitter className="w-[18px] h-[18px]" />
              </a>
            </div>
          </div>

          {/* Column 2: Shop */}
          <div>
            <h3 className="font-body text-cream text-sm tracking-wider uppercase mb-6">
              Shop
            </h3>
            <ul className="space-y-3">
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="font-body text-warm-gray text-sm hover:text-terracotta transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Features */}
          <div>
            <h3 className="font-body text-cream text-sm tracking-wider uppercase mb-6">
              Features
            </h3>
            <ul className="space-y-3">
              {featureLinks.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="font-body text-warm-gray text-sm hover:text-terracotta transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Help */}
          <div>
            <h3 className="font-body text-cream text-sm tracking-wider uppercase mb-6">
              Help
            </h3>
            <ul className="space-y-3">
              {helpLinks.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="font-body text-warm-gray text-sm hover:text-terracotta transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Company */}
          <div>
            <h3 className="font-body text-cream text-sm tracking-wider uppercase mb-6">
              Company
            </h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="font-body text-warm-gray text-sm hover:text-terracotta transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-charcoal/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-body text-warm-gray text-xs">
            © {new Date().getFullYear()} CALŌR. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a 
              href="/legal/privacy"
              className="font-body text-warm-gray text-xs hover:text-terracotta transition-colors duration-300"
            >
              Privacy Policy
            </a>
            <a 
              href="/legal/terms"
              className="font-body text-warm-gray text-xs hover:text-terracotta transition-colors duration-300"
            >
              Terms of Service
            </a>
            <a 
              href="/legal/cookies"
              className="font-body text-warm-gray text-xs hover:text-terracotta transition-colors duration-300"
            >
              Cookie Policy
            </a>
            <a 
              href="/legal/returns"
              className="font-body text-warm-gray text-xs hover:text-terracotta transition-colors duration-300"
            >
              Returns
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

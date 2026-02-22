import ClientWrapper from '@/components/layout/ClientWrapper'
import Link from 'next/link'

export default function CookiesPage() {
  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20 bg-warm-white">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
          <h1 
            className="font-display text-charcoal mb-8"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300 }}
          >
            Cookie Policy
          </h1>
          <p className="font-body text-warm-gray text-sm mb-8">
            Last updated: January 2025
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                What Are Cookies
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                Cookies are small text files stored on your device when you visit our website. They help us provide a better experience by remembering your preferences and understanding how you use our site.
              </p>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                How We Use Cookies
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed mb-4">
                We use cookies for the following purposes:
              </p>
              <ul className="font-body text-warm-gray text-base leading-relaxed space-y-2 ml-4">
                <li className="list-disc ml-4">
                  <strong className="text-charcoal">Essential Cookies</strong> — Required for the website to function properly. These include session management, cart contents, and security features.
                </li>
                <li className="list-disc ml-4">
                  <strong className="text-charcoal">Preference Cookies</strong> — Remember your settings such as language, region, and display preferences.
                </li>
                <li className="list-disc ml-4">
                  <strong className="text-charcoal">Analytics Cookies</strong> — Help us understand how visitors interact with our website so we can improve the experience.
                </li>
                <li className="list-disc ml-4">
                  <strong className="text-charcoal">Marketing Cookies</strong> — Used to deliver relevant advertisements and track campaign effectiveness.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                Cookies We Set
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full font-body text-sm">
                  <thead>
                    <tr className="border-b border-sand">
                      <th className="text-left py-3 text-charcoal font-medium">Cookie Name</th>
                      <th className="text-left py-3 text-charcoal font-medium">Purpose</th>
                      <th className="text-left py-3 text-charcoal font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-warm-gray">
                    <tr className="border-b border-sand/50">
                      <td className="py-3">calor_session</td>
                      <td className="py-3">User authentication</td>
                      <td className="py-3">30 days</td>
                    </tr>
                    <tr className="border-b border-sand/50">
                      <td className="py-3">calor_cart</td>
                      <td className="py-3">Shopping cart contents</td>
                      <td className="py-3">1 year</td>
                    </tr>
                    <tr className="border-b border-sand/50">
                      <td className="py-3">calor_wishlist</td>
                      <td className="py-3">Saved wishlist items</td>
                      <td className="py-3">1 year</td>
                    </tr>
                    <tr className="border-b border-sand/50">
                      <td className="py-3">calor_locale</td>
                      <td className="py-3">Language and region</td>
                      <td className="py-3">1 year</td>
                    </tr>
                    <tr className="border-b border-sand/50">
                      <td className="py-3">age_verified</td>
                      <td className="py-3">Age verification status</td>
                      <td className="py-3">1 year</td>
                    </tr>
                    <tr>
                      <td className="py-3">theme_preference</td>
                      <td className="py-3">Light/dark mode setting</td>
                      <td className="py-3">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                Third-Party Cookies
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed mb-4">
                We use trusted third-party services that may set their own cookies:
              </p>
              <ul className="font-body text-warm-gray text-base leading-relaxed space-y-2 ml-4">
                <li className="list-disc ml-4">
                  <strong className="text-charcoal">Stripe</strong> — Payment processing and fraud prevention
                </li>
                <li className="list-disc ml-4">
                  <strong className="text-charcoal">Coinbase Commerce</strong> — Cryptocurrency payment processing
                </li>
                <li className="list-disc ml-4">
                  <strong className="text-charcoal">Google Analytics</strong> — Website analytics (anonymized)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                Your Privacy Matters
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                We take your privacy seriously. Cookies are never used to identify you personally or share your information with third parties for marketing purposes. Your purchase history and browsing behavior remain private. See our <Link href="/legal/privacy" className="text-terracotta hover:underline">Privacy Policy</Link> for more details.
              </p>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                Managing Cookies
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed mb-4">
                You can control cookies through your browser settings:
              </p>
              <ul className="font-body text-warm-gray text-base leading-relaxed space-y-2 ml-4">
                <li className="list-disc ml-4">
                  <strong className="text-charcoal">Chrome</strong> — Settings → Privacy and security → Cookies
                </li>
                <li className="list-disc ml-4">
                  <strong className="text-charcoal">Firefox</strong> — Options → Privacy & Security → Cookies
                </li>
                <li className="list-disc ml-4">
                  <strong className="text-charcoal">Safari</strong> — Preferences → Privacy → Cookies
                </li>
                <li className="list-disc ml-4">
                  <strong className="text-charcoal">Edge</strong> — Settings → Cookies and site permissions
                </li>
              </ul>
              <p className="font-body text-warm-gray text-base leading-relaxed mt-4">
                Disabling cookies may affect website functionality. Essential cookies cannot be disabled without impacting core features like checkout and account access.
              </p>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                Discreet by Design
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                Our cookies are designed with discretion in mind. Browser history and cookies will show references to &quot;CALŌR&quot; or &quot;CALOR CO&quot; only — never product names or categories. Your privacy is built into everything we do.
              </p>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                Contact
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                For questions about our use of cookies, contact us at privacy@calorco.com.
              </p>
            </section>
          </div>
        </div>
      </div>
    </ClientWrapper>
  )
}

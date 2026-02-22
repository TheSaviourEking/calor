import ClientWrapper from '@/components/layout/ClientWrapper'

export default function TermsPage() {
  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20 bg-warm-white">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
          <h1 
            className="font-display text-charcoal mb-8"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300 }}
          >
            Terms of Service
          </h1>
          <p className="font-body text-warm-gray text-sm mb-8">
            Last updated: January 2025
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                1. Age Requirement
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                You must be at least 18 years old (or the legal age of majority in your jurisdiction) to use this website and purchase products. By using our site, you confirm you meet this requirement.
              </p>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                2. Products
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                We make every effort to display products accurately. Colors, dimensions, and specifications may vary slightly from actual products. We reserve the right to modify or discontinue any product without notice.
              </p>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                3. Pricing and Payment
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                All prices are listed in USD unless otherwise specified. We accept major credit cards, bank transfers, and select cryptocurrencies. Payment is processed securely through Stripe or Coinbase Commerce.
              </p>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                4. Shipping
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                Orders are shipped in plain, unmarked packaging. Shipping times are estimates and not guaranteed. We are not responsible for delays caused by shipping carriers or customs.
              </p>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                5. Returns
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                Unopened products may be returned within 30 days for a full refund. Due to hygiene concerns, opened products cannot be returned unless defective. See our Returns Policy for details.
              </p>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                6. Intellectual Property
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                All content on this website, including text, images, logos, and design, is the property of CALŌR and protected by copyright law.
              </p>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                7. Limitation of Liability
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                CALŌR shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services.
              </p>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                8. Contact
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                For questions about these terms, contact us at legal@calorco.com.
              </p>
            </section>
          </div>
        </div>
      </div>
    </ClientWrapper>
  )
}

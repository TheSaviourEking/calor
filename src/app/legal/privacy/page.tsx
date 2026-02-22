import ClientWrapper from '@/components/layout/ClientWrapper'

export default function PrivacyPage() {
  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20 bg-warm-white">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
          <h1 
            className="font-display text-charcoal mb-8"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300 }}
          >
            Privacy Policy
          </h1>
          <p className="font-body text-warm-gray text-sm mb-8">
            Last updated: January 2025
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                1. Information We Collect
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                We collect only what is necessary to process your order and improve your experience: name, email, shipping address, and payment information. Payment details are processed by Stripe and never stored on our servers.
              </p>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                2. How We Use Your Information
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                Your information is used solely to process orders, communicate about your purchase, and improve our service. We never sell, rent, or share your data with third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                3. Discreet Billing
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                All charges appear as CALŌR CO. on your bank statement. No product names or descriptions are ever visible in transaction records.
              </p>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                4. Data Security
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                We use 256-bit SSL encryption for all data transmission. Payment processing is handled by Stripe, which is PCI DSS compliant. Your data is stored on secure, encrypted servers.
              </p>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                5. Your Rights
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                You have the right to access, correct, or delete your personal data at any time. Contact us at privacy@calorco.com to exercise these rights.
              </p>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                6. Cookies
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                We use essential cookies for site functionality and age verification. No tracking cookies are used without your explicit consent.
              </p>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                7. Contact
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                For privacy-related inquiries, contact us at privacy@calorco.com.
              </p>
            </section>
          </div>
        </div>
      </div>
    </ClientWrapper>
  )
}

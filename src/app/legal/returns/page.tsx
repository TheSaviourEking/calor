import ClientWrapper from '@/components/layout/ClientWrapper'

export default function ReturnsPage() {
  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20 bg-warm-white">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
          <h1 
            className="font-display text-charcoal mb-8"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300 }}
          >
            Returns Policy
          </h1>

          <div className="bg-terracotta/10 p-6 mb-8">
            <p className="font-body text-charcoal text-base leading-relaxed">
              If it is not right for you, return it within 30 days. Unopened products only, for hygiene reasons. No questions asked.
            </p>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                Eligible Returns
              </h2>
              <ul className="font-body text-warm-gray text-base leading-relaxed space-y-2 list-disc pl-6">
                <li>Unopened products in original packaging</li>
                <li>Products with manufacturing defects</li>
                <li>Incorrect items received</li>
                <li>Damaged items (reported within 48 hours of delivery)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                Non-Returnable Items
              </h2>
              <ul className="font-body text-warm-gray text-base leading-relaxed space-y-2 list-disc pl-6">
                <li>Opened products (for hygiene reasons)</li>
                <li>Digital products (once delivered)</li>
                <li>Gift cards</li>
                <li>Items marked as final sale</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                How to Return
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed mb-4">
                Email returns@calorco.com with your order number and reason for return. We will provide a prepaid shipping label for defective or incorrect items. For other returns, shipping costs are your responsibility.
              </p>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                Refund Processing
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                Refunds are processed within 5-7 business days of receiving your return. The refund will be credited to your original payment method. You will receive an email confirmation once processed.
              </p>
            </section>

            <section>
              <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
                Questions?
              </h2>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                Contact us at returns@calorco.com for any questions about returns.
              </p>
            </section>
          </div>
        </div>
      </div>
    </ClientWrapper>
  )
}

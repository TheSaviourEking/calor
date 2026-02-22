import { CreditCard, Building2, Bitcoin, Lock } from 'lucide-react'

const paymentMethods = [
  {
    category: 'Cards',
    icon: CreditCard,
    methods: ['Visa', 'Mastercard', 'Amex', 'Discover'],
  },
  {
    category: 'Bank',
    icon: Building2,
    methods: ['Bank Transfer', 'ACH'],
  },
  {
    category: 'Crypto',
    icon: Bitcoin,
    methods: ['Bitcoin', 'Ethereum', 'USDC', 'Litecoin', 'Monero'],
  },
]

export default function PaymentTrust() {
  return (
    <section className="py-20 lg:py-32 bg-cream">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="w-10 h-px bg-terracotta/40" />
            <span className="eyebrow">Secure & Private</span>
            <span className="w-10 h-px bg-terracotta/40" />
          </div>
          <h2 
            className="font-display text-charcoal mb-4"
            style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 300 }}
          >
            Pay your way
          </h2>
          <p className="font-body text-warm-gray text-base max-w-lg mx-auto">
            Your bank statement shows &quot;CALŌR CO.&quot; only. Nothing explicit. Ever.
          </p>
        </div>

        {/* Payment Methods */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {paymentMethods.map((method) => (
            <div 
              key={method.category}
              className="bg-warm-white p-8 border border-sand"
            >
              <method.icon className="w-6 h-6 text-terracotta mb-4" />
              <h3 
                className="font-display text-charcoal text-lg mb-3"
                style={{ fontWeight: 400 }}
              >
                Pay by {method.category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {method.methods.map((m) => (
                  <span 
                    key={m}
                    className="px-3 py-1 bg-sand/50 font-body text-xs text-mid-gray"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Trust Section */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-warm-gray mb-4">
            <Lock className="w-4 h-4" />
            <span className="font-body text-sm">256-bit SSL encrypted</span>
          </div>
          <p className="font-body text-warm-gray text-sm max-w-lg mx-auto">
            We never store your card details. Payment is processed by Stripe and held by them, not us. Your privacy is protected at every step.
          </p>
        </div>
      </div>
    </section>
  )
}

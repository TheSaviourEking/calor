import ClientWrapper from '@/components/layout/ClientWrapper'
import { Shield, Package, CreditCard, Lock } from 'lucide-react'
import { DISCRETION_COPY } from '@/lib/discretion'
import { getBankDetails } from '@/lib/payments/methods'

// Reads SHIP_FROM_NAME and BANK_TRANSFER_DETAILS, so render per request
export const dynamic = 'force-dynamic'

export default function DiscreetBillingPage() {
  // Assumes one account name across regions (the DEFAULT entry)
  const bankAccountName = getBankDetails('DEFAULT')?.accountName
  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20 bg-warm-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
          <h1 
            className="font-display text-charcoal mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300 }}
          >
            Discreet Billing
          </h1>
          <p className="font-body text-warm-gray text-lg mb-12">
            Your privacy is protected at every step.
          </p>

          {/* Bank Statement Preview */}
          <div className="bg-charcoal p-8 mb-12">
            <p className="font-body text-warm-gray text-xs uppercase tracking-wider mb-4">
              Card payments show:
            </p>
            <div className="bg-warm-white p-4 inline-block">
              <p className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                CALO CO
              </p>
              <p className="font-body text-warm-gray text-sm">$XXX.XX</p>
            </div>
          </div>

          {/* Trust Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-cream p-6 border border-sand">
              <CreditCard className="w-6 h-6 text-terracotta mb-4" />
              <h3 className="font-display text-charcoal text-lg mb-2" style={{ fontWeight: 400 }}>
                Bank Statements
              </h3>
              <p className="font-body text-warm-gray text-sm leading-relaxed">
                {DISCRETION_COPY.cardStatement} We never send product names to your card issuer.
              </p>
            </div>

            <div className="bg-cream p-6 border border-sand">
              <Package className="w-6 h-6 text-terracotta mb-4" />
              <h3 className="font-display text-charcoal text-lg mb-2" style={{ fontWeight: 400 }}>
                Shipping Packaging
              </h3>
              <p className="font-body text-warm-gray text-sm leading-relaxed">
                {DISCRETION_COPY.packaging()}
              </p>
            </div>

            <div className="bg-cream p-6 border border-sand">
              <Shield className="w-6 h-6 text-terracotta mb-4" />
              <h3 className="font-display text-charcoal text-lg mb-2" style={{ fontWeight: 400 }}>
                Email Privacy
              </h3>
              <p className="font-body text-warm-gray text-sm leading-relaxed">
                Email subjects and previews never name what you bought.
              </p>
            </div>

            <div className="bg-cream p-6 border border-sand">
              <Lock className="w-6 h-6 text-terracotta mb-4" />
              <h3 className="font-display text-charcoal text-lg mb-2" style={{ fontWeight: 400 }}>
                Data Security
              </h3>
              <p className="font-body text-warm-gray text-sm leading-relaxed">
                We never sell your data. Payment processed by Stripe. Card details never stored on our servers.
              </p>
            </div>
          </div>

          {/* FAQ */}
          <div className="space-y-6">
            <h2 className="font-display text-charcoal text-xl mb-6" style={{ fontWeight: 400 }}>
              Common Questions
            </h2>
            
            <div className="border-b border-sand pb-6">
              <h3 className="font-body text-charcoal text-sm uppercase tracking-wider mb-2">
                What if I share a bank account?
              </h3>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                {DISCRETION_COPY.cardStatement} We send no product names, so nothing on the statement says what was purchased.
              </p>
            </div>

            <div className="border-b border-sand pb-6">
              <h3 className="font-body text-charcoal text-sm uppercase tracking-wider mb-2">
                What about crypto and bank transfers?
              </h3>
              <p className="font-body text-warm-gray text-base leading-relaxed">
                {DISCRETION_COPY.crypto} {bankAccountName && DISCRETION_COPY.bankTransfer(bankAccountName)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ClientWrapper>
  )
}

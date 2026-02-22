import ClientWrapper from '@/components/layout/ClientWrapper'

export default function OurStoryPage() {
  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20">
        {/* Hero */}
        <div className="bg-charcoal py-20 lg:py-32">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <h1 
              className="font-display text-cream mb-6"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 300 }}
            >
              Our Story
            </h1>
            <p className="font-body text-warm-gray text-lg leading-relaxed max-w-2xl mx-auto">
              CALŌR was built on a simple belief: intimacy deserves the same design attention and dignity as anything else you bring into your life.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
          <div className="prose prose-lg">
            <h2 className="font-display text-charcoal text-2xl mb-6" style={{ fontWeight: 300 }}>
              The space between Apple and Aesop
            </h2>
            <p className="font-body text-warm-gray text-base leading-relaxed mb-8">
              Most adult wellness destinations feel like one of two things: either clinical to the point of coldness, or salacious to the point of cheapness. Neither serves the customer who wants to explore intimacy with dignity.
            </p>
            <p className="font-body text-warm-gray text-base leading-relaxed mb-8">
              CALŌR occupies the space between. We believe that design is not decoration. It is how a product speaks to you before you even touch it. It is the weight of a bottle in your hand. The texture of silk. The quiet of a motor that does its job without announcing itself.
            </p>

            <h2 className="font-display text-charcoal text-2xl mb-6 mt-12" style={{ fontWeight: 300 }}>
              Less shame. More warmth. Always.
            </h2>
            <p className="font-body text-warm-gray text-base leading-relaxed mb-8">
              The name CALŌR means heat in Latin, Italian, and Spanish. It speaks to over a billion people in their native tongue. The word carries body, desire, and intimacy without being explicit. It is warm. It is human. It is the feeling we want every visitor to have.
            </p>
            <p className="font-body text-warm-gray text-base leading-relaxed mb-8">
              Shame has no address here. We do not whisper about our products. We do not hide them behind euphemism or clinical language. At the same time, we do not sensationalize. We describe things accurately and let the product speak for itself.
            </p>

            <h2 className="font-display text-charcoal text-2xl mb-6 mt-12" style={{ fontWeight: 300 }}>
              Discretion is not secrecy
            </h2>
            <p className="font-body text-warm-gray text-base leading-relaxed mb-8">
              We understand that privacy matters. Every order ships in plain packaging. Your bank statement shows only CALŌR CO. Your email subjects never reveal what you purchased. This is not because buying these products is something to hide. It is because your private life is yours alone.
            </p>
            <p className="font-body text-warm-gray text-base leading-relaxed mb-8">
              We offer payment by card, bank transfer, and cryptocurrency. For those who prefer maximum privacy, Monero provides transaction details visible only to you.
            </p>

            <h2 className="font-display text-charcoal text-2xl mb-6 mt-12" style={{ fontWeight: 300 }}>
              Built to last
            </h2>
            <p className="font-body text-warm-gray text-base leading-relaxed mb-8">
              Every product in our catalog is chosen with intention. We read the reviews, test the materials, and consider the lifespan of what we sell. If something does not meet our standards, it does not make it to the site.
            </p>
            <p className="font-body text-warm-gray text-base leading-relaxed">
              This is CALŌR. Warmth lives here.
            </p>
          </div>
        </div>
      </div>
    </ClientWrapper>
  )
}

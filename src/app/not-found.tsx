import ClientWrapper from '@/components/layout/ClientWrapper'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <ClientWrapper>
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <div className="text-center px-6">
          <h1 
            className="font-display text-charcoal mb-4"
            style={{ fontSize: 'clamp(4rem, 10vw, 8rem)', fontWeight: 300 }}
          >
            404
          </h1>
          <p className="font-body text-warm-gray text-lg mb-8">
            That page does not exist. It may have moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-charcoal text-cream px-8 py-4 font-body text-sm uppercase tracking-wider transition-colors hover:bg-terracotta"
            >
              <Home className="w-4 h-4" />
              Go Home
            </a>
            <a
              href="/search"
              className="inline-flex items-center justify-center gap-2 border border-charcoal text-charcoal px-8 py-4 font-body text-sm uppercase tracking-wider transition-colors hover:bg-charcoal hover:text-cream"
            >
              <Search className="w-4 h-4" />
              Search
            </a>
          </div>
        </div>
      </div>
    </ClientWrapper>
  )
}

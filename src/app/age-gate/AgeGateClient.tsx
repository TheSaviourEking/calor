'use client'

import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

export default function AgeGateClient() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const callbackUrl = searchParams.get('callbackUrl') || '/'

    const handleYes = () => {
        // Set cookie for middleware
        document.cookie = 'calor_age_verified=true; path=/; max-age=31536000; SameSite=Lax'
        router.push(callbackUrl)
    }

    const handleNo = () => {
        window.location.href = 'https://www.google.com'
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-charcoal">
            <div className="text-center px-6 max-w-lg">
                {/* Logo */}
                <h1
                    className="font-display text-cream mb-2"
                    style={{
                        fontSize: '3rem',
                        fontWeight: 300,
                        letterSpacing: '0.3em'
                    }}
                >
                    CALŌR
                </h1>

                {/* Tagline */}
                <p className="font-body text-warm-gray text-sm tracking-wider mb-12">
                    Warmth lives here
                </p>

                {/* Question */}
                <h2
                    className="font-display text-cream mb-4"
                    style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 300 }}
                >
                    Are you 18 years of age or older?
                </h2>

                <p className="font-body text-warm-gray text-sm mb-8 leading-relaxed">
                    This is an adult wellness destination. By entering, you confirm you are of legal age in your jurisdiction.
                </p>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={handleYes}
                        className="bg-terracotta text-warm-white px-10 py-4 font-body font-medium text-sm tracking-wider uppercase transition-all duration-300 hover:bg-terracotta-light"
                    >
                        Yes, I am 18+
                    </button>
                    <button
                        onClick={handleNo}
                        className="border border-warm-gray text-warm-gray px-10 py-4 font-body font-medium text-sm tracking-wider uppercase transition-all duration-300 hover:border-terracotta hover:text-terracotta"
                    >
                        No, exit
                    </button>
                </div>

                {/* Disclaimer */}
                <p className="font-body text-warm-gray text-xs mt-12 opacity-60">
                    By entering, you agree to our{' '}
                    <Link href="/legal/privacy" className="underline hover:text-terracotta">
                        Privacy Policy
                    </Link>
                    .
                </p>
            </div>
        </div>
    )
}

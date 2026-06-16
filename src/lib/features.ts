/**
 * CALŌR Feature Flags
 *
 * All flags are driven by environment variables so they can be toggled
 * in Vercel dashboard without a code deploy.
 *
 * Usage:
 *   import { features } from '@/lib/features'
 *   if (features.liveStreaming) { ... }
 *
 * In .env / Vercel env vars:
 *   NEXT_PUBLIC_FEATURE_LIVE=true
 *   NEXT_PUBLIC_FEATURE_AR=false
 *   etc.
 */

function flag(key: string, defaultValue = false): boolean {
  if (typeof process !== 'undefined' && process.env[key]) {
    return process.env[key] === 'true'
  }
  return defaultValue
}

export const features = {
  /**
   * Live Shopping — WebSocket mini-service required
   * Enable only after chat.domain.com + stream.domain.com are verified
   */
  liveStreaming: flag('NEXT_PUBLIC_FEATURE_LIVE', false),

  /**
   * AR / Virtual Try-On — no real AR backend yet
   * Currently the /experience page shows a demo UI only
   */
  arExperience: flag('NEXT_PUBLIC_FEATURE_AR', false),

  /**
   * Smart Toy Integration — requires hardware + Bluetooth API
   * The /account/toys page exists but is stub UI
   */
  smartToys: flag('NEXT_PUBLIC_FEATURE_TOYS', false),

  /**
   * Virtual Consultations — full booking flow is complete
   * Enable after consultants are onboarded in DB
   */
  consultations: flag('NEXT_PUBLIC_FEATURE_CONSULTATIONS', true),

  /**
   * Wellness Platform — daily check-ins, achievements, challenges
   * Full build is complete and tested
   */
  wellness: flag('NEXT_PUBLIC_FEATURE_WELLNESS', true),

  /**
   * Gift Registry — full build is complete
   */
  giftRegistry: flag('NEXT_PUBLIC_FEATURE_REGISTRY', true),

  /**
   * AI-powered semantic search — build is complete
   */
  semanticSearch: flag('NEXT_PUBLIC_FEATURE_SEMANTIC_SEARCH', true),

  /**
   * Crypto payments (Coinbase Commerce)
   * Disable if COINBASE_COMMERCE_API_KEY is not set
   */
  cryptoPayments: flag('NEXT_PUBLIC_FEATURE_CRYPTO', true),
} as const

export type FeatureKey = keyof typeof features

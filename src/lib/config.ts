// Centralized environment variable validation
// Only truly required vars — optional integrations (Coinbase, LiveKit, etc.) are not hard-required
const required = [
  'DATABASE_URL',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'RESEND_API_KEY',
  'NEXT_PUBLIC_BASE_URL',
] as const

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `See .env.example for setup instructions.`
    )
  }
}

export const config = {
  database: { url: process.env.DATABASE_URL! },
  auth: { jwtSecret: process.env.JWT_SECRET! },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  },
  // Coinbase is optional — crypto payments are disabled if these are not set
  coinbase: {
    apiKey: process.env.COINBASE_COMMERCE_API_KEY || null,
    webhookSecret: process.env.COINBASE_WEBHOOK_SECRET || null,
  },
  resend: { apiKey: process.env.RESEND_API_KEY! },
  app: { baseUrl: process.env.NEXT_PUBLIC_BASE_URL! },
  livekit: {
    apiKey: process.env.LIVEKIT_API_KEY || 'devkey',
    apiSecret: process.env.LIVEKIT_API_SECRET || 'secret',
    wsUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880',
  },
}

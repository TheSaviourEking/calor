// Centralized environment variable validation
const required = [
  'DATABASE_URL',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'COINBASE_COMMERCE_API_KEY',
  'COINBASE_WEBHOOK_SECRET',
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
  coinbase: {
    apiKey: process.env.COINBASE_COMMERCE_API_KEY!,
    webhookSecret: process.env.COINBASE_WEBHOOK_SECRET!,
  },
  resend: { apiKey: process.env.RESEND_API_KEY! },
  app: { baseUrl: process.env.NEXT_PUBLIC_BASE_URL! },
} as const

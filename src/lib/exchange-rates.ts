import { db } from '@/lib/db'

// Fallback rates if API/DB is unavailable
const FALLBACK_RATES: Record<string, number> = {
  USD: 1, GBP: 0.79, EUR: 0.92, NGN: 1530.50,
  GHS: 12.50, ZAR: 18.90, AED: 3.67, CAD: 1.35,
  AUD: 1.52, NZD: 1.63,
}

export async function getExchangeRates(): Promise<Record<string, number>> {
  try {
    // Try database first
    const rates = await db.exchangeRate.findMany()
    if (rates.length > 0) {
      const rateMap: Record<string, number> = {}
      for (const r of rates) rateMap[r.currency] = r.rate
      // Only use DB rates if they're less than 2 hours old
      const newest = rates.reduce((a, b) => a.updatedAt > b.updatedAt ? a : b)
      if (Date.now() - newest.updatedAt.getTime() < 2 * 60 * 60 * 1000) {
        return { ...FALLBACK_RATES, ...rateMap }
      }
    }
  } catch {
    // DB not available, fall through to API
  }

  // Try external API
  const appId = process.env.OPENEXCHANGERATES_APP_ID
  if (!appId) return FALLBACK_RATES

  try {
    const res = await fetch(
      `https://openexchangerates.org/api/latest.json?app_id=${appId}&base=USD`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return FALLBACK_RATES

    const data = await res.json()
    const rates: Record<string, number> = {}

    for (const currency of Object.keys(FALLBACK_RATES)) {
      rates[currency] = data.rates?.[currency] ?? FALLBACK_RATES[currency]
    }

    // Cache in database
    try {
      for (const [currency, rate] of Object.entries(rates)) {
        await db.exchangeRate.upsert({
          where: { currency },
          create: { currency, rate },
          update: { rate },
        })
      }
    } catch {
      // DB write failed, rates still returned
    }

    return rates
  } catch {
    return FALLBACK_RATES
  }
}

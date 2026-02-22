import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Locale = 'US' | 'UK' | 'EU' | 'NG' | 'GH' | 'ZA' | 'AE' | 'CA' | 'AU' | 'NZ'

export type Currency = 'USD' | 'GBP' | 'EUR' | 'NGN' | 'GHS' | 'ZAR' | 'AED' | 'CAD' | 'AUD' | 'NZD'

interface LocaleConfig {
  locale: Locale
  currency: Currency
  symbol: string
  name: string
}

export const LOCALE_CONFIG: Record<Locale, LocaleConfig> = {
  US: { locale: 'US', currency: 'USD', symbol: '$', name: 'United States' },
  UK: { locale: 'UK', currency: 'GBP', symbol: '£', name: 'United Kingdom' },
  EU: { locale: 'EU', currency: 'EUR', symbol: '€', name: 'Europe' },
  NG: { locale: 'NG', currency: 'NGN', symbol: '₦', name: 'Nigeria' },
  GH: { locale: 'GH', currency: 'GHS', symbol: '₵', name: 'Ghana' },
  ZA: { locale: 'ZA', currency: 'ZAR', symbol: 'R', name: 'South Africa' },
  AE: { locale: 'AE', currency: 'AED', symbol: 'د.إ', name: 'UAE' },
  CA: { locale: 'CA', currency: 'CAD', symbol: 'CA$', name: 'Canada' },
  AU: { locale: 'AU', currency: 'AUD', symbol: 'A$', name: 'Australia' },
  NZ: { locale: 'NZ', currency: 'NZD', symbol: 'NZ$', name: 'New Zealand' },
}

// Exchange rates relative to USD (1 USD = X Currency)
// In a real production app, these would be fetched dynamically from an API.
export const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  GBP: 0.79,
  EUR: 0.92,
  NGN: 1530.50,
  GHS: 12.50,
  ZAR: 18.90,
  AED: 3.67,
  CAD: 1.35,
  AUD: 1.52,
  NZD: 1.63,
}

interface LocaleStore {
  locale: Locale
  setLocale: (locale: Locale) => void
  getCurrency: () => Currency
  getSymbol: () => string
  formatPrice: (cents: number) => string
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set, get) => ({
      locale: 'US',

      setLocale: (locale) => set({ locale }),

      getCurrency: () => LOCALE_CONFIG[get().locale].currency,

      getSymbol: () => LOCALE_CONFIG[get().locale].symbol,

      formatPrice: (cents) => {
        const config = LOCALE_CONFIG[get().locale]
        const rate = EXCHANGE_RATES[config.currency]

        // Convert USD cents to target currency, accounting for decimal places
        const amount = (cents / 100) * rate

        // Currencies with no decimal places
        if (['NGN'].includes(config.currency)) {
          return `${config.symbol}${Math.round(amount).toLocaleString()}`
        }

        return `${config.symbol}${amount.toFixed(2)}`
      },
    }),
    { name: 'calor-locale' }
  )
)

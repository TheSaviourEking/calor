export interface BankDetails {
  bankName: string
  accountName: string
  accountNumber: string | null
  routingNumber: string | null
  swiftCode: string | null
  iban: string | null
  sortCode: string | null
}

// BANK_TRANSFER_DETAILS is a JSON object keyed by ISO country code, with an
// optional DEFAULT entry. See .env.example.
function readBankConfig(): Record<string, Partial<BankDetails>> | null {
  const raw = process.env.BANK_TRANSFER_DETAILS
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    console.error('[payments] BANK_TRANSFER_DETAILS is not valid JSON')
    return null
  }
}

export function getBankDetails(country: string): BankDetails | null {
  const config = readBankConfig()
  if (!config) return null

  const entry = config[country.toUpperCase()] ?? config.DEFAULT
  if (!entry?.bankName || !entry.accountName) return null

  return {
    bankName: entry.bankName,
    accountName: entry.accountName,
    accountNumber: entry.accountNumber ?? null,
    routingNumber: entry.routingNumber ?? null,
    swiftCode: entry.swiftCode ?? null,
    iban: entry.iban ?? null,
    sortCode: entry.sortCode ?? null,
  }
}

export function getAvailablePaymentMethods(): { card: boolean; bank: boolean; crypto: boolean } {
  return {
    card: true,
    bank: readBankConfig() !== null,
    crypto: !!process.env.COINBASE_COMMERCE_API_KEY,
  }
}

// Single source of truth for discretion facts. Pure: no db, no Next imports.

export const STATEMENT_DESCRIPTOR = 'CALO CO'

export function shipFromName(): string {
  return process.env.SHIP_FROM_NAME || 'CC Fulfillment'
}

/**
 * Customer-facing discretion promises, one wording everywhere (pages, chatbot,
 * privacy receipt). Anything that depends on env is a function.
 */
export const DISCRETION_COPY = Object.freeze({
  cardStatement: `Card payments show ${STATEMENT_DESCRIPTOR} on your statement. Your bank decides the exact layout.`,
  // accountName comes from BANK_TRANSFER_DETAILS, the same value the bank
  // instructions email prints as "Account name".
  bankTransfer: (accountName?: string | null): string =>
    accountName
      ? `Bank transfers go to an account named ${accountName}.`
      : 'Bank transfers go to the account name shown in your payment instructions.',
  crypto: 'Crypto payments show no card statement line.',
  packaging: (): string =>
    `Orders ship in plain packaging by default, with no product names on the outside. The sender shows as ${shipFromName()}.`,
})

/** Per-order packaging line: only an order that really ships plain gets the promise. */
export function packagingNotice(plainPackaging: boolean): string | null {
  return plainPackaging ? 'Your order will arrive in plain, unmarked packaging.' : null
}

export const EMAIL_SUBJECTS = {
  priceDrop: 'Something on your list has changed',
  backInStock: 'Something on your list is available again',
  abandonedCart: 'You left something in your bag',
  giftCard: 'A gift is waiting for you',
  orderConfirmed: 'Your order is confirmed',
  shipped: 'Your order is on its way',
  paymentInstructions: 'Your payment details',
} as const

/**
 * Inbox preview text, one per email. Shown under the subject, so the same rule
 * applies: no product, product brand, category or store name.
 */
export const EMAIL_PREHEADERS = {
  orderConfirmed: 'Thank you. Your order details are inside.',
  paymentInstructions: 'The details you need to complete your payment.',
  welcome: 'Your account is ready.',
  passwordReset: 'A link to set a new password, valid for one hour.',
  verification: 'One quick step to confirm your email address.',
  shipped: 'Tracking details for your order are inside.',
  giftCard: 'Someone has sent you something. Open to see.',
  anonymousGift: 'Someone has sent you something. Open to see.',
  abandonedCart: 'Your bag is saved for you, with a little extra.',
  priceDrop: 'A saved item has a new price.',
  backInStock: 'A saved item is available again.',
  securityAlert: 'A recent change to your account, for your review.',
} as const

const PREHEADER_LENGTH = 150

/**
 * Hidden first element of an email body. Inboxes show it as the preview; the
 * &zwnj;&nbsp; padding fills the rest of the preview so body text (which may
 * name an item) never shows before the email is opened.
 */
export function preheaderHtml(text: string): string {
  const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const padding = '&zwnj;&nbsp;'.repeat(Math.max(0, Math.ceil((PREHEADER_LENGTH - text.length) / 2)))
  return `<div data-preheader style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:transparent;opacity:0;">${safe}${padding}</div>`
}

/** Puts the preheader directly after <body>, so it is always the first element. */
export function withPreheader(html: string, text: string): string {
  return html.replace(/<body([^>]*)>/i, (tag) => `${tag}${preheaderHtml(text)}`)
}

/** Name left on content kept after a member deletes their account. */
export const DELETED_MEMBER_NAME = 'Deleted member'

type NameParts = {
  nickname?: string | null
  firstName?: string | null
  lastName?: string | null
}

/** Nickname if set, else "First L."; never email or full last name. */
export function publicDisplayName(p: NameParts | null | undefined, fallback = 'Guest'): string {
  if (!p) return fallback
  const nickname = p.nickname?.trim()
  if (nickname) return nickname
  const first = p.firstName?.trim()
  if (!first) return fallback
  const last = p.lastName?.trim()
  return last ? `${first} ${last.charAt(0).toUpperCase()}.` : first
}

const NICKNAME_PATTERN = /^[A-Za-z0-9 _-]+$/

export function validateNickname(
  raw: unknown
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== 'string') return { ok: false, error: 'Nickname must be text' }
  const value = raw.trim().replace(/\s+/g, ' ')
  if (value.length < 3 || value.length > 24) {
    return { ok: false, error: 'Nickname must be 3 to 24 characters' }
  }
  if (value.includes('@')) return { ok: false, error: 'Nickname cannot contain @' }
  if (!NICKNAME_PATTERN.test(value)) {
    return { ok: false, error: 'Use letters, numbers, spaces, _ or - only' }
  }
  if (!/[A-Za-z0-9]/.test(value)) {
    return { ok: false, error: 'Nickname needs at least one letter or number' }
  }
  return { ok: true, value }
}

const NICKNAME_WORDS = [
  'Amber', 'Velvet', 'Ember', 'Honey', 'Willow', 'Saffron', 'Dune', 'Sable',
  'Linen', 'Cedar', 'Opal', 'Clove', 'Marlow', 'Hazel', 'Coral', 'Maple',
] as const

export function generateNickname(random: () => number = Math.random): string {
  const word = NICKNAME_WORDS[Math.min(NICKNAME_WORDS.length - 1, Math.floor(random() * NICKNAME_WORDS.length))]
  const n = Math.min(9999, Math.floor(random() * 10000))
  return `${word} ${String(n).padStart(4, '0')}`
}

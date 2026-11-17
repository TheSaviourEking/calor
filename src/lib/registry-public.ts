type Contribution = {
  id: string
  amountCents: number
  message?: string | null
  contributorName?: string | null
  createdAt?: Date | string
}

/** Contribution as shown on a registry: first name only, never the email or order reference. */
export function toPublicContribution(c: Contribution) {
  const first = c.contributorName?.trim().split(/\s+/)[0]
  return {
    id: c.id,
    amountCents: c.amountCents,
    message: c.message ?? null,
    contributorName: first && !first.includes('@') ? first : 'A friend',
    createdAt: c.createdAt,
  }
}

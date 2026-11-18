import type { Prisma } from '@prisma/client'

/** Staff-only ticket columns a customer never receives. */
export const CUSTOMER_TICKET_OMIT = { internalNotes: true, tags: true } as const

/** Counts only the messages a customer can see. */
export const CUSTOMER_MESSAGE_COUNT = {
  select: { messages: { where: { isInternal: false } } },
} as const

/**
 * The customer's own ticket list (account support page). Staff notes, tags and
 * internal messages never reach client props, not even as a count or preview.
 */
export function customerTicketListArgs(customerId: string) {
  return {
    where: { customerId },
    omit: CUSTOMER_TICKET_OMIT,
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, email: true } },
      category: { select: { id: true, name: true, slug: true } },
      messages: {
        where: { isInternal: false },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true, senderType: true },
      },
      _count: CUSTOMER_MESSAGE_COUNT,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  } satisfies Prisma.SupportTicketFindManyArgs
}

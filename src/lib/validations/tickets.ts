import { z } from 'zod'

export const ticketCreateSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200),
  categoryId: z.string().optional().nullable(),
  message: z.string().min(1, 'Message is required').max(5000),
  orderId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  guestEmail: z.string().email().optional().nullable(),
  guestName: z.string().max(100).optional().nullable(),
})

export type TicketCreate = z.infer<typeof ticketCreateSchema>

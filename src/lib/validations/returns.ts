import { z } from 'zod'

export const returnCreateSchema = z.object({
    orderId: z.string().cuid().or(z.string().uuid()),
    reason: z.string().min(1).max(100),
    reasonDetails: z.string().max(1000).optional(),
    refundMethod: z.enum(['original_payment', 'store_credit']),
    guestEmail: z.string().email().optional(),
    items: z.array(z.object({
        orderItemId: z.string().cuid().or(z.string().uuid()),
        quantity: z.number().int().min(1),
        condition: z.string().optional()
    })).min(1)
})

export const returnUpdateSchema = z.object({
    returnId: z.string().cuid().or(z.string().uuid()),
    action: z.enum(['add_tracking', 'approve', 'reject', 'process_refund']),
    trackingNumber: z.string().optional(),
    adminNotes: z.string().optional()
})

export type ReturnCreate = z.infer<typeof returnCreateSchema>
export type ReturnUpdate = z.infer<typeof returnUpdateSchema>

import { z } from 'zod'

export const productUpdateSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens').optional(),
    shortDescription: z.string().max(500).optional(),
    fullDescription: z.string().optional(),
    categoryId: z.string().cuid().optional(),
    published: z.boolean().optional(),
    inventoryCount: z.number().int().min(0).optional(),
    priceCents: z.number().int().min(0).optional(),
    compareAtPriceCents: z.number().int().min(0).nullable().optional(),
    requiresConsentGate: z.boolean().optional(),
    restrictedCountries: z.array(z.string().length(2)).optional(),
    isDigital: z.boolean().optional(),
})

export const productCreateSchema = z.object({
    name: z.string().min(1).max(200),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
    shortDescription: z.string().max(500),
    fullDescription: z.string(),
    categoryId: z.string().cuid(),
    published: z.boolean().default(false),
    inventoryCount: z.number().int().min(0).default(0),
    priceCents: z.number().int().min(0),
    compareAtPriceCents: z.number().int().min(0).nullable().optional(),
    requiresConsentGate: z.boolean().default(false),
    restrictedCountries: z.array(z.string().length(2)).default([]),
    isDigital: z.boolean().default(false),
})

export type ProductUpdate = z.infer<typeof productUpdateSchema>
export type ProductCreate = z.infer<typeof productCreateSchema>

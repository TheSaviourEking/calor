import { shipFromName } from '@/lib/discretion'

export interface PackingSlipOrder {
  reference: string
  plainPackaging: boolean
  discreetLabel: boolean
  deliveryInstructions: string | null
  items: { quantity: number; variant?: { sku?: string | null } | null; productId: string }[]
}

export interface PackingSlip {
  reference: string
  lines: { sku: string; quantity: number }[]
  plainPackaging: boolean
  returnName: string
  instructions: string | null
}

// The packer sees SKUs and quantities only: no product names, no brand.
export function buildPackingSlip(order: PackingSlipOrder): PackingSlip {
  return {
    reference: order.reference,
    lines: order.items.map((item) => ({
      sku: item.variant?.sku || item.productId.slice(0, 8).toUpperCase(),
      quantity: item.quantity,
    })),
    plainPackaging: order.plainPackaging,
    returnName: shipFromName(),
    instructions: order.deliveryInstructions,
  }
}

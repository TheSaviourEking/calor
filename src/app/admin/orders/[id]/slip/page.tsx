import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { requireAdminUser } from '@/lib/auth/guards'
import { buildPackingSlip } from '@/lib/orders/packing-slip'

export const dynamic = 'force-dynamic'

// Neutral by design: no calo. wordmark, no product names. The packer sees a
// reference, SKUs and quantities, the return name and any delivery note.
export default async function PackingSlipPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminUser()
  if (!auth.ok) redirect('/')

  const { id } = await params
  const order = await db.order.findUnique({
    where: { id },
    select: {
      reference: true,
      plainPackaging: true,
      discreetLabel: true,
      deliveryInstructions: true,
      items: { select: { quantity: true, productId: true, variantId: true } },
    },
  })
  if (!order) notFound()

  const variantIds = order.items.flatMap((item) => (item.variantId ? [item.variantId] : []))
  const variants = variantIds.length
    ? await db.variant.findMany({ where: { id: { in: variantIds } }, select: { id: true, sku: true } })
    : []
  const skuById = new Map(variants.map((v) => [v.id, v.sku]))

  const slip = buildPackingSlip({
    ...order,
    items: order.items.map((item) => ({
      quantity: item.quantity,
      productId: item.productId,
      variant: item.variantId ? { sku: skuById.get(item.variantId) ?? null } : null,
    })),
  })

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-white p-8 text-charcoal print:static print:p-0">
      <style>{`@media print { @page { margin: 16mm; } .no-print { display: none !important; } }`}</style>
      <div className="mx-auto max-w-xl border border-sand bg-white p-10 print:border-0 print:p-0">
        <p className="font-body text-xs uppercase tracking-widest text-warm-gray">Packing slip</p>
        <h1 className="font-display text-4xl mt-2 mb-8" style={{ fontWeight: 300 }}>
          {slip.reference}
        </h1>

        <table className="w-full font-body text-sm">
          <thead>
            <tr className="border-b border-sand text-left text-xs uppercase tracking-wider text-warm-gray">
              <th className="py-2">SKU</th>
              <th className="py-2 text-right">Qty</th>
            </tr>
          </thead>
          <tbody>
            {slip.lines.map((line, i) => (
              <tr key={`${line.sku}-${i}`} className="border-b border-sand">
                <td className="py-3 font-mono">{line.sku}</td>
                <td className="py-3 text-right">&times; {line.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-8 space-y-4 font-body text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wider text-warm-gray">Packaging</dt>
            <dd className="mt-1">{slip.plainPackaging ? 'Plain box, no branding' : 'Branded box'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-warm-gray">Return name</dt>
            <dd className="mt-1">{slip.returnName}</dd>
          </div>
          {slip.instructions && (
            <div>
              <dt className="text-xs uppercase tracking-wider text-warm-gray">Delivery instructions</dt>
              <dd className="mt-1">{slip.instructions}</dd>
            </div>
          )}
        </dl>

        <p className="no-print mt-10 font-body text-xs text-warm-gray">Use your browser&apos;s print command.</p>
      </div>
    </div>
  )
}

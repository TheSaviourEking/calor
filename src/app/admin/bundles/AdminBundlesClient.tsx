'use client'

import { useState } from 'react'
import { Plus, Trash2, Save, X, Loader2, Package } from 'lucide-react'

interface Product { id: string; name: string; slug: string }
interface BundleItem { id: string; quantity: number; sortOrder: number; product: Product }
interface Bundle {
  id: string; slug: string; name: string; description: string
  priceCents: number; originalPriceCents: number; savingsPercent: number
  isActive: boolean; sortOrder: number; items: BundleItem[]
}

const emptyForm = { name: '', slug: '', description: '', priceCents: '', originalPriceCents: '', isActive: true, sortOrder: 0 }

export default function AdminBundlesClient({ initialBundles, products }: { initialBundles: Bundle[], products: Product[] }) {
  const [bundles, setBundles] = useState(initialBundles)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [selectedProducts, setSelectedProducts] = useState<{ productId: string; quantity: number }[]>([])
  const [loading, setLoading] = useState<string | null>(null)
  const [addingProduct, setAddingProduct] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedProducts.length < 2) { alert('Add at least 2 products to a bundle.'); return }
    setLoading('new')
    try {
      const price = Math.round(parseFloat(form.priceCents) * 100)
      const original = Math.round(parseFloat(form.originalPriceCents) * 100)
      const savings = original > 0 ? Math.round(((original - price) / original) * 100) : 0
      const res = await fetch('/api/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, priceCents: price, originalPriceCents: original, savingsPercent: savings, items: selectedProducts }),
      })
      if (res.ok) {
        const data = await res.json()
        setBundles((b) => [data.bundle, ...b])
        setForm(emptyForm); setSelectedProducts([]); setShowNew(false)
      }
    } catch { /* handled silently */ }
    setLoading(null)
  }

  const toggleActive = async (bundle: Bundle) => {
    setLoading(bundle.id)
    try {
      const res = await fetch('/api/bundles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bundle.id, isActive: !bundle.isActive }),
      })
      if (res.ok) setBundles((b) => b.map((q) => q.id === bundle.id ? { ...q, isActive: !q.isActive } : q))
    } catch { /* handled silently */ }
    setLoading(null)
  }

  const deleteBundle = async (id: string) => {
    if (!confirm('Delete this bundle?')) return
    setLoading(id)
    try {
      const res = await fetch(`/api/bundles?id=${id}`, { method: 'DELETE' })
      if (res.ok) setBundles((b) => b.filter((q) => q.id !== id))
    } catch { /* handled silently */ }
    setLoading(null)
  }

  const addProductToForm = (productId: string) => {
    if (!productId || selectedProducts.find((p) => p.productId === productId)) return
    setSelectedProducts((p) => [...p, { productId, quantity: 1 }])
    setAddingProduct(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-charcoal text-2xl" style={{ fontWeight: 400 }}>Bundles</h1>
          <p className="font-body text-warm-gray text-sm mt-1">{bundles.length} bundles · {bundles.filter((b) => b.isActive).length} active</p>
        </div>
        <button onClick={() => { setShowNew(!showNew); setForm(emptyForm); setSelectedProducts([]) }}
          className="inline-flex items-center gap-2 bg-terracotta text-warm-white px-4 py-2 font-body text-sm uppercase tracking-wider hover:bg-terracotta-light transition-colors">
          {showNew ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Bundle</>}
        </button>
      </div>

      {showNew && (
        <div className="bg-warm-white border border-sand p-6">
          <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>Create Bundle</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-charcoal mb-1">Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta" />
              </div>
              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-charcoal mb-1">Slug *</label>
                <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm font-mono focus:outline-none focus:border-terracotta" />
              </div>
            </div>
            <div>
              <label className="block font-body text-xs uppercase tracking-wider text-charcoal mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-charcoal mb-1">Bundle Price ($) *</label>
                <input required type="number" step="0.01" min="0" value={form.priceCents} onChange={(e) => setForm({ ...form, priceCents: e.target.value })}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta" placeholder="75.00" />
              </div>
              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-charcoal mb-1">Original Price ($) *</label>
                <input required type="number" step="0.01" min="0" value={form.originalPriceCents} onChange={(e) => setForm({ ...form, originalPriceCents: e.target.value })}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta" placeholder="100.00" />
                {form.priceCents && form.originalPriceCents && parseFloat(form.originalPriceCents) > 0 && (
                  <p className="font-body text-xs text-terracotta mt-1">
                    {Math.round(((parseFloat(form.originalPriceCents) - parseFloat(form.priceCents)) / parseFloat(form.originalPriceCents)) * 100)}% savings
                  </p>
                )}
              </div>
            </div>

            {/* Product picker */}
            <div>
              <label className="block font-body text-xs uppercase tracking-wider text-charcoal mb-2">Products (min. 2) *</label>
              <div className="space-y-2 mb-2">
                {selectedProducts.map((sp, idx) => {
                  const prod = products.find((p) => p.id === sp.productId)
                  return (
                    <div key={sp.productId} className="flex items-center gap-3 p-2 bg-cream border border-sand">
                      <Package className="w-4 h-4 text-warm-gray flex-shrink-0" />
                      <span className="flex-1 font-body text-sm text-charcoal">{prod?.name}</span>
                      <input type="number" min={1} value={sp.quantity}
                        onChange={(e) => setSelectedProducts((s) => s.map((p, i) => i === idx ? { ...p, quantity: parseInt(e.target.value) || 1 } : p))}
                        className="w-16 px-2 py-1 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta text-center" />
                      <button type="button" onClick={() => setSelectedProducts((s) => s.filter((_, i) => i !== idx))} className="p-1 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                    </div>
                  )
                })}
              </div>
              <select onChange={(e) => addProductToForm(e.target.value)} value=""
                className="w-full px-3 py-2 border border-dashed border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta text-warm-gray">
                <option value="">+ Add a product to this bundle...</option>
                {products.filter((p) => !selectedProducts.find((sp) => sp.productId === p.id)).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-sand">
              <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 font-body text-sm text-warm-gray hover:text-charcoal">Cancel</button>
              <button type="submit" disabled={loading === 'new'} className="inline-flex items-center gap-2 bg-terracotta text-warm-white px-4 py-2 font-body text-sm uppercase tracking-wider hover:bg-terracotta-light disabled:opacity-50">
                {loading === 'new' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Create Bundle
              </button>
            </div>
          </form>
        </div>
      )}

      {bundles.length === 0 ? (
        <div className="bg-warm-white border border-sand p-12 text-center">
          <Package className="w-12 h-12 text-sand mx-auto mb-3" />
          <p className="font-body text-warm-gray">No bundles yet. Create your first one above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bundles.map((bundle) => (
            <div key={bundle.id} className="bg-warm-white border border-sand p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>{bundle.name}</h3>
                    <span className={`px-2 py-0.5 text-[0.6rem] font-body uppercase tracking-widest ${bundle.isActive ? 'bg-green-100 text-green-700' : 'bg-sand text-warm-gray'}`}>
                      {bundle.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-0.5 text-[0.6rem] font-body bg-terracotta/10 text-terracotta">
                      {bundle.savingsPercent}% off
                    </span>
                  </div>
                  <p className="font-body text-warm-gray text-sm mb-2">{bundle.description}</p>
                  <div className="flex items-center gap-4 text-sm font-body">
                    <span className="text-charcoal font-medium">${(bundle.priceCents / 100).toFixed(2)}</span>
                    <span className="text-warm-gray line-through text-xs">${(bundle.originalPriceCents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {bundle.items.map((item) => (
                      <span key={item.id} className="px-2 py-0.5 text-xs font-body bg-sand/50 text-charcoal">
                        {item.product.name}{item.quantity > 1 && ` ×${item.quantity}`}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleActive(bundle)} disabled={loading === bundle.id}
                    className="px-3 py-2 border border-sand font-body text-xs uppercase tracking-wider hover:bg-sand transition-colors disabled:opacity-50">
                    {loading === bundle.id ? <Loader2 className="w-4 h-4 animate-spin" /> : bundle.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => deleteBundle(bundle.id)} disabled={loading === bundle.id}
                    className="p-2 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

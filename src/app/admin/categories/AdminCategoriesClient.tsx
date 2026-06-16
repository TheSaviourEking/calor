'use client'

import { useState } from 'react'
import { Plus, Edit, Save, X, Loader2, GripVertical } from 'lucide-react'

interface Category {
  id: string
  slug: string
  name: string
  description: string | null
  iconName: string
  sortOrder: number
  _count: { products: number }
}

const LUCIDE_ICONS = ['sparkles', 'droplet', 'shirt', 'book-open', 'play-circle', 'link-2', 'shield', 'lock', 'heart', 'star', 'gift', 'tag', 'box', 'zap', 'globe']

const emptyForm = { name: '', slug: '', description: '', iconName: 'sparkles', sortOrder: 0 }

export default function AdminCategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading('new')
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json()
        setCategories((c) => [...c, { ...data.category, _count: { products: 0 } }])
        setForm(emptyForm)
        setShowNew(false)
      }
    } catch { /* handled silently */ }
    setLoading(null)
  }

  const handleUpdate = async (id: string) => {
    setLoading(id)
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setCategories((c) => c.map((cat) => cat.id === id ? { ...cat, ...form } : cat))
        setEditingId(null)
      }
    } catch { /* handled silently */ }
    setLoading(null)
  }

  const startEdit = (cat: Category) => {
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', iconName: cat.iconName, sortOrder: cat.sortOrder })
    setEditingId(cat.id)
    setShowNew(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-charcoal text-2xl" style={{ fontWeight: 400 }}>Categories</h1>
          <p className="font-body text-warm-gray text-sm mt-1">{categories.length} categories</p>
        </div>
        <button onClick={() => { setShowNew(!showNew); setEditingId(null); setForm(emptyForm) }}
          className="inline-flex items-center gap-2 bg-terracotta text-warm-white px-4 py-2 font-body text-sm uppercase tracking-wider hover:bg-terracotta-light transition-colors">
          {showNew ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Category</>}
        </button>
      </div>

      {/* Create form */}
      {showNew && (
        <div className="bg-warm-white border border-sand p-6">
          <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>New Category</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
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
            <div className="col-span-2">
              <label className="block font-body text-xs uppercase tracking-wider text-charcoal mb-1">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta" />
            </div>
            <div>
              <label className="block font-body text-xs uppercase tracking-wider text-charcoal mb-1">Icon Name</label>
              <select value={form.iconName} onChange={(e) => setForm({ ...form, iconName: e.target.value })}
                className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta">
                {LUCIDE_ICONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-body text-xs uppercase tracking-wider text-charcoal mb-1">Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta" />
            </div>
            <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-sand">
              <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 font-body text-sm text-warm-gray hover:text-charcoal">Cancel</button>
              <button type="submit" disabled={loading === 'new'} className="inline-flex items-center gap-2 bg-terracotta text-warm-white px-4 py-2 font-body text-sm uppercase tracking-wider hover:bg-terracotta-light disabled:opacity-50">
                {loading === 'new' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories list */}
      <div className="bg-warm-white border border-sand overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-sand bg-sand/20">
              {['Order', 'Name', 'Slug', 'Icon', 'Products', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-sand/10 transition-colors">
                {editingId === cat.id ? (
                  <td colSpan={6} className="px-4 py-3">
                    <div className="grid grid-cols-5 gap-3 items-end">
                      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name"
                        className="px-2 py-1.5 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta" />
                      <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Slug"
                        className="px-2 py-1.5 border border-sand bg-cream font-body text-sm font-mono focus:outline-none focus:border-terracotta" />
                      <select value={form.iconName} onChange={(e) => setForm({ ...form, iconName: e.target.value })}
                        className="px-2 py-1.5 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta">
                        {LUCIDE_ICONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                      </select>
                      <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} placeholder="Order"
                        className="px-2 py-1.5 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta" />
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdate(cat.id)} disabled={loading === cat.id}
                          className="px-3 py-1.5 bg-terracotta text-warm-white font-body text-xs uppercase tracking-wider hover:bg-terracotta-light disabled:opacity-50 flex items-center gap-1.5">
                          {loading === cat.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 border border-sand font-body text-xs hover:bg-sand">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 font-body text-warm-gray text-sm">
                        <GripVertical className="w-4 h-4 text-sand" />
                        {cat.sortOrder}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-body text-charcoal text-sm">{cat.name}</td>
                    <td className="px-4 py-3 font-body text-warm-gray text-xs font-mono">{cat.slug}</td>
                    <td className="px-4 py-3 font-body text-warm-gray text-xs">{cat.iconName}</td>
                    <td className="px-4 py-3 font-body text-warm-gray text-sm">{cat._count.products}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => startEdit(cat)} className="p-1.5 hover:bg-sand transition-colors">
                        <Edit className="w-4 h-4 text-warm-gray" />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

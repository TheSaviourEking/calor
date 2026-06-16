'use client'

import { useState } from 'react'
import { Plus, Edit, Eye, EyeOff, Trash2, Save, X, Loader2 } from 'lucide-react'

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  published: boolean
  publishedAt: string | null
  viewCount: number
  readTime: number
  createdAt: string
  author: { id: string; name: string }
  category: { id: string; name: string; slug: string } | null
}

interface BlogAuthor { id: string; name: string }
interface BlogCategory { id: string; name: string; slug: string }

interface Props {
  initialPosts: BlogPost[]
  authors: BlogAuthor[]
  categories: BlogCategory[]
}

const emptyForm = {
  title: '', slug: '', excerpt: '', content: '',
  authorId: '', categoryId: '', readTime: 5, published: false,
}

export default function AdminBlogClient({ initialPosts, authors, categories }: Props) {
  const [posts, setPosts] = useState(initialPosts)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId ? { ...form, id: editingId } : form
      const res = await fetch('/api/blog', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        if (editingId) {
          setPosts((p) => p.map((post) => post.id === editingId ? { ...post, ...data.post } : post))
        } else {
          setPosts((p) => [data.post, ...p])
        }
        setForm(emptyForm)
        setEditingId(null)
        setShowForm(false)
      }
    } catch { /* handled silently */ }
    setLoading(false)
  }

  const handleTogglePublished = async (post: BlogPost) => {
    setActionLoading(post.id)
    try {
      const res = await fetch('/api/blog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, published: !post.published }),
      })
      if (res.ok) {
        setPosts((p) => p.map((q) => q.id === post.id ? { ...q, published: !q.published } : q))
      }
    } catch { /* handled silently */ }
    setActionLoading(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog post? This cannot be undone.')) return
    setActionLoading(id)
    try {
      const res = await fetch(`/api/blog?id=${id}`, { method: 'DELETE' })
      if (res.ok) setPosts((p) => p.filter((post) => post.id !== id))
    } catch { /* handled silently */ }
    setActionLoading(null)
  }

  const handleEdit = (post: BlogPost) => {
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: '',
      authorId: post.author.id,
      categoryId: post.category?.id || '',
      readTime: post.readTime,
      published: post.published,
    })
    setEditingId(post.id)
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-charcoal text-2xl" style={{ fontWeight: 400 }}>Blog Management</h1>
          <p className="font-body text-warm-gray text-sm mt-1">{posts.length} posts · {posts.filter((p) => p.published).length} published</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm) }}
          className="inline-flex items-center gap-2 bg-terracotta text-warm-white px-4 py-2 font-body text-sm uppercase tracking-wider hover:bg-terracotta-light transition-colors"
        >
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Post</>}
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="bg-warm-white border border-sand p-6">
          <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
            {editingId ? 'Edit Post' : 'New Blog Post'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-charcoal text-xs uppercase tracking-wider mb-1">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                  placeholder="Post title"
                />
              </div>
              <div>
                <label className="block font-body text-charcoal text-xs uppercase tracking-wider mb-1">Slug *</label>
                <input
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm font-mono focus:outline-none focus:border-terracotta"
                  placeholder="url-slug"
                />
              </div>
            </div>
            <div>
              <label className="block font-body text-charcoal text-xs uppercase tracking-wider mb-1">Excerpt *</label>
              <textarea
                required
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta resize-none"
                placeholder="Brief summary shown on blog listing"
              />
            </div>
            <div>
              <label className="block font-body text-charcoal text-xs uppercase tracking-wider mb-1">Content (Markdown)</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={8}
                className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm font-mono focus:outline-none focus:border-terracotta resize-y"
                placeholder="Full post content in Markdown format..."
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block font-body text-charcoal text-xs uppercase tracking-wider mb-1">Author *</label>
                <select
                  required
                  value={form.authorId}
                  onChange={(e) => setForm({ ...form, authorId: e.target.value })}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                >
                  <option value="">Select author</option>
                  {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-body text-charcoal text-xs uppercase tracking-wider mb-1">Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                >
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-body text-charcoal text-xs uppercase tracking-wider mb-1">Read Time (min)</label>
                <input
                  type="number"
                  min={1}
                  value={form.readTime}
                  onChange={(e) => setForm({ ...form, readTime: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="published"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
                className="w-4 h-4 accent-terracotta"
              />
              <label htmlFor="published" className="font-body text-sm text-charcoal">Publish immediately</label>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-sand">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm) }}
                className="px-4 py-2 font-body text-sm text-warm-gray hover:text-charcoal transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 bg-terracotta text-warm-white px-4 py-2 font-body text-sm uppercase tracking-wider hover:bg-terracotta-light disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingId ? 'Save Changes' : 'Create Post'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts table */}
      <div className="bg-warm-white border border-sand overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-sand bg-sand/20">
              <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Title</th>
              <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Author</th>
              <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Category</th>
              <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Views</th>
              <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Status</th>
              <th className="text-right px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {posts.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center font-body text-warm-gray text-sm">No blog posts yet.</td></tr>
            ) : posts.map((post) => (
              <tr key={post.id} className="hover:bg-sand/10 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-body text-charcoal text-sm">{post.title}</p>
                  <p className="font-body text-warm-gray text-xs font-mono">{post.slug}</p>
                </td>
                <td className="px-4 py-3 font-body text-warm-gray text-sm">{post.author.name}</td>
                <td className="px-4 py-3 font-body text-warm-gray text-sm">{post.category?.name || '—'}</td>
                <td className="px-4 py-3 font-body text-warm-gray text-sm">{post.viewCount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-body ${post.published ? 'bg-green-100 text-green-700' : 'bg-sand text-warm-gray'}`}>
                    {post.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleTogglePublished(post)} disabled={actionLoading === post.id} className="p-1.5 hover:bg-sand transition-colors" title={post.published ? 'Unpublish' : 'Publish'}>
                      {post.published ? <EyeOff className="w-4 h-4 text-warm-gray" /> : <Eye className="w-4 h-4 text-warm-gray" />}
                    </button>
                    <button onClick={() => handleEdit(post)} className="p-1.5 hover:bg-sand transition-colors" title="Edit">
                      <Edit className="w-4 h-4 text-warm-gray" />
                    </button>
                    <button onClick={() => handleDelete(post.id)} disabled={actionLoading === post.id} className="p-1.5 hover:bg-red-50 transition-colors" title="Delete">
                      {actionLoading === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-red-500" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

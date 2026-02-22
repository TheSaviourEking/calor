'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Plus, Search, Edit, Trash2, Eye, EyeOff, Package, 
  ChevronDown, X, Save, Loader2, AlertCircle
} from 'lucide-react'

interface Variant {
  id: string
  name: string
  price: number
  sku: string
  stock: number
}

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductImage {
  id: string
  url: string
  altText: string
}

interface Product {
  id: string
  slug: string
  name: string
  shortDescription: string
  fullDescription: string
  categoryId: string
  category: Category
  variants: Variant[]
  images: ProductImage[]
  tags: string
  isDigital: boolean
  isRestricted: boolean
  inventoryCount: number
  published: boolean
  badge: string | null
  originalPrice: number | null
  materialInfo: string | null
  safetyInfo: string | null
  cleaningGuide: string | null
  usageGuide: string | null
  estimatedDeliveryDays: number | null
  createdAt: string
  _count?: { orderItems: number }
}

interface AdminProductsClientProps {
  initialProducts: Product[]
  categories: Category[]
}

export default function AdminProductsClient({ 
  initialProducts, 
  categories 
}: AdminProductsClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'published' && product.published) ||
      (statusFilter === 'draft' && !product.published) ||
      (statusFilter === 'low-stock' && product.inventoryCount < 10)
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleTogglePublished = async (product: Product) => {
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !product.published }),
      })
      
      if (!response.ok) throw new Error('Failed to update')
      
      setProducts(products.map(p => 
        p.id === product.id ? { ...p, published: !p.published } : p
      ))
      setSuccess(`Product ${!product.published ? 'published' : 'unpublished'}`)
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError('Failed to update product status')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return
    
    setIsDeleting(productId)
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete')
      
      setProducts(products.filter(p => p.id !== productId))
      setSuccess('Product deleted successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError('Failed to delete product')
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsDeleting(null)
    }
  }

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setIsEditing(true)
  }

  const handleSave = async (updatedProduct: Partial<Product>) => {
    if (!selectedProduct) return
    
    setIsSaving(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      })
      
      if (!response.ok) throw new Error('Failed to save')
      
      const data = await response.json()
      setProducts(products.map(p => 
        p.id === selectedProduct.id ? { ...p, ...data.product } : p
      ))
      setIsEditing(false)
      setSelectedProduct(null)
      setSuccess('Product updated successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError('Failed to save product')
    } finally {
      setIsSaving(false)
    }
  }

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-charcoal text-2xl" style={{ fontWeight: 400 }}>
            Products
          </h1>
          <p className="font-body text-warm-gray text-sm mt-1">
            {products.length} products total
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 bg-terracotta text-warm-white px-4 py-2 font-body text-sm uppercase tracking-wider hover:bg-terracotta-light transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="w-4 h-4" />
          <span className="font-body text-sm">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 text-green-700">
          <Save className="w-4 h-4" />
          <span className="font-body text-sm">{success}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-warm-white p-4 border border-sand">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
            />
          </div>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta appearance-none"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta appearance-none"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="low-stock">Low Stock</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-warm-white border border-sand overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sand bg-sand/20">
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Product</th>
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Price</th>
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Stock</th>
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Sales</th>
                <th className="text-right px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <Package className="w-12 h-12 text-sand mb-2" />
                      <p className="font-body text-warm-gray text-sm">No products found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-sand/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cream to-sand flex-shrink-0 flex items-center justify-center">
                          {product.images[0]?.url ? (
                            <img 
                              src={product.images[0].url} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="font-display text-charcoal/30">{product.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-body text-charcoal text-sm truncate">{product.name}</p>
                          <p className="font-body text-warm-gray text-xs">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-body text-warm-gray text-sm">{product.category.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-body text-sm">
                        {product.originalPrice ? (
                          <div>
                            <span className="text-terracotta">{formatPrice(product.variants[0]?.price || 0)}</span>
                            <span className="text-warm-gray text-xs line-through ml-1">{formatPrice(product.originalPrice)}</span>
                          </div>
                        ) : (
                          <span className="text-charcoal">{formatPrice(product.variants[0]?.price || 0)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-body text-sm ${
                        product.inventoryCount < 10 ? 'text-terracotta' : 'text-charcoal'
                      }`}>
                        {product.inventoryCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-body ${
                        product.published 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-sand text-warm-gray'
                      }`}>
                        {product.published ? 'Published' : 'Draft'}
                      </span>
                      {product.badge && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-body bg-terracotta/10 text-terracotta">
                          {product.badge}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-body text-warm-gray text-sm">
                        {product._count?.orderItems || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTogglePublished(product)}
                          className="p-1.5 hover:bg-sand transition-colors"
                          title={product.published ? 'Unpublish' : 'Publish'}
                        >
                          {product.published ? (
                            <EyeOff className="w-4 h-4 text-warm-gray" />
                          ) : (
                            <Eye className="w-4 h-4 text-warm-gray" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1.5 hover:bg-sand transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-warm-gray" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={isDeleting === product.id}
                          className="p-1.5 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {isDeleting === product.id ? (
                            <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-500" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-warm-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-warm-white border-b border-sand p-4 flex items-center justify-between">
              <h2 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                Edit Product
              </h2>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 hover:bg-sand transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleSave({
                  name: formData.get('name') as string,
                  slug: formData.get('slug') as string,
                  shortDescription: formData.get('shortDescription') as string,
                  fullDescription: formData.get('fullDescription') as string,
                  categoryId: formData.get('categoryId') as string,
                  inventoryCount: parseInt(formData.get('inventoryCount') as string) || 0,
                  badge: formData.get('badge') as string || null,
                })
              }}
              className="p-4 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-charcoal text-sm mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={selectedProduct.name}
                    className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                    required
                  />
                </div>
                <div>
                  <label className="block font-body text-charcoal text-sm mb-1">Slug</label>
                  <input
                    type="text"
                    name="slug"
                    defaultValue={selectedProduct.slug}
                    className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block font-body text-charcoal text-sm mb-1">Short Description</label>
                <input
                  type="text"
                  name="shortDescription"
                  defaultValue={selectedProduct.shortDescription}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                />
              </div>
              
              <div>
                <label className="block font-body text-charcoal text-sm mb-1">Full Description</label>
                <textarea
                  name="fullDescription"
                  defaultValue={selectedProduct.fullDescription}
                  rows={4}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-charcoal text-sm mb-1">Category</label>
                  <select
                    name="categoryId"
                    defaultValue={selectedProduct.categoryId}
                    className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-body text-charcoal text-sm mb-1">Inventory</label>
                  <input
                    type="number"
                    name="inventoryCount"
                    defaultValue={selectedProduct.inventoryCount}
                    className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                    min="0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block font-body text-charcoal text-sm mb-1">Badge</label>
                <select
                  name="badge"
                  defaultValue={selectedProduct.badge || ''}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                >
                  <option value="">No badge</option>
                  <option value="bestseller">Bestseller</option>
                  <option value="new">New</option>
                  <option value="sale">Sale</option>
                  <option value="editors-pick">Editor&apos;s Pick</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-sand">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 font-body text-sm text-warm-gray hover:text-charcoal transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 bg-terracotta text-warm-white px-4 py-2 font-body text-sm uppercase tracking-wider hover:bg-terracotta-light transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

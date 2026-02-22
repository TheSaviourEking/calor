'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Calendar, Clock, Video, Lock, Globe, Users,
  MessageCircle, HelpCircle, Plus, X, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import ClientWrapper from '@/components/layout/ClientWrapper'

interface Product {
  id: string
  name: string
  slug: string
  images: Array<{ url: string }>
  variants: Array<{ price: number }>
  category: { name: string }
}

export default function CreateStreamClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetchingProducts, setFetchingProducts] = useState(false)
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
    category: '',
    isPrivate: false,
    password: '',
    allowChat: true,
    allowQuestions: true,
    moderatedChat: false,
  })

  const fetchProducts = async () => {
    setFetchingProducts(true)
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setAvailableProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setFetchingProducts(false)
    }
  }

  const handleAddProduct = (product: Product) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product])
    }
    setShowProductPicker(false)
  }

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.scheduledDate || !formData.scheduledTime) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.isPrivate && !formData.password) {
      toast.error('Private streams require a password')
      return
    }

    setLoading(true)
    try {
      const scheduledStart = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`)

      // Get the correct host profile for the logged in user
      const hostRes = await fetch('/api/hosts/me')
      const hostData = await hostRes.json()

      if (!hostData.host) {
        toast.error('Please create a host profile first')
        router.push('/host/dashboard')
        return
      }

      const res = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: hostData.host.id,
          title: formData.title,
          description: formData.description,
          scheduledStart: scheduledStart.toISOString(),
          isPrivate: formData.isPrivate,
          password: formData.isPrivate ? formData.password : null,
          allowChat: formData.allowChat,
          allowQuestions: formData.allowQuestions,
          moderatedChat: formData.moderatedChat,
          category: formData.category || null,
          productIds: selectedProducts.map(p => p.id),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success('Stream created!')
        router.push(`/host/streams/${data.stream.id}`)
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to create stream')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    'new_products',
    'sale',
    'tutorial',
    'q&a',
    'seasonal',
    'behind_the_scenes',
  ]

  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20 bg-cream">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/host/dashboard"
              className="w-10 h-10 border border-sand flex items-center justify-center hover:border-terracotta"
            >
              <ArrowLeft className="w-5 h-5 text-charcoal" />
            </Link>
            <div>
              <h1
                className="font-display text-charcoal"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 300 }}
              >
                Create Stream
              </h1>
              <p className="font-body text-warm-gray text-sm">
                Schedule a new live shopping event
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-warm-white p-6 border border-sand">
              <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                Basic Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="font-body text-charcoal text-sm mb-2 block">
                    Stream Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Summer Collection Reveal"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                    required
                  />
                </div>

                <div>
                  <label className="font-body text-charcoal text-sm mb-2 block">
                    Description
                  </label>
                  <textarea
                    placeholder="Tell viewers what to expect..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta resize-none"
                  />
                </div>

                <div>
                  <label className="font-body text-charcoal text-sm mb-2 block">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-warm-white p-6 border border-sand">
              <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                Schedule
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-charcoal text-sm mb-2 block">
                    Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-gray" />
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-body text-charcoal text-sm mb-2 block">
                    Time *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-gray" />
                    <input
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="bg-warm-white p-6 border border-sand">
              <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                Featured Products
              </h2>

              {selectedProducts.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {selectedProducts.map((product) => (
                    <div key={product.id} className="relative bg-sand/20 p-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(product.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-charcoal text-cream flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="font-body text-charcoal text-sm truncate">{product.name}</p>
                      <p className="font-body text-warm-gray text-xs">
                        ${((product.variants[0]?.price || 0) / 100).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowProductPicker(true)
                  fetchProducts()
                }}
                className="w-full py-3 border border-sand font-body text-sm text-charcoal hover:border-terracotta flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Products
              </button>
            </div>

            {/* Settings */}
            <div className="bg-warm-white p-6 border border-sand">
              <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                Settings
              </h2>

              <div className="space-y-4">
                {/* Privacy */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-warm-gray" />
                    <span className="font-body text-charcoal text-sm">Private Stream</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isPrivate: !formData.isPrivate })}
                    className={`w-12 h-6 relative transition-colors ${formData.isPrivate ? 'bg-terracotta' : 'bg-sand'
                      }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-cream transition-all ${formData.isPrivate ? 'left-7' : 'left-1'
                        }`}
                    />
                  </button>
                </div>

                {formData.isPrivate && (
                  <input
                    type="password"
                    placeholder="Stream password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                )}

                {/* Chat */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-warm-gray" />
                    <span className="font-body text-charcoal text-sm">Enable Chat</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, allowChat: !formData.allowChat })}
                    className={`w-12 h-6 relative transition-colors ${formData.allowChat ? 'bg-terracotta' : 'bg-sand'
                      }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-cream transition-all ${formData.allowChat ? 'left-7' : 'left-1'
                        }`}
                    />
                  </button>
                </div>

                {/* Questions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-warm-gray" />
                    <span className="font-body text-charcoal text-sm">Allow Questions</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, allowQuestions: !formData.allowQuestions })}
                    className={`w-12 h-6 relative transition-colors ${formData.allowQuestions ? 'bg-terracotta' : 'bg-sand'
                      }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-cream transition-all ${formData.allowQuestions ? 'left-7' : 'left-1'
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Link
                href="/host/dashboard"
                className="flex-1 py-4 border border-sand font-body text-sm text-center text-charcoal hover:border-terracotta"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-terracotta text-cream py-4 font-body text-sm uppercase tracking-wider hover:bg-terracotta/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Stream'
                )}
              </button>
            </div>
          </form>

          {/* Product Picker Modal */}
          {showProductPicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4">
              <div className="bg-warm-white w-full max-w-2xl max-h-[80vh] overflow-hidden">
                <div className="p-4 border-b border-sand flex items-center justify-between">
                  <h3 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                    Select Products
                  </h3>
                  <button
                    onClick={() => setShowProductPicker(false)}
                    className="w-8 h-8 flex items-center justify-center text-warm-gray hover:text-charcoal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 overflow-y-auto max-h-[60vh]">
                  {fetchingProducts ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-terracotta" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {availableProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleAddProduct(product)}
                          disabled={!!selectedProducts.find(p => p.id === product.id)}
                          className="p-3 border border-sand text-left hover:border-terracotta disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <p className="font-body text-charcoal text-sm truncate">{product.name}</p>
                          <p className="font-body text-warm-gray text-xs">
                            ${((product.variants[0]?.price || 0) / 100).toFixed(2)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientWrapper>
  )
}

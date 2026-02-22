'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Gift, ChevronRight, ChevronLeft, Check, Calendar, MapPin, 
  Lock, Globe, Palette, Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import ClientWrapper from '@/components/layout/ClientWrapper'

const REGISTRY_TYPES = [
  { id: 'wedding', label: 'Wedding', icon: '💒', desc: 'For your big day' },
  { id: 'anniversary', label: 'Anniversary', icon: '💕', desc: 'Celebrate your love' },
  { id: 'birthday', label: 'Birthday', icon: '🎂', desc: 'Make it special' },
  { id: 'baby', label: 'Baby Shower', icon: '👶', desc: 'Welcome the little one' },
  { id: 'housewarming', label: 'Housewarming', icon: '🏠', desc: 'New home, new beginnings' },
  { id: 'custom', label: 'Custom', icon: '✨', desc: 'Any special occasion' },
]

const THEMES = [
  { id: 'classic', label: 'Classic', color: '#C4785A', desc: 'Timeless elegance' },
  { id: 'romantic', label: 'Romantic', color: '#E8B4B8', desc: 'Soft and dreamy' },
  { id: 'modern', label: 'Modern', color: '#2C2420', desc: 'Clean and bold' },
  { id: 'minimalist', label: 'Minimalist', color: '#E8DDD0', desc: 'Simple and refined' },
  { id: 'bold', label: 'Bold', color: '#A0522D', desc: 'Make a statement' },
]

export default function NewRegistryClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') || ''
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    registryType: initialType,
    title: '',
    description: '',
    eventDate: '',
    eventLocation: '',
    eventNotes: '',
    theme: 'classic',
    primaryColor: '',
    isPublic: true,
    password: '',
    allowGiftMessages: true,
    allowPartialPurchases: true,
    allowThankYouNotes: true,
    showPurchaserInfo: false,
  })

  const updateForm = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a title for your registry')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success('Registry created!')
        router.push(`/registry/${data.registry.id}/manage`)
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to create registry')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.registryType && formData.title.trim()
      case 2:
        return true // Event details are optional
      case 3:
        return true // Privacy settings always valid
      default:
        return true
    }
  }

  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20 bg-cream">
        <div className="max-w-2xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="eyebrow">Create Registry</span>
            <h1 
              className="font-display text-charcoal mt-4"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 300 }}
            >
              Let&apos;s set up your registry
            </h1>
            <p className="font-body text-warm-gray mt-2">
              Step {step} of 3
            </p>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 ${
                  s <= step ? 'bg-terracotta' : 'bg-sand'
                }`}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="bg-warm-white border border-sand p-8">
            {/* Step 1: Type & Title */}
            {step === 1 && (
              <div className="space-y-8">
                <div>
                  <label className="block font-body text-charcoal text-sm mb-4">
                    What are you celebrating?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {REGISTRY_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => updateForm({ registryType: type.id })}
                        className={`p-4 border text-left transition-all ${
                          formData.registryType === type.id
                            ? 'border-terracotta bg-terracotta/5'
                            : 'border-sand hover:border-warm-gray'
                        }`}
                      >
                        <span className="text-xl">{type.icon}</span>
                        <p className="font-body text-charcoal text-sm mt-2">{type.label}</p>
                        <p className="font-body text-warm-gray text-xs">{type.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-body text-charcoal text-sm mb-2">
                    Registry Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateForm({ title: e.target.value })}
                    placeholder="e.g., Sarah & John's Wedding Registry"
                    className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div>
                  <label className="block font-body text-charcoal text-sm mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateForm({ description: e.target.value })}
                    placeholder="Share a message with your guests..."
                    rows={3}
                    className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Event Details */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-terracotta" />
                  <h3 className="font-display text-charcoal" style={{ fontWeight: 400 }}>
                    Event Details
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-charcoal text-sm mb-2">
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => updateForm({ eventDate: e.target.value })}
                      className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-charcoal text-sm mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.eventLocation}
                      onChange={(e) => updateForm({ eventLocation: e.target.value })}
                      placeholder="City, State"
                      className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-body text-charcoal text-sm mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.eventNotes}
                    onChange={(e) => updateForm({ eventNotes: e.target.value })}
                    placeholder="Any special instructions for guests..."
                    rows={3}
                    className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-sand">
                  <div className="flex items-center gap-3 mb-4">
                    <Palette className="w-5 h-5 text-terracotta" />
                    <h3 className="font-display text-charcoal" style={{ fontWeight: 400 }}>
                      Theme
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => updateForm({ theme: theme.id, primaryColor: theme.color })}
                        className={`p-3 border text-center transition-all ${
                          formData.theme === theme.id
                            ? 'border-terracotta bg-terracotta/5'
                            : 'border-sand hover:border-warm-gray'
                        }`}
                      >
                        <div 
                          className="w-6 h-6 mx-auto mb-2"
                          style={{ backgroundColor: theme.color }}
                        />
                        <p className="font-body text-charcoal text-xs">{theme.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Privacy Settings */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-5 h-5 text-terracotta" />
                  <h3 className="font-display text-charcoal" style={{ fontWeight: 400 }}>
                    Privacy & Settings
                  </h3>
                </div>

                {/* Public/Private Toggle */}
                <div className="p-4 border border-sand bg-cream/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {formData.isPublic ? (
                        <Globe className="w-5 h-5 text-terracotta" />
                      ) : (
                        <Lock className="w-5 h-5 text-terracotta" />
                      )}
                      <div>
                        <p className="font-body text-charcoal text-sm">
                          {formData.isPublic ? 'Public Registry' : 'Private Registry'}
                        </p>
                        <p className="font-body text-warm-gray text-xs">
                          {formData.isPublic 
                            ? 'Anyone with the link can view' 
                            : 'Password required to view'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateForm({ isPublic: !formData.isPublic })}
                      className={`relative w-12 h-6 transition-colors ${
                        formData.isPublic ? 'bg-terracotta' : 'bg-sand'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-cream transition-transform ${
                          formData.isPublic ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {!formData.isPublic && (
                    <div className="mt-4">
                      <label className="block font-body text-charcoal text-sm mb-2">
                        Password
                      </label>
                      <input
                        type="text"
                        value={formData.password}
                        onChange={(e) => updateForm({ password: e.target.value })}
                        placeholder="Enter a password for guests"
                        className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                      />
                    </div>
                  )}
                </div>

                {/* Feature Toggles */}
                <div className="space-y-3">
                  <p className="font-body text-charcoal text-sm font-medium">Features</p>
                  
                  {[
                    { key: 'allowGiftMessages', label: 'Gift Messages', desc: 'Let guests include personal messages' },
                    { key: 'allowPartialPurchases', label: 'Group Gifting', desc: 'Allow contributions toward items' },
                    { key: 'allowThankYouNotes', label: 'Thank You Notes', desc: 'Send thank you messages to gifters' },
                    { key: 'showPurchaserInfo', label: 'Show Purchasers', desc: 'Display who bought each item' },
                  ].map((feature) => (
                    <div key={feature.key} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-body text-charcoal text-sm">{feature.label}</p>
                        <p className="font-body text-warm-gray text-xs">{feature.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateForm({ 
                          [feature.key]: !formData[feature.key as keyof typeof formData] 
                        })}
                        className={`relative w-12 h-6 transition-colors ${
                          formData[feature.key as keyof typeof formData] ? 'bg-terracotta' : 'bg-sand'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-cream transition-transform ${
                            formData[feature.key as keyof typeof formData] ? 'right-1' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="p-4 bg-terracotta/5 border border-terracotta/20">
                  <h4 className="font-body text-charcoal text-sm font-medium mb-2">Summary</h4>
                  <div className="space-y-1 text-xs font-body text-warm-gray">
                    <p><span className="text-charcoal">Type:</span> {REGISTRY_TYPES.find(t => t.id === formData.registryType)?.label}</p>
                    <p><span className="text-charcoal">Title:</span> {formData.title}</p>
                    {formData.eventDate && (
                      <p><span className="text-charcoal">Date:</span> {new Date(formData.eventDate).toLocaleDateString()}</p>
                    )}
                    <p><span className="text-charcoal">Privacy:</span> {formData.isPublic ? 'Public' : 'Password Protected'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-sand">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="inline-flex items-center gap-2 font-body text-warm-gray text-sm hover:text-charcoal"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push('/registry')}
                  className="font-body text-warm-gray text-sm hover:text-charcoal"
                >
                  Cancel
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="inline-flex items-center gap-2 bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-terracotta text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta-light disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating...' : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Create Registry
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ClientWrapper>
  )
}

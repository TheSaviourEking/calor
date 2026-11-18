'use client'

import { useState, useEffect } from 'react'
import { 
  Package, Eye, Gift, Check, Loader2,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'

interface PackagingPreference {
  id: string
  senderName: string | null
  senderNameEnabled: boolean
  plainPackaging: boolean
  discreteLabel: boolean
  requireSignature: boolean
  deliveryInstructions: string | null
  includeGiftNote: boolean
  defaultGiftMessage: string | null
  preferredDeliveryDays: string | null
  avoidWeekends: boolean
}

export default function PackagingClient() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [_preference, setPreference] = useState<PackagingPreference | null>(null)
  
  // Form state with defaults. Only choices fulfilment actually honours are
  // offered: plain packaging, discreet label and delivery instructions travel
  // with each order to the packing slip. Sender name, signature and delivery
  // day controls stay hidden until fulfilment can act on them.
  const [plainPackaging, setPlainPackaging] = useState(true)
  const [discreteLabel, setDiscreteLabel] = useState(true)
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [includeGiftNote, setIncludeGiftNote] = useState(false)
  const [defaultGiftMessage, setDefaultGiftMessage] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/packaging')
      const data = await res.json()
      
      if (data.preference) {
        setPreference(data.preference)
        setPlainPackaging(data.preference.plainPackaging ?? true)
        setDiscreteLabel(data.preference.discreteLabel ?? true)
        setDeliveryInstructions(data.preference.deliveryInstructions || '')
        setIncludeGiftNote(data.preference.includeGiftNote || false)
        setDefaultGiftMessage(data.preference.defaultGiftMessage || '')
      }
    } catch (error) {
      console.error('Failed to fetch packaging preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/packaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plainPackaging,
          discreteLabel,
          deliveryInstructions,
          includeGiftNote,
          defaultGiftMessage,
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Preferences saved')
        setPreference(data.preference)
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-terracotta" />
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 
          className="font-display text-charcoal mb-2"
          style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 300 }}
        >
          Packaging Preferences
        </h1>
        <p className="font-body text-warm-gray">
          Customize how your orders are packaged and delivered
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-warm-white border border-sand p-6 mb-8">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-terracotta flex-shrink-0" />
          <div>
            <p className="font-body text-charcoal font-medium">Your Privacy Matters</p>
            <p className="font-body text-warm-gray text-sm mt-1">
              Orders ship in plain packaging by default. Your choices here travel with each
              order to the people who pack it.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Discretion Settings */}
        <div className="bg-warm-white border border-sand p-6">
          <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
            Discretion Settings
          </h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 border border-sand cursor-pointer hover:border-terracotta/50">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-warm-gray" />
                <div>
                  <p className="font-body text-charcoal text-sm">Plain Packaging</p>
                  <p className="font-body text-warm-gray text-xs">
                    No branding or logos on the package
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={plainPackaging}
                onChange={(e) => setPlainPackaging(e.target.checked)}
                className="w-5 h-5 accent-terracotta"
              />
            </label>

            <label className="flex items-center justify-between p-4 border border-sand cursor-pointer hover:border-terracotta/50">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-warm-gray" />
                <div>
                  <p className="font-body text-charcoal text-sm">Discreet Label</p>
                  <p className="font-body text-warm-gray text-xs">
                    Contents described generically on the packing slip
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={discreteLabel}
                onChange={(e) => setDiscreteLabel(e.target.checked)}
                className="w-5 h-5 accent-terracotta"
              />
            </label>
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="bg-warm-white border border-sand p-6">
          <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
            Delivery Settings
          </h2>
          <div className="space-y-4">
            <div className="p-4 border border-sand">
              <p className="font-body text-charcoal text-sm mb-2">Delivery Instructions</p>
              <p className="font-body text-warm-gray text-xs mb-3">
                Safe place preferences or special instructions
              </p>
              <textarea
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="e.g., Leave at back door, buzz apartment 4B..."
                className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm min-h-[80px] focus:outline-none focus:border-terracotta resize-none"
              />
            </div>
          </div>
        </div>

        {/* Gift Settings */}
        <div className="bg-warm-white border border-sand p-6">
          <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
            Gift Settings
          </h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 border border-sand cursor-pointer hover:border-terracotta/50">
              <div className="flex items-center gap-3">
                <Gift className="h-5 w-5 text-warm-gray" />
                <div>
                  <p className="font-body text-charcoal text-sm">Include Gift Note by Default</p>
                  <p className="font-body text-warm-gray text-xs">
                    Add a gift message to orders when marked as gift
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeGiftNote}
                onChange={(e) => setIncludeGiftNote(e.target.checked)}
                className="w-5 h-5 accent-terracotta"
              />
            </label>

            {includeGiftNote && (
              <div className="p-4 border border-sand">
                <p className="font-body text-charcoal text-sm mb-2">Default Gift Message</p>
                <textarea
                  value={defaultGiftMessage}
                  onChange={(e) => setDefaultGiftMessage(e.target.value)}
                  placeholder="Write your default gift message..."
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm min-h-[100px] focus:outline-none focus:border-terracotta resize-none"
                  maxLength={200}
                />
                <p className="font-body text-warm-gray text-xs mt-1">
                  {defaultGiftMessage.length}/200 characters
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-charcoal text-cream py-4 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </>
  )
}

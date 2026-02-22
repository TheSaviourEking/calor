'use client'

import { useState, useEffect } from 'react'
import { 
  Package, Eye, Truck, Mail, Gift, Check, Loader2, 
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
  const [preference, setPreference] = useState<PackagingPreference | null>(null)
  
  // Form state with defaults
  const [senderName, setSenderName] = useState('')
  const [senderNameEnabled, setSenderNameEnabled] = useState(false)
  const [plainPackaging, setPlainPackaging] = useState(true)
  const [discreteLabel, setDiscreteLabel] = useState(true)
  const [requireSignature, setRequireSignature] = useState(false)
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [includeGiftNote, setIncludeGiftNote] = useState(false)
  const [defaultGiftMessage, setDefaultGiftMessage] = useState('')
  const [avoidWeekends, setAvoidWeekends] = useState(false)
  const [preferredDays, setPreferredDays] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/packaging')
      const data = await res.json()
      
      if (data.preference) {
        setPreference(data.preference)
        setSenderName(data.preference.senderName || '')
        setSenderNameEnabled(data.preference.senderNameEnabled || false)
        setPlainPackaging(data.preference.plainPackaging ?? true)
        setDiscreteLabel(data.preference.discreteLabel ?? true)
        setRequireSignature(data.preference.requireSignature || false)
        setDeliveryInstructions(data.preference.deliveryInstructions || '')
        setIncludeGiftNote(data.preference.includeGiftNote || false)
        setDefaultGiftMessage(data.preference.defaultGiftMessage || '')
        setAvoidWeekends(data.preference.avoidWeekends || false)
        
        if (data.preference.preferredDeliveryDays) {
          setPreferredDays(JSON.parse(data.preference.preferredDeliveryDays))
        }
      }
    } catch (error) {
      console.error('Failed to fetch packaging preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDayToggle = (day: string) => {
    setPreferredDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/packaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName,
          senderNameEnabled,
          plainPackaging,
          discreteLabel,
          requireSignature,
          deliveryInstructions,
          includeGiftNote,
          defaultGiftMessage,
          preferredDeliveryDays: preferredDays,
          avoidWeekends
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

  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

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
              All orders ship in plain, unmarked packaging by default. These preferences help us 
              customize your delivery experience even further.
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
                  <p className="font-body text-charcoal text-sm">Discrete Label</p>
                  <p className="font-body text-warm-gray text-xs">
                    Generic product description on shipping label
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

            <div className="p-4 border border-sand">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-warm-gray" />
                  <div>
                    <p className="font-body text-charcoal text-sm">Custom Sender Name</p>
                    <p className="font-body text-warm-gray text-xs">
                      Use a different name on the return address
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={senderNameEnabled}
                  onChange={(e) => setSenderNameEnabled(e.target.checked)}
                  className="w-5 h-5 accent-terracotta"
                />
              </div>
              {senderNameEnabled && (
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Enter sender name"
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                />
              )}
            </div>
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="bg-warm-white border border-sand p-6">
          <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
            Delivery Settings
          </h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 border border-sand cursor-pointer hover:border-terracotta/50">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-warm-gray" />
                <div>
                  <p className="font-body text-charcoal text-sm">Require Signature</p>
                  <p className="font-body text-warm-gray text-xs">
                    Package must be signed for on delivery
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={requireSignature}
                onChange={(e) => setRequireSignature(e.target.checked)}
                className="w-5 h-5 accent-terracotta"
              />
            </label>

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

            <div className="p-4 border border-sand">
              <p className="font-body text-charcoal text-sm mb-3">Preferred Delivery Days</p>
              <div className="flex flex-wrap gap-2">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => handleDayToggle(day)}
                    className={`px-4 py-2 border font-body text-xs uppercase tracking-wider transition-colors ${
                      preferredDays.includes(day)
                        ? 'border-terracotta bg-terracotta/10 text-charcoal'
                        : 'border-sand text-warm-gray hover:border-terracotta/50'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between p-4 border border-sand cursor-pointer hover:border-terracotta/50">
              <div>
                <p className="font-body text-charcoal text-sm">Avoid Weekend Delivery</p>
                <p className="font-body text-warm-gray text-xs">
                  Only deliver on weekdays
                </p>
              </div>
              <input
                type="checkbox"
                checked={avoidWeekends}
                onChange={(e) => setAvoidWeekends(e.target.checked)}
                className="w-5 h-5 accent-terracotta"
              />
            </label>
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

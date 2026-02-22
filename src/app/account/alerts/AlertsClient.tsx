'use client'

import { useState, useEffect } from 'react'
import { Bell, Trash2, Tag, Package, Settings, Check } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface PriceAlert {
  id: string
  productId: string
  productName: string
  productSlug: string
  imageUrl: string | null
  targetPrice: number
  currentPrice: number
  latestPrice: number
  isNotified: boolean
  createdAt: string
}

interface StockAlert {
  id: string
  productId: string
  productName: string
  productSlug: string
  productInventory: number
  imageUrl: string | null
  variantId: string | null
  isNotified: boolean
  createdAt: string
}

interface Preferences {
  priceDropAlerts: boolean
  backInStockAlerts: boolean
  orderUpdates: boolean
  newsletter: boolean
  securityAlerts: boolean
  loyaltyUpdates: boolean
}

export default function AlertsClient() {
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([])
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [preferences, setPreferences] = useState<Preferences>({
    priceDropAlerts: true,
    backInStockAlerts: true,
    orderUpdates: true,
    newsletter: false,
    securityAlerts: true,
    loyaltyUpdates: true,
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'price' | 'stock' | 'settings'>('price')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [priceRes, stockRes, prefsRes] = await Promise.all([
        fetch('/api/alerts/price-drop'),
        fetch('/api/alerts/stock'),
        fetch('/api/alerts/preferences'),
      ])

      if (priceRes.ok) {
        const data = await priceRes.json()
        setPriceAlerts(data.alerts || [])
      }
      if (stockRes.ok) {
        const data = await stockRes.json()
        setStockAlerts(data.alerts || [])
      }
      if (prefsRes.ok) {
        const data = await prefsRes.json()
        setPreferences(data.preferences || preferences)
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const deletePriceAlert = async (alertId: string) => {
    try {
      const res = await fetch('/api/alerts/price-drop', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      })
      if (res.ok) {
        setPriceAlerts(priceAlerts.filter((a) => a.id !== alertId))
        toast.success('Alert removed')
      }
    } catch {
      toast.error('Failed to remove alert')
    }
  }

  const deleteStockAlert = async (alertId: string) => {
    try {
      const res = await fetch('/api/alerts/stock', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      })
      if (res.ok) {
        setStockAlerts(stockAlerts.filter((a) => a.id !== alertId))
        toast.success('Alert removed')
      }
    } catch {
      toast.error('Failed to remove alert')
    }
  }

  const updatePreferences = async (key: keyof Preferences, value: boolean) => {
    try {
      const newPrefs = { ...preferences, [key]: value }
      const res = await fetch('/api/alerts/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs),
      })
      if (res.ok) {
        setPreferences(newPrefs)
        toast.success('Preferences updated')
      }
    } catch {
      toast.error('Failed to update preferences')
    }
  }

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="font-body text-warm-gray">Loading...</p>
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
          Alerts & Notifications
        </h1>
        <p className="font-body text-warm-gray">
          Manage your price drop alerts, stock notifications, and preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-sand mb-8">
        <button
          onClick={() => setActiveTab('price')}
          className={`px-6 py-3 font-body text-sm transition-colors ${
            activeTab === 'price'
              ? 'text-charcoal border-b-2 border-charcoal'
              : 'text-warm-gray hover:text-terracotta'
          }`}
        >
          <Tag className="w-4 h-4 inline mr-2" />
          Price Drops ({priceAlerts.length})
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-6 py-3 font-body text-sm transition-colors ${
            activeTab === 'stock'
              ? 'text-charcoal border-b-2 border-charcoal'
              : 'text-warm-gray hover:text-terracotta'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Back in Stock ({stockAlerts.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 font-body text-sm transition-colors ${
            activeTab === 'settings'
              ? 'text-charcoal border-b-2 border-charcoal'
              : 'text-warm-gray hover:text-terracotta'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Preferences
        </button>
      </div>

      {/* Price Drop Alerts */}
      {activeTab === 'price' && (
        <div>
          {priceAlerts.length === 0 ? (
            <div className="text-center py-12 bg-sand/20">
              <Tag className="w-12 h-12 text-warm-gray/50 mx-auto mb-4" />
              <p className="font-body text-warm-gray">No price drop alerts yet</p>
              <p className="font-body text-warm-gray/70 text-sm mt-1">
                Set alerts on products to get notified when prices drop.
              </p>
              <Link
                href="/shop"
                className="inline-block mt-4 px-6 py-2 bg-charcoal text-cream font-body text-sm hover:bg-terracotta transition-colors"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {priceAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-4 p-4 bg-cream border border-sand"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-cream to-sand flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${alert.productSlug}`}
                      className="font-body text-charcoal hover:text-terracotta"
                    >
                      {alert.productName}
                    </Link>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="font-body text-sm text-warm-gray">
                        Current: {formatPrice(alert.latestPrice)}
                      </span>
                      <span className="font-body text-sm text-terracotta">
                        Alert at: {formatPrice(alert.targetPrice)}
                      </span>
                    </div>
                    {alert.isNotified && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs text-terracotta">
                        <Check className="w-3 h-3" />
                        Notification sent
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => deletePriceAlert(alert.id)}
                    className="p-2 text-warm-gray hover:text-terracotta transition-colors"
                    aria-label="Remove alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stock Alerts */}
      {activeTab === 'stock' && (
        <div>
          {stockAlerts.length === 0 ? (
            <div className="text-center py-12 bg-sand/20">
              <Package className="w-12 h-12 text-warm-gray/50 mx-auto mb-4" />
              <p className="font-body text-warm-gray">No stock alerts yet</p>
              <p className="font-body text-warm-gray/70 text-sm mt-1">
                Get notified when out-of-stock items become available.
              </p>
              <Link
                href="/shop"
                className="inline-block mt-4 px-6 py-2 bg-charcoal text-cream font-body text-sm hover:bg-terracotta transition-colors"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {stockAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-4 p-4 bg-cream border border-sand"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-cream to-sand flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${alert.productSlug}`}
                      className="font-body text-charcoal hover:text-terracotta"
                    >
                      {alert.productName}
                    </Link>
                    <div className="mt-1">
                      {alert.productInventory > 0 ? (
                        <span className="font-body text-sm text-terracotta">
                          Back in stock! ({alert.productInventory} available)
                        </span>
                      ) : (
                        <span className="font-body text-sm text-warm-gray">
                          Waiting for restock
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteStockAlert(alert.id)}
                    className="p-2 text-warm-gray hover:text-terracotta transition-colors"
                    aria-label="Remove alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preferences */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="p-6 bg-cream border border-sand">
            <h3 className="font-body text-charcoal mb-4">Email Notifications</h3>
            <div className="space-y-4">
              <ToggleSetting
                label="Price Drop Alerts"
                description="Get notified when items on your wishlist drop in price"
                checked={preferences.priceDropAlerts}
                onChange={(v) => updatePreferences('priceDropAlerts', v)}
              />
              <ToggleSetting
                label="Back in Stock"
                description="Get notified when out-of-stock items become available"
                checked={preferences.backInStockAlerts}
                onChange={(v) => updatePreferences('backInStockAlerts', v)}
              />
              <ToggleSetting
                label="Order Updates"
                description="Receive shipping and delivery notifications"
                checked={preferences.orderUpdates}
                onChange={(v) => updatePreferences('orderUpdates', v)}
              />
              <ToggleSetting
                label="Security Alerts"
                description="Get notified about account security events"
                checked={preferences.securityAlerts}
                onChange={(v) => updatePreferences('securityAlerts', v)}
              />
              <ToggleSetting
                label="Loyalty Points"
                description="Updates about your points balance and rewards"
                checked={preferences.loyaltyUpdates}
                onChange={(v) => updatePreferences('loyaltyUpdates', v)}
              />
              <ToggleSetting
                label="Newsletter"
                description="Receive our newsletter with new products and offers"
                checked={preferences.newsletter}
                onChange={(v) => updatePreferences('newsletter', v)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-body text-charcoal text-sm">{label}</p>
        <p className="font-body text-warm-gray text-xs">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 relative transition-colors ${
          checked ? 'bg-terracotta' : 'bg-sand'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-cream transition-transform ${
            checked ? 'right-1' : 'left-1'
          }`}
        />
      </button>
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Palette, Check, RotateCcw, ShoppingCart, Heart, Share2, 
  Info, ChevronDown, Loader2, Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { useLocaleStore, useCartStore, useWishlistStore } from '@/stores'

interface ConfigurationOption {
  value: string
  label: string
  priceModifier: number
  image?: string
  inStock: boolean
  hex?: string // For color swatches
}

interface Configuration {
  id: string
  configType: string
  name: string
  description?: string
  options: ConfigurationOption[]
  displayType: string
  isRequired: boolean
}

interface ProductConfiguratorProps {
  productId: string
  productName: string
  basePrice: number
  productImage?: string
  onConfigurationChange?: (config: Record<string, string>, totalPrice: number) => void
}

const colorSwatches: Record<string, string> = {
  ivory: '#FFFFF0',
  rose_gold: '#B76E79',
  black: '#2C2C2C',
  purple: '#9B59B6',
  pink: '#E91E63',
  teal: '#008080',
  silver: '#C0C0C0',
  gold: '#FFD700',
  coral: '#FF6B6B',
  navy: '#1A1A2E',
}

export default function ProductConfigurator({
  productId,
  productName,
  basePrice,
  productImage,
  onConfigurationChange,
}: ProductConfiguratorProps) {
  const [configurations, setConfigurations] = useState<Configuration[]>([])
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [activeConfig, setActiveConfig] = useState<string | null>(null)
  
  const { formatPrice } = useLocaleStore()
  const { addItem } = useCartStore()
  const { toggleItem, isInWishlist } = useWishlistStore()

  // Fetch configurations
  useEffect(() => {
    const fetchConfigurations = async () => {
      try {
        const res = await fetch(`/api/experience/configurations?productId=${productId}`)
        if (res.ok) {
          const data = await res.json()
          const configs = data.configurations.map((c: Configuration) => ({
            ...c,
            options: JSON.parse(c.options as unknown as string)
          }))
          setConfigurations(configs)
          
          // Set default selections
          const defaults: Record<string, string> = {}
          configs.forEach((config: Configuration) => {
            const inStockOption = config.options.find((o: ConfigurationOption) => o.inStock)
            if (inStockOption) {
              defaults[config.id] = inStockOption.value
            }
          })
          setSelectedOptions(defaults)
        }
      } catch (error) {
        console.error('Error fetching configurations:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchConfigurations()
  }, [productId])

  // Calculate total price
  const totalPrice = useMemo(() => {
    let total = basePrice
    configurations.forEach(config => {
      const selectedValue = selectedOptions[config.id]
      const option = config.options.find(o => o.value === selectedValue)
      if (option) {
        total += option.priceModifier
      }
    })
    return total
  }, [basePrice, configurations, selectedOptions])

  // Notify parent of changes
  useEffect(() => {
    onConfigurationChange?.(selectedOptions, totalPrice)
  }, [selectedOptions, totalPrice, onConfigurationChange])

  const handleOptionSelect = (configId: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [configId]: value
    }))
  }

  const handleReset = () => {
    const defaults: Record<string, string> = {}
    configurations.forEach(config => {
      const inStockOption = config.options.find(o => o.inStock)
      if (inStockOption) {
        defaults[config.id] = inStockOption.value
      }
    })
    setSelectedOptions(defaults)
    toast.success('Configuration reset')
  }

  const handleAddToCart = () => {
    const configDescription = configurations.map(c => {
      const opt = c.options.find(o => o.value === selectedOptions[c.id])
      return `${c.name}: ${opt?.label}`
    }).join(', ')
    
    addItem({
      id: `${productId}-${JSON.stringify(selectedOptions)}`,
      productId,
      variantId: Object.values(selectedOptions).join('-'),
      name: productName,
      category: 'Configured Product',
      price: totalPrice,
      quantity: 1,
      image: productImage,
    })
    toast.success('Added to bag')
  }

  const handleShare = async () => {
    const config = JSON.stringify(selectedOptions)
    if (navigator.share) {
      await navigator.share({
        title: productName,
        text: `Check out my custom configuration for ${productName}`,
        url: `${window.location.href}?config=${encodeURIComponent(config)}`,
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard')
    }
  }

  const renderOptionSelector = (config: Configuration) => {
    const selectedValue = selectedOptions[config.id]
    
    switch (config.displayType) {
      case 'color':
        return (
          <div className="flex flex-wrap gap-2">
            {config.options.map(option => (
              <button
                key={option.value}
                onClick={() => option.inStock && handleOptionSelect(config.id, option.value)}
                disabled={!option.inStock}
                className={`w-10 h-10 border-2 transition-all relative ${
                  selectedValue === option.value
                    ? 'border-terracotta scale-110'
                    : 'border-sand hover:border-charcoal'
                } ${!option.inStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={option.label}
                style={{ 
                  backgroundColor: colorSwatches[option.value] || option.hex || '#CCCCCC'
                }}
              >
                {selectedValue === option.value && (
                  <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow-md" />
                )}
                {!option.inStock && (
                  <div className="absolute inset-0 bg-charcoal/50">
                    <div className="absolute inset-0 border-b border-charcoal rotate-45 origin-center scale-150" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )
      
      case 'radio':
        return (
          <div className="space-y-2">
            {config.options.map(option => (
              <button
                key={option.value}
                onClick={() => option.inStock && handleOptionSelect(config.id, option.value)}
                disabled={!option.inStock}
                className={`w-full p-3 border flex items-center justify-between transition-colors ${
                  selectedValue === option.value
                    ? 'border-terracotta bg-terracotta/5'
                    : 'border-sand hover:border-charcoal'
                } ${!option.inStock ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedValue === option.value ? 'border-terracotta' : 'border-warm-gray'
                  }`}>
                    {selectedValue === option.value && (
                      <div className="w-2 h-2 rounded-full bg-terracotta" />
                    )}
                  </div>
                  <span className="font-body text-charcoal text-sm">{option.label}</span>
                </div>
                {option.priceModifier !== 0 && (
                  <span className={`font-body text-xs ${
                    option.priceModifier > 0 ? 'text-terracotta' : 'text-green-600'
                  }`}>
                    {option.priceModifier > 0 ? '+' : ''}{formatPrice(option.priceModifier)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )
      
      case 'slider':
        return (
          <div className="space-y-4">
            <input
              type="range"
              min={0}
              max={config.options.length - 1}
              value={config.options.findIndex(o => o.value === selectedValue)}
              onChange={(e) => {
                const index = parseInt(e.target.value)
                handleOptionSelect(config.id, config.options[index].value)
              }}
              className="w-full accent-terracotta"
            />
            <div className="flex justify-between">
              {config.options.map((option, idx) => (
                <button
                  key={option.value}
                  onClick={() => handleOptionSelect(config.id, option.value)}
                  className={`text-xs font-body ${
                    selectedValue === option.value ? 'text-terracotta' : 'text-warm-gray'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )
      
      default: // select
        return (
          <div className="relative">
            <select
              value={selectedValue || ''}
              onChange={(e) => handleOptionSelect(config.id, e.target.value)}
              className="w-full p-3 border border-sand bg-warm-white font-body text-charcoal appearance-none focus:border-terracotta outline-none"
            >
              {config.options.map(option => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={!option.inStock}
                >
                  {option.label} {option.priceModifier > 0 ? `(+${formatPrice(option.priceModifier)})` : ''}
                  {!option.inStock ? ' - Out of Stock' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray pointer-events-none" />
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="bg-warm-white border border-sand p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-terracotta animate-spin" />
      </div>
    )
  }

  if (configurations.length === 0) {
    return null
  }

  return (
    <div className="bg-warm-white border border-sand">
      {/* Header */}
      <div className="p-4 border-b border-sand">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-terracotta" />
          <h3 className="font-display text-charcoal" style={{ fontWeight: 400 }}>
            Customize Your {productName}
          </h3>
        </div>
        <p className="font-body text-warm-gray text-xs mt-1">
          Select options to personalize your product
        </p>
      </div>

      {/* Configuration Options */}
      <div className="divide-y divide-sand">
        {configurations.map((config) => (
          <div key={config.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-body text-charcoal text-sm">{config.name}</span>
                {config.isRequired && (
                  <span className="text-xs text-terracotta">*</span>
                )}
                <button
                  onClick={() => setActiveConfig(activeConfig === config.id ? null : config.id)}
                  className="text-warm-gray hover:text-terracotta"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            {config.description && activeConfig === config.id && (
              <p className="font-body text-warm-gray text-xs mb-3 bg-sand/20 p-2">
                {config.description}
              </p>
            )}
            
            {renderOptionSelector(config)}
          </div>
        ))}
      </div>

      {/* Price Summary */}
      <div className="p-4 border-t border-sand bg-sand/10">
        <div className="flex items-center justify-between mb-4">
          <span className="font-body text-charcoal text-sm">Total Price</span>
          <div className="text-right">
            {totalPrice !== basePrice && (
              <span className="font-body text-warm-gray text-sm line-through mr-2">
                {formatPrice(basePrice)}
              </span>
            )}
            <span className="font-display text-charcoal text-xl" style={{ fontWeight: 400 }}>
              {formatPrice(totalPrice)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-charcoal text-cream py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Bag
          </button>
          <button
            onClick={() => toggleItem(productId)}
            className={`w-12 h-12 flex items-center justify-center border transition-colors ${
              isInWishlist(productId) 
                ? 'border-terracotta bg-terracotta/10' 
                : 'border-sand hover:border-terracotta'
            }`}
          >
            <Heart 
              className={`w-5 h-5 ${isInWishlist(productId) ? 'fill-terracotta text-terracotta' : 'text-charcoal'}`} 
              
            />
          </button>
          <button
            onClick={handleShare}
            className="w-12 h-12 flex items-center justify-center border border-sand hover:border-terracotta transition-colors"
          >
            <Share2 className="w-5 h-5 text-charcoal" />
          </button>
        </div>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="w-full mt-3 py-2 font-body text-xs text-warm-gray hover:text-terracotta flex items-center justify-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Configuration
        </button>
      </div>

      {/* Live Preview Badge */}
      <div className="px-4 py-2 bg-terracotta/5 border-t border-sand flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-terracotta" />
        <span className="font-body text-xs text-warm-gray">
          Live preview updates as you customize
        </span>
      </div>
    </div>
  )
}

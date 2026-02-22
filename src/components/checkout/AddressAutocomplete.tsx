'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

interface AddressPrediction {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
}

interface AddressData {
  line1: string
  line2: string
  city: string
  state: string
  postcode: string
  country: string
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (address: AddressData) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Start typing your address...',
  className = '',
  disabled = false,
}: AddressAutocompleteProps) {
  const [predictions, setPredictions] = useState<AddressPrediction[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced fetch predictions
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (value.length < 3) {
      setPredictions([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/address/autocomplete?input=${encodeURIComponent(value)}`)
        const data = await res.json()
        setPredictions(data.predictions || [])
        setShowDropdown(data.predictions?.length > 0)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Error fetching predictions:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [value])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle prediction selection
  const handleSelect = async (prediction: AddressPrediction) => {
    setShowDropdown(false)
    setLoading(true)
    
    try {
      const res = await fetch(`/api/address/details?placeId=${prediction.placeId}`)
      const data = await res.json()
      
      if (data.address) {
        onChange(data.address.line1)
        onSelect(data.address)
      }
    } catch (error) {
      console.error('Error fetching address details:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || predictions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < predictions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSelect(predictions[selectedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <MapPin 
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" 
          
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => predictions.length > 0 && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta ${className}`}
        />
        {loading && (
          <Loader2 
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray animate-spin" 
            
          />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && predictions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-warm-white border border-sand shadow-lg max-h-60 overflow-y-auto"
        >
          {predictions.map((prediction, index) => (
            <button
              key={prediction.placeId}
              type="button"
              onClick={() => handleSelect(prediction)}
              className={`w-full text-left px-4 py-3 font-body text-sm hover:bg-sand/30 transition-colors ${
                index === selectedIndex ? 'bg-sand/50' : ''
              }`}
            >
              <div className="text-charcoal">{prediction.mainText}</div>
              <div className="text-warm-gray text-xs mt-0.5">{prediction.secondaryText}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

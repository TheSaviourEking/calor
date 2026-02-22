'use client'

import { useState, useEffect } from 'react'
import { Package, AlertCircle, Check, Clock } from 'lucide-react'

interface StockIndicatorProps {
  productId: string
  variantId?: string
  stock?: number
  showRestockDate?: boolean
  className?: string
}

interface StockStatus {
  available: boolean
  stock: number
  isDigital?: boolean
  error?: string
}

export default function StockIndicator({
  productId,
  variantId,
  stock: initialStock,
  showRestockDate = false,
  className = '',
}: StockIndicatorProps) {
  const [status, setStatus] = useState<StockStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStock() {
      try {
        const res = await fetch('/api/products/stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{ productId, variantId, quantity: 1 }],
          }),
        })

        const data = await res.json()
        if (data.results && data.results[0]) {
          setStatus(data.results[0])
        }
      } catch (error) {
        console.error('Error fetching stock:', error)
      } finally {
        setLoading(false)
      }
    }

    // Use initial stock if provided
    if (initialStock !== undefined) {
      setStatus({
        available: initialStock > 0,
        stock: initialStock,
      })
      setLoading(false)
    } else {
      fetchStock()
    }
  }, [productId, variantId, initialStock])

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Package className="w-4 h-4 text-warm-gray animate-pulse" />
        <span className="font-body text-warm-gray text-sm">Checking stock...</span>
      </div>
    )
  }

  if (!status) {
    return null
  }

  // Digital products
  if (status.isDigital) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Check className="w-4 h-4 text-terracotta" />
        <span className="font-body text-terracotta text-sm">Digital product - instant delivery</span>
      </div>
    )
  }

  // Out of stock
  if (!status.available || status.stock <= 0) {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="font-body text-red-500 text-sm">Out of stock</span>
        </div>
        {showRestockDate && (
          <div className="flex items-center gap-2 text-warm-gray">
            <Clock className="w-3 h-3" />
            <span className="font-body text-xs">Expected restock in 7-14 days</span>
          </div>
        )}
      </div>
    )
  }

  // Low stock (less than 5)
  if (status.stock <= 5) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <AlertCircle className="w-4 h-4 text-amber-600" />
        <span className="font-body text-amber-600 text-sm">
          Only {status.stock} left in stock
        </span>
      </div>
    )
  }

  // In stock
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Check className="w-4 h-4 text-green-600" />
      <span className="font-body text-green-600 text-sm">In stock</span>
    </div>
  )
}

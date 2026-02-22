'use client'

import { useState, useEffect } from 'react'
import { 
  Ruler, Smartphone, CreditCard, Mouse, Tv, Pen, 
  Loader2, ChevronLeft, ChevronRight, Info
} from 'lucide-react'

interface SizeComparison {
  name: string
  length?: number
  width?: number
  height?: number
  diameter?: number
  category: string
  icon: string
}

interface SizeVisualization {
  productId: string
  length: number | null
  width: number | null
  height: number | null
  diameter: number | null
  insertableLength: number | null
  circumference: number | null
  comparisons: SizeComparison[]
}

interface SizeVisualizerProps {
  productId: string
  productName: string
}

const iconComponents: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  smartphone: Smartphone,
  'credit-card': CreditCard,
  mouse: Mouse,
  tv: Tv,
  pen: Pen,
}

const unitLabels = {
  length: 'L',
  width: 'W', 
  height: 'H',
  diameter: 'Ø',
  circumference: 'C',
  insertableLength: 'Insertable',
}

export default function SizeVisualizer({ productId, productName }: SizeVisualizerProps) {
  const [sizeViz, setSizeViz] = useState<SizeVisualization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedComparison, setSelectedComparison] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const [unit, setUnit] = useState<'cm' | 'inches'>('cm')

  useEffect(() => {
    const fetchSizeViz = async () => {
      try {
        const res = await fetch(`/api/experience/size-visualizer?productId=${productId}`)
        if (res.ok) {
          const data = await res.json()
          setSizeViz(data.sizeVisualization)
        }
      } catch (error) {
        console.error('Error fetching size visualization:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSizeViz()
  }, [productId])

  const convertUnit = (cm: number | null | undefined) => {
    if (!cm) return null
    if (unit === 'cm') return cm
    return Math.round(cm * 0.393701 * 10) / 10
  }

  const formatDimension = (value: number | null | undefined) => {
    if (!value) return '—'
    return `${convertUnit(value)} ${unit}`
  }

  if (isLoading) {
    return (
      <div className="bg-warm-white border border-sand p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-terracotta animate-spin" />
      </div>
    )
  }

  if (!sizeViz) return null

  const comparisons = sizeViz.comparisons || []
  const currentComparison = comparisons[selectedComparison]

  // Calculate scale for visualization
  const maxDimension = Math.max(
    sizeViz.length || 0,
    sizeViz.width || 0,
    sizeViz.diameter || 0,
    currentComparison?.length || 0,
    currentComparison?.width || 0
  )
  const scale = 100 / (maxDimension || 10) // pixels per cm

  return (
    <div className="bg-warm-white border border-sand">
      {/* Header */}
      <div className="p-4 border-b border-sand flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ruler className="w-5 h-5 text-terracotta" />
          <h3 className="font-display text-charcoal" style={{ fontWeight: 400 }}>
            Size Visualizer
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUnit(unit === 'cm' ? 'inches' : 'cm')}
            className="px-2 py-1 border border-sand font-body text-xs hover:border-terracotta transition-colors"
          >
            {unit === 'cm' ? 'cm' : 'in'}
          </button>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-warm-gray hover:text-terracotta"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="px-4 py-2 bg-sand/20 border-b border-sand">
          <p className="font-body text-xs text-warm-gray">
            Compare {productName} with everyday objects to understand its size. All measurements are approximate.
          </p>
        </div>
      )}

      {/* Visualization */}
      <div className="p-4">
        {/* Dimensions Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {sizeViz.length && (
            <div className="text-center p-2 bg-sand/20">
              <span className="font-body text-xs text-warm-gray block">Length</span>
              <span className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                {formatDimension(sizeViz.length)}
              </span>
            </div>
          )}
          {sizeViz.diameter && (
            <div className="text-center p-2 bg-sand/20">
              <span className="font-body text-xs text-warm-gray block">Diameter</span>
              <span className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                {formatDimension(sizeViz.diameter)}
              </span>
            </div>
          )}
          {sizeViz.insertableLength && (
            <div className="text-center p-2 bg-sand/20">
              <span className="font-body text-xs text-warm-gray block">Insertable</span>
              <span className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                {formatDimension(sizeViz.insertableLength)}
              </span>
            </div>
          )}
          {sizeViz.width && (
            <div className="text-center p-2 bg-sand/20">
              <span className="font-body text-xs text-warm-gray block">Width</span>
              <span className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                {formatDimension(sizeViz.width)}
              </span>
            </div>
          )}
          {sizeViz.height && (
            <div className="text-center p-2 bg-sand/20">
              <span className="font-body text-xs text-warm-gray block">Height</span>
              <span className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                {formatDimension(sizeViz.height)}
              </span>
            </div>
          )}
          {sizeViz.circumference && (
            <div className="text-center p-2 bg-sand/20">
              <span className="font-body text-xs text-warm-gray block">Circumference</span>
              <span className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                {formatDimension(sizeViz.circumference)}
              </span>
            </div>
          )}
        </div>

        {/* Visual Comparison */}
        {currentComparison && (
          <div className="relative bg-gradient-to-br from-cream to-sand p-6 mb-4">
            <div className="flex items-end justify-center gap-8 h-40">
              {/* Product */}
              <div className="text-center">
                <div 
                  className="bg-terracotta/80 mx-auto mb-2"
                  style={{
                    width: `${(sizeViz.diameter || sizeViz.width || 3) * scale}px`,
                    height: `${(sizeViz.length || 10) * scale}px`,
                    minHeight: '40px',
                    minWidth: '20px',
                    borderRadius: sizeViz.diameter ? '50%' : '0',
                  }}
                />
                <span className="font-body text-xs text-charcoal">Product</span>
                <div className="font-body text-xs text-warm-gray">
                  {formatDimension(sizeViz.length)} × {formatDimension(sizeViz.diameter || sizeViz.width)}
                </div>
              </div>

              {/* Comparison Item */}
              <div className="text-center">
                <div 
                  className="bg-charcoal/80 mx-auto mb-2"
                  style={{
                    width: `${(currentComparison.diameter || currentComparison.width || 5) * scale}px`,
                    height: `${(currentComparison.length || 10) * scale}px`,
                    minHeight: '40px',
                    minWidth: '20px',
                    borderRadius: currentComparison.diameter ? '50%' : '0',
                  }}
                />
                <span className="font-body text-xs text-charcoal">{currentComparison.name}</span>
                <div className="font-body text-xs text-warm-gray">
                  {formatDimension(currentComparison.length)}
                  {currentComparison.width && ` × ${formatDimension(currentComparison.width)}`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Carousel */}
        {comparisons.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedComparison(Math.max(0, selectedComparison - 1))}
              disabled={selectedComparison === 0}
              className="p-1 border border-sand hover:border-terracotta disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex-1 overflow-x-auto">
              <div className="flex gap-2 justify-center">
                {comparisons.map((comp, idx) => {
                  const IconComponent = iconComponents[comp.icon] || Smartphone
                  return (
                    <button
                      key={comp.name}
                      onClick={() => setSelectedComparison(idx)}
                      className={`flex items-center gap-2 px-3 py-2 border transition-colors ${
                        selectedComparison === idx
                          ? 'border-terracotta bg-terracotta/10'
                          : 'border-sand hover:border-terracotta'
                      }`}
                    >
                      <IconComponent className="w-4 h-4 text-warm-gray" />
                      <span className="font-body text-xs text-charcoal whitespace-nowrap">
                        {comp.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            
            <button
              onClick={() => setSelectedComparison(Math.min(comparisons.length - 1, selectedComparison + 1))}
              disabled={selectedComparison === comparisons.length - 1}
              className="p-1 border border-sand hover:border-terracotta disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Size Guide Tip */}
      <div className="px-4 py-2 bg-terracotta/5 border-t border-sand">
        <p className="font-body text-xs text-warm-gray text-center">
          💡 Compare with objects you own to visualize the size accurately
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { RotateCcw, ZoomIn, ZoomOut, Move, Maximize2, Play, Pause, Loader2 } from 'lucide-react'

interface ProductModel {
  id: string
  productId: string
  modelUrl: string
  modelType: 'glb' | 'gltf' | 'obj'
  thumbnailUrl: string | null
  animations: string[]
  hotspots: Array<{
    id: string
    position: { x: number; y: number; z: number }
    label: string
    description: string
  }>
}

interface ProductViewer3DProps {
  product: {
    id: string
    name: string
    images: Array<{ url: string; altText: string }>
  }
  model?: ProductModel
}

export default function ProductViewer3D({ product, model }: ProductViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isRotating, setIsRotating] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [autoRotate, setAutoRotate] = useState(true)
  const animationRef = useRef<number | null>(null)

  // Simulated 3D rotation effect (in production, would use Three.js or model-viewer)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setAutoRotate(false)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    
    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    
    setRotation(prev => ({
      x: prev.x + deltaY * 0.5,
      y: prev.y + deltaX * 0.5
    }))
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Touch support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
      setAutoRotate(false)
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return
    
    const deltaX = e.touches[0].clientX - dragStart.x
    const deltaY = e.touches[0].clientY - dragStart.y
    
    setRotation(prev => ({
      x: prev.x + deltaY * 0.5,
      y: prev.y + deltaX * 0.5
    }))
  }, [isDragging, dragStart])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Auto-rotation
  useEffect(() => {
    if (autoRotate) {
      const animate = () => {
        setRotation(prev => ({
          ...prev,
          y: prev.y + 0.3
        }))
        animationRef.current = requestAnimationFrame(animate)
      }
      animationRef.current = requestAnimationFrame(animate)
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [autoRotate])

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5))
  const handleReset = () => {
    setRotation({ x: 0, y: 0 })
    setZoom(1)
    setAutoRotate(true)
  }

  // Sample hotspots for demo
  const hotspots = model?.hotspots || [
    { id: '1', position: { x: 30, y: 40 }, label: 'Premium Material', description: 'Body-safe silicone with velvety texture' },
    { id: '2', position: { x: 60, y: 60 }, label: 'Control Panel', description: 'Intuitive one-touch controls' },
    { id: '3', position: { x: 45, y: 80 }, label: 'Rechargeable', description: 'USB-C fast charging, 2hr battery life' },
  ]

  return (
    <div className="bg-warm-white border border-sand">
      {/* Header */}
      <div className="p-4 border-b border-sand flex items-center justify-between">
        <div>
          <h3 className="font-display text-charcoal" style={{ fontWeight: 400 }}>
            3D Product View
          </h3>
          <p className="font-body text-warm-gray text-xs">Drag to rotate • Pinch to zoom</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 border ${autoRotate ? 'border-terracotta bg-terracotta/10' : 'border-sand'} transition-colors`}
            title={autoRotate ? 'Stop rotation' : 'Start rotation'}
          >
            {autoRotate ? <Pause className="w-4 h-4 text-terracotta" /> : <Play className="w-4 h-4 text-warm-gray" />}
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 border border-sand hover:border-terracotta transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4 text-warm-gray" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 border border-sand hover:border-terracotta transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4 text-warm-gray" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 border border-sand hover:border-terracotta transition-colors"
            title="Reset view"
          >
            <RotateCcw className="w-4 h-4 text-warm-gray" />
          </button>
        </div>
      </div>

      {/* 3D Viewer */}
      <div
        ref={containerRef}
        className="relative aspect-square bg-gradient-to-br from-cream via-sand/30 to-cream cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-cream/80 z-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-terracotta animate-spin mx-auto mb-2" />
              <p className="font-body text-warm-gray text-sm">Loading 3D model...</p>
            </div>
          </div>
        )}

        {/* Product visualization (simulated 3D) */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-75"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${zoom})`,
          }}
        >
          {/* Product placeholder with 3D effect */}
          <div className="relative">
            <div className="w-48 h-48 bg-gradient-to-br from-sand via-cream to-sand rounded-full shadow-2xl flex items-center justify-center">
              <span className="font-display text-charcoal/20 text-6xl" style={{ fontWeight: 300 }}>
                {product.name.charAt(0)}
              </span>
            </div>
            {/* Reflection effect */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-8 bg-charcoal/5 blur-xl rounded-full" />
          </div>
        </div>

        {/* Hotspots */}
        {!isLoading && hotspots.map((hotspot) => (
          <button
            key={hotspot.id}
            className={`absolute w-6 h-6 rounded-full border-2 transition-all ${
              activeHotspot === hotspot.id
                ? 'border-terracotta bg-terracotta scale-125'
                : 'border-charcoal bg-cream hover:border-terracotta'
            }`}
            style={{
              left: `${hotspot.position.x}%`,
              top: `${hotspot.position.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={(e) => {
              e.stopPropagation()
              setActiveHotspot(activeHotspot === hotspot.id ? null : hotspot.id)
            }}
          >
            <span className="sr-only">{hotspot.label}</span>
          </button>
        ))}

        {/* Hotspot tooltip */}
        {activeHotspot && (
          <div
            className="absolute bg-charcoal text-cream p-3 max-w-xs z-10"
            style={{
              left: `${hotspots.find(h => h.id === activeHotspot)?.position.x || 50}%`,
              top: `${(hotspots.find(h => h.id === activeHotspot)?.position.y || 50) - 15}%`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <p className="font-body text-sm font-medium">
              {hotspots.find(h => h.id === activeHotspot)?.label}
            </p>
            <p className="font-body text-xs text-cream/80 mt-1">
              {hotspots.find(h => h.id === activeHotspot)?.description}
            </p>
            <div className="absolute left-1/2 -bottom-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-charcoal -translate-x-1/2" />
          </div>
        )}

        {/* AR Badge */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-charcoal/80 text-cream px-3 py-1.5">
          <Move className="w-4 h-4" />
          <span className="font-body text-xs">Interactive</span>
        </div>
      </div>

      {/* Hotspot Legend */}
      <div className="p-4 border-t border-sand">
        <p className="font-body text-warm-gray text-xs mb-2">Tap markers to explore features</p>
        <div className="flex flex-wrap gap-2">
          {hotspots.map((hotspot) => (
            <button
              key={hotspot.id}
              onClick={() => setActiveHotspot(activeHotspot === hotspot.id ? null : hotspot.id)}
              className={`px-2 py-1 text-xs font-body border transition-colors ${
                activeHotspot === hotspot.id
                  ? 'border-terracotta bg-terracotta/10 text-terracotta'
                  : 'border-sand text-warm-gray hover:border-terracotta'
              }`}
            >
              {hotspot.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, useMotionValue, useTransform } from 'motion/react'

interface ImageZoomProps {
  src: string
  alt: string
  className?: string
}

export default function ImageZoom({ src, alt, className = '' }: ImageZoomProps) {
  const [isZoomed, setIsZoomed] = useState(false)
  const [isPinching, setIsPinching] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const scale = useTransform(
    [x, y],
    ([latestX, latestY]: number[]) => (isZoomed ? 2 : 1)
  )

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isZoomed) return

    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const offsetX = (e.clientX - centerX) / rect.width
    const offsetY = (e.clientY - centerY) / rect.height

    x.set(offsetX * 50)
    y.set(offsetY * 50)
  }, [isZoomed, x, y])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsPinching(true)
      setIsZoomed(true)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    setIsPinching(false)
    setIsZoomed(false)
    x.set(0)
    y.set(0)
  }, [x, y])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden cursor-zoom-in ${className}`}
      onMouseEnter={() => setIsZoomed(true)}
      onMouseLeave={() => {
        setIsZoomed(false)
        x.set(0)
        y.set(0)
      }}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <motion.div
        className="w-full h-full"
        animate={{
          scale: isZoomed ? 1.5 : 1,
          x: isZoomed ? x.get() * 0.5 : 0,
          y: isZoomed ? y.get() * 0.5 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ originX: 0.5, originY: 0.5 }}
      >
        {/* Placeholder gradient if no image */}
        <div className="w-full h-full bg-gradient-to-br from-cream to-sand flex items-center justify-center">
          <span className="font-display text-charcoal/10 text-8xl" style={{ fontWeight: 300 }}>
            {alt?.charAt(0) || 'C'}
          </span>
        </div>
      </motion.div>

      {/* Zoom indicator */}
      <motion.div
        className="absolute bottom-4 right-4 bg-charcoal/60 text-cream px-3 py-1 text-xs font-body backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: isZoomed ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        Hover to zoom
      </motion.div>
    </div>
  )
}

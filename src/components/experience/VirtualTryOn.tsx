'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Camera, RotateCcw, Download, Share2, Check, X, Loader2, Maximize2, Move, Sparkles } from 'lucide-react'

interface VirtualTryOnProps {
  product?: {
    id: string
    name: string
    category: string
    images: Array<{ url: string; altText: string }>
  }
}

export default function VirtualTryOn({ product }: VirtualTryOnProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null)
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState(true)
  const [adjustments, setAdjustments] = useState({
    scale: 1,
    rotation: 0,
    opacity: 0.8,
    positionX: 50,
    positionY: 50,
  })

  // Sample overlays for demo
  const overlays = [
    { id: 'ring-1', name: 'Classic Ring', category: 'jewelry' },
    { id: 'necklace-1', name: 'Pearl Necklace', category: 'jewelry' },
    { id: 'bracelet-1', name: 'Tennis Bracelet', category: 'jewelry' },
    { id: 'product-1', name: 'Wellness Product', category: 'wellness' },
  ]

  // Start camera
  const startCamera = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsStreaming(true)
        setShowGuide(false)
      }
    } catch (err) {
      console.error('Camera error:', err)
      setError('Unable to access camera. Please check permissions.')
    } finally {
      setIsLoading(false)
    }
  }, [cameraFacing])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsStreaming(false)
    setCapturedImage(null)
  }, [])

  // Switch camera
  const switchCamera = useCallback(async () => {
    stopCamera()
    setCameraFacing(prev => prev === 'user' ? 'environment' : 'user')
  }, [stopCamera])

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    setCapturedImage(canvas.toDataURL('image/jpeg'))
  }, [])

  // Download captured image
  const downloadImage = useCallback(() => {
    if (!capturedImage) return

    const link = document.createElement('a')
    link.download = `tryon-${Date.now()}.jpg`
    link.href = capturedImage
    link.click()
  }, [capturedImage])

  // Share image
  const shareImage = useCallback(async () => {
    if (!capturedImage) return

    try {
      const blob = await (await fetch(capturedImage)).blob()
      const file = new File([blob], 'tryon.jpg', { type: 'image/jpeg' })

      if (navigator.share) {
        await navigator.share({
          title: 'My Virtual Try-On',
          files: [file],
        })
      }
    } catch (err) {
      console.error('Share error:', err)
    }
  }, [capturedImage])

  // Reset
  const handleReset = () => {
    setCapturedImage(null)
    setSelectedOverlay(null)
    setAdjustments({
      scale: 1,
      rotation: 0,
      opacity: 0.8,
      positionX: 50,
      positionY: 50,
    })
  }

  return (
    <div className="bg-warm-white border border-sand">
      {/* Header */}
      <div className="p-4 border-b border-sand flex items-center justify-between">
        <div>
          <h3 className="font-display text-charcoal" style={{ fontWeight: 400 }}>
            Virtual Try-On
          </h3>
          <p className="font-body text-warm-gray text-xs">See how it looks on you with AR</p>
        </div>
        <div className="flex items-center gap-2">
          {isStreaming && (
            <button
              onClick={switchCamera}
              className="p-2 border border-sand hover:border-terracotta transition-colors"
              title="Switch camera"
            >
              <RotateCcw className="w-4 h-4 text-warm-gray" />
            </button>
          )}
        </div>
      </div>

      {/* Camera View */}
      <div className="relative aspect-[3/4] bg-charcoal">
        {/* Video Stream */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${capturedImage ? 'hidden' : ''}`}
          playsInline
          muted
        />

        {/* Canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Captured Image */}
        {capturedImage && (
          <Image
            src={capturedImage}
            alt="Captured"
            width={720}
            height={1280}
            className="w-full h-full object-cover"
          />
        )}

        {/* Overlay Simulation */}
        {isStreaming && selectedOverlay && !capturedImage && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${adjustments.positionX}%`,
              top: `${adjustments.positionY}%`,
              transform: `translate(-50%, -50%) scale(${adjustments.scale}) rotate(${adjustments.rotation}deg)`,
              opacity: adjustments.opacity,
            }}
          >
            <div className="w-20 h-20 bg-terracotta/50 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
        )}

        {/* Start Camera Button */}
        {!isStreaming && !capturedImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {error ? (
              <div className="text-center p-8">
                <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="font-body text-cream text-sm mb-4">{error}</p>
                <button
                  onClick={startCamera}
                  className="px-6 py-3 bg-terracotta text-cream font-body text-sm uppercase tracking-wider"
                >
                  Try Again
                </button>
              </div>
            ) : isLoading ? (
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-terracotta animate-spin mx-auto mb-2" />
                <p className="font-body text-cream text-sm">Starting camera...</p>
              </div>
            ) : (
              <button
                onClick={startCamera}
                className="flex flex-col items-center gap-4 p-8"
              >
                <div className="w-20 h-20 rounded-full border-2 border-cream flex items-center justify-center hover:border-terracotta transition-colors">
                  <Camera className="w-8 h-8 text-cream" />
                </div>
                <p className="font-body text-cream text-sm uppercase tracking-wider">Start Camera</p>
              </button>
            )}
          </div>
        )}

        {/* Guide Overlay */}
        {showGuide && isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-dashed border-cream/50 w-32 h-32 rounded-full" />
          </div>
        )}

        {/* AR Badge */}
        {isStreaming && (
          <div className="absolute top-4 left-4 bg-charcoal/80 text-cream px-3 py-1.5 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-terracotta" />
            <span className="font-body text-xs">AR Active</span>
          </div>
        )}

        {/* Capture Controls */}
        {isStreaming && !capturedImage && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <button
              onClick={stopCamera}
              className="p-3 bg-charcoal/80 text-cream hover:bg-terracotta transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full border-4 border-cream bg-terracotta hover:bg-terracotta/80 transition-colors flex items-center justify-center"
            >
              <Camera className="w-6 h-6 text-cream" />
            </button>
          </div>
        )}

        {/* Captured Image Controls */}
        {capturedImage && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <button
              onClick={handleReset}
              className="p-3 bg-charcoal/80 text-cream hover:bg-terracotta transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={downloadImage}
              className="p-3 bg-charcoal/80 text-cream hover:bg-terracotta transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={shareImage}
              className="p-3 bg-charcoal/80 text-cream hover:bg-terracotta transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCapturedImage(null)}
              className="px-4 py-3 bg-terracotta text-cream font-body text-sm uppercase tracking-wider"
            >
              Retake
            </button>
          </div>
        )}
      </div>

      {/* Overlay Selection */}
      <div className="p-4 border-t border-sand">
        <p className="font-body text-warm-gray text-xs mb-3">Select overlay to try on</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {overlays.map((overlay) => (
            <button
              key={overlay.id}
              onClick={() => setSelectedOverlay(selectedOverlay === overlay.id ? null : overlay.id)}
              className={`flex-shrink-0 px-4 py-2 border text-xs font-body transition-colors ${selectedOverlay === overlay.id
                  ? 'border-terracotta bg-terracotta/10 text-terracotta'
                  : 'border-sand text-warm-gray hover:border-terracotta'
                }`}
            >
              {overlay.name}
            </button>
          ))}
        </div>
      </div>

      {/* Adjustment Controls */}
      {selectedOverlay && isStreaming && !capturedImage && (
        <div className="p-4 border-t border-sand space-y-4">
          <div>
            <label className="font-body text-xs text-warm-gray block mb-2">Scale</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={adjustments.scale}
              onChange={(e) => setAdjustments({ ...adjustments, scale: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-body text-xs text-warm-gray block mb-2">Position X</label>
              <input
                type="range"
                min="0"
                max="100"
                value={adjustments.positionX}
                onChange={(e) => setAdjustments({ ...adjustments, positionX: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="font-body text-xs text-warm-gray block mb-2">Position Y</label>
              <input
                type="range"
                min="0"
                max="100"
                value={adjustments.positionY}
                onChange={(e) => setAdjustments({ ...adjustments, positionY: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Privacy Note */}
      <div className="p-4 border-t border-sand bg-sand/20">
        <p className="font-body text-xs text-warm-gray text-center">
          <Check className="w-3 h-3 inline mr-1" />
          Your camera feed is processed locally and never stored or shared
        </p>
      </div>
    </div>
  )
}

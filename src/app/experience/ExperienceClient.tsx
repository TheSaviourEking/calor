'use client'

import { useState, useEffect } from 'react'
import ClientWrapper from '@/components/layout/ClientWrapper'
import { 
  Box, Shuffle, Camera, BookOpen, ChevronRight, Sparkles,
  RotateCcw, ZoomIn, Move, Star, ArrowRight, Palette, 
  Hand, Ruler, Image, Settings, Loader2, Heart
} from 'lucide-react'
import Link from 'next/link'
import ProductViewer3D from '@/components/experience/ProductViewer3D'
import ProductComparison from '@/components/experience/ProductComparison'
import VirtualTryOn from '@/components/experience/VirtualTryOn'
import InteractiveGuide from '@/components/experience/InteractiveGuide'
import ProductConfigurator from '@/components/experience/ProductConfigurator'
import SensoryPreview from '@/components/experience/SensoryPreview'
import SizeVisualizer from '@/components/experience/SizeVisualizer'
import ExperienceGallery from '@/components/experience/ExperienceGallery'

const features = [
  {
    id: '3d-viewer',
    title: '3D Product Viewer',
    description: 'Explore products in stunning 3D detail. Rotate, zoom, and interact with every angle before you buy.',
    icon: Box,
    color: 'bg-terracotta/10 text-terracotta',
    features: ['360° rotation', 'Interactive hotspots', 'Zoom controls', 'Mobile friendly'],
  },
  {
    id: 'comparison',
    title: 'Product Comparison',
    description: 'Compare up to 4 products side by side. Make informed decisions with detailed feature breakdowns.',
    icon: Shuffle,
    color: 'bg-purple-50 text-purple-600',
    features: ['Side-by-side view', 'Feature highlights', 'Best value indicator', 'Save comparisons'],
  },
  {
    id: 'try-on',
    title: 'Virtual Try-On',
    description: 'See how products look on you with augmented reality. Try before you buy from the comfort of home.',
    icon: Camera,
    color: 'bg-pink-50 text-pink-600',
    features: ['AR camera', 'Real-time overlay', 'Capture & share', 'Privacy-first'],
  },
  {
    id: 'guide',
    title: 'Interactive Guides',
    description: 'Step-by-step tutorials with timers and tips. Get the most out of your products with expert guidance.',
    icon: BookOpen,
    color: 'bg-amber-50 text-amber-600',
    features: ['Step-by-step tutorials', 'Built-in timers', 'Expert tips', 'Safety warnings'],
  },
  {
    id: 'configurator',
    title: 'Product Configurator',
    description: 'Customize your perfect product with real-time previews. Choose colors, sizes, and accessories.',
    icon: Palette,
    color: 'bg-blue-50 text-blue-600',
    features: ['Live customization', 'Color options', 'Size selection', 'Price updates'],
  },
  {
    id: 'sensory',
    title: 'Sensory Preview',
    description: 'Understand how products feel before you buy. Explore texture, vibration profiles, and more.',
    icon: Hand,
    color: 'bg-rose-50 text-rose-600',
    features: ['Texture profiles', 'Vibration data', 'Weight feel', 'Material info'],
  },
  {
    id: 'size',
    title: 'Size Visualizer',
    description: 'Compare product sizes with everyday objects. Never be surprised by dimensions again.',
    icon: Ruler,
    color: 'bg-teal-50 text-teal-600',
    features: ['Visual comparisons', 'Dimension display', 'Unit conversion', 'Real-world context'],
  },
  {
    id: 'gallery',
    title: 'Experience Gallery',
    description: 'Discover real stories and experiences from our community. Share your own journey.',
    icon: Image,
    color: 'bg-indigo-50 text-indigo-600',
    features: ['Community stories', 'Photo sharing', 'Tips & tricks', 'Verified purchases'],
  },
]

const sampleProducts = [
  { id: 'demo-1', name: 'Luna Wellness Massager', category: 'vibrators', price: 8900 },
  { id: 'demo-2', name: 'Couples Collection Set', category: 'couples', price: 12900 },
  { id: 'demo-3', name: 'Sensation Ring', category: 'accessories', price: 3500 },
]

export default function ExperienceClient() {
  const [activeFeature, setActiveFeature] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState(sampleProducts[0])
  const [isLoading, setIsLoading] = useState(false)

  const renderActiveFeature = () => {
    switch (activeFeature) {
      case '3d-viewer':
        return (
          <div className="max-w-lg mx-auto">
            <div className="mb-4">
              <button
                onClick={() => setActiveFeature(null)}
                className="font-body text-sm text-warm-gray hover:text-terracotta flex items-center gap-1"
              >
                ← Back to overview
              </button>
            </div>
            <ProductViewer3D product={{ id: selectedProduct.id, name: selectedProduct.name, images: [] }} />
          </div>
        )
      case 'comparison':
        return (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setActiveFeature(null)}
                className="font-body text-sm text-warm-gray hover:text-terracotta flex items-center gap-1"
              >
                ← Back to overview
              </button>
            </div>
            <ProductComparison />
          </div>
        )
      case 'try-on':
        return (
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <button
                onClick={() => setActiveFeature(null)}
                className="font-body text-sm text-warm-gray hover:text-terracotta flex items-center gap-1"
              >
                ← Back to overview
              </button>
            </div>
            <VirtualTryOn product={{ id: selectedProduct.id, name: selectedProduct.name, category: selectedProduct.category, images: [] }} />
          </div>
        )
      case 'guide':
        return (
          <div className="max-w-lg mx-auto">
            <div className="mb-4">
              <button
                onClick={() => setActiveFeature(null)}
                className="font-body text-sm text-warm-gray hover:text-terracotta flex items-center gap-1"
              >
                ← Back to overview
              </button>
            </div>
            <InteractiveGuide product={{ id: selectedProduct.id, name: selectedProduct.name, category: selectedProduct.category }} />
          </div>
        )
      case 'configurator':
        return (
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <button
                onClick={() => setActiveFeature(null)}
                className="font-body text-sm text-warm-gray hover:text-terracotta flex items-center gap-1"
              >
                ← Back to overview
              </button>
            </div>
            <ProductConfigurator 
              productId={selectedProduct.id}
              productName={selectedProduct.name}
              basePrice={selectedProduct.price}
            />
          </div>
        )
      case 'sensory':
        return (
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <button
                onClick={() => setActiveFeature(null)}
                className="font-body text-sm text-warm-gray hover:text-terracotta flex items-center gap-1"
              >
                ← Back to overview
              </button>
            </div>
            <SensoryPreview 
              productId={selectedProduct.id}
              productName={selectedProduct.name}
            />
          </div>
        )
      case 'size':
        return (
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <button
                onClick={() => setActiveFeature(null)}
                className="font-body text-sm text-warm-gray hover:text-terracotta flex items-center gap-1"
              >
                ← Back to overview
              </button>
            </div>
            <SizeVisualizer 
              productId={selectedProduct.id}
              productName={selectedProduct.name}
            />
          </div>
        )
      case 'gallery':
        return (
          <div className="max-w-lg mx-auto">
            <div className="mb-4">
              <button
                onClick={() => setActiveFeature(null)}
                className="font-body text-sm text-warm-gray hover:text-terracotta flex items-center gap-1"
              >
                ← Back to overview
              </button>
            </div>
            <ExperienceGallery limit={6} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20 bg-cream">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-sand/50 via-cream to-terracotta/5 py-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta/10 text-terracotta font-body text-sm uppercase tracking-wider mb-6">
                <Sparkles className="w-4 h-4" />
                Interactive Shopping Experience
              </div>
              
              <h1 
                className="font-display text-charcoal mb-4"
                style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 300 }}
              >
                Product Experience Hub
              </h1>
              
              <p className="font-body text-warm-gray text-lg leading-relaxed mb-8">
                Explore products like never before with our suite of interactive tools. 
                From 3D viewing to virtual try-on, make confident purchase decisions 
                with immersive shopping experiences.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => setActiveFeature('3d-viewer')}
                  className="px-6 py-3 bg-terracotta text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta/90"
                >
                  Start Exploring
                </button>
                <Link
                  href="/shop"
                  className="px-6 py-3 border border-charcoal text-charcoal font-body text-sm uppercase tracking-wider hover:bg-charcoal hover:text-cream"
                >
                  Browse Products
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          {activeFeature ? (
            renderActiveFeature()
          ) : (
            <>
              {/* Feature Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
                {features.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => setActiveFeature(feature.id)}
                    className="bg-warm-white border border-sand p-4 text-left hover:border-terracotta transition-colors group"
                  >
                    <div className={`w-10 h-10 flex items-center justify-center ${feature.color} mb-3`}>
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-display text-charcoal text-sm mb-1 group-hover:text-terracotta transition-colors" style={{ fontWeight: 400 }}>
                      {feature.title}
                    </h3>
                    <p className="font-body text-warm-gray text-xs leading-relaxed line-clamp-2">
                      {feature.description}
                    </p>
                  </button>
                ))}
              </div>

              {/* Live Demos Section */}
              <div className="mb-16">
                <h2 
                  className="font-display text-charcoal text-2xl mb-8 text-center"
                  style={{ fontWeight: 300 }}
                >
                  Live Demos
                </h2>
                
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* 3D Preview */}
                  <div>
                    <h3 className="font-body text-charcoal text-sm uppercase tracking-wider mb-4">
                      3D Product Preview
                    </h3>
                    <ProductViewer3D product={{ id: selectedProduct.id, name: selectedProduct.name, images: [] }} />
                  </div>
                  
                  {/* Comparison Preview */}
                  <div>
                    <h3 className="font-body text-charcoal text-sm uppercase tracking-wider mb-4">
                      Quick Comparison
                    </h3>
                    <ProductComparison />
                  </div>
                </div>
              </div>

              {/* Sensory & Size Section */}
              <div className="mb-16">
                <h2 
                  className="font-display text-charcoal text-2xl mb-8 text-center"
                  style={{ fontWeight: 300 }}
                >
                  Product Insights
                </h2>
                
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Sensory Preview */}
                  <div>
                    <h3 className="font-body text-charcoal text-sm uppercase tracking-wider mb-4">
                      Sensory Profile
                    </h3>
                    <SensoryPreview 
                      productId={selectedProduct.id}
                      productName={selectedProduct.name}
                    />
                  </div>
                  
                  {/* Size Visualizer */}
                  <div>
                    <h3 className="font-body text-charcoal text-sm uppercase tracking-wider mb-4">
                      Size Comparison
                    </h3>
                    <SizeVisualizer 
                      productId={selectedProduct.id}
                      productName={selectedProduct.name}
                    />
                  </div>
                </div>
              </div>

              {/* Experience Gallery */}
              <div className="mb-16">
                <h2 
                  className="font-display text-charcoal text-2xl mb-8 text-center"
                  style={{ fontWeight: 300 }}
                >
                  Community Experiences
                </h2>
                <ExperienceGallery limit={6} />
              </div>

              {/* How It Works */}
              <div className="bg-warm-white border border-sand p-8">
                <h2 
                  className="font-display text-charcoal text-2xl mb-8 text-center"
                  style={{ fontWeight: 300 }}
                >
                  How It Works
                </h2>
                
                <div className="grid md:grid-cols-4 gap-8">
                  {[
                    { step: 1, title: 'Browse', description: 'Explore our product catalog', icon: Star },
                    { step: 2, title: 'Interact', description: 'View in 3D, compare, or try-on', icon: RotateCcw },
                    { step: 3, title: 'Learn', description: 'Follow interactive guides', icon: BookOpen },
                    { step: 4, title: 'Decide', description: 'Make confident purchases', icon: Sparkles },
                  ].map((item) => (
                    <div key={item.step} className="text-center">
                      <div className="w-12 h-12 bg-terracotta/10 text-terracotta flex items-center justify-center mx-auto mb-4">
                        <item.icon className="w-6 h-6" />
                      </div>
                      <div className="font-body text-xs text-terracotta uppercase tracking-wider mb-2">
                        Step {item.step}
                      </div>
                      <h3 className="font-display text-charcoal mb-2" style={{ fontWeight: 400 }}>
                        {item.title}
                      </h3>
                      <p className="font-body text-warm-gray text-sm">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Selection for Demo */}
              <div className="mt-12 p-6 bg-sand/30 border border-sand">
                <h3 className="font-body text-charcoal text-sm uppercase tracking-wider mb-4">
                  Select a Demo Product
                </h3>
                <div className="flex flex-wrap gap-4">
                  {sampleProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className={`flex-1 min-w-[200px] p-4 border transition-colors ${
                        selectedProduct.id === product.id
                          ? 'border-terracotta bg-terracotta/10'
                          : 'border-sand bg-warm-white hover:border-terracotta'
                      }`}
                    >
                      <p className="font-body text-charcoal text-sm">{product.name}</p>
                      <p className="font-body text-warm-gray text-xs capitalize">{product.category}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* CTA Section */}
        {!activeFeature && (
          <div className="bg-charcoal py-16">
            <div className="max-w-3xl mx-auto px-6 text-center">
              <h2 
                className="font-display text-cream mb-4"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 400 }}
              >
                Ready to Experience More?
              </h2>
              <p className="font-body text-cream/70 mb-8">
                Browse our collection and try these features on real products. 
                Discover a new way to shop online.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-8 py-4 bg-terracotta text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta/90"
              >
                Shop Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </ClientWrapper>
  )
}

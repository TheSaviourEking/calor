'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Check, Clock, Lightbulb, AlertTriangle, Sparkles } from 'lucide-react'

interface GuideStep {
  id: string
  title: string
  description: string
  duration?: number
  tips?: string[]
  warnings?: string[]
  animation?: string
  image?: string
}

interface InteractiveGuideProps {
  product?: {
    id: string
    name: string
    category: string
    usageGuide?: string | null
  }
}

// Sample guides based on product category
const categoryGuides: Record<string, GuideStep[]> = {
  vibrators: [
    {
      id: '1',
      title: 'Preparation',
      description: 'Start by ensuring your product is fully charged. Connect the included USB-C cable and charge for 2 hours before first use.',
      duration: 120,
      tips: ['Charge indicator will turn off when fully charged', 'Recommended to clean before first use'],
      warnings: ['Only use included charging cable'],
    },
    {
      id: '2',
      title: 'Cleaning',
      description: 'Clean your product with warm water and mild soap, or use a specialized toy cleaner. Rinse thoroughly and pat dry.',
      duration: 60,
      tips: ['Clean before and after each use', 'Let air dry completely before storing'],
    },
    {
      id: '3',
      title: 'Lubricant Selection',
      description: 'Apply water-based lubricant for enhanced comfort. Avoid silicone-based lubricants as they can damage the material.',
      duration: 30,
      warnings: ['Never use silicone lubricant with silicone products'],
      tips: ['Start with a small amount and add more as needed'],
    },
    {
      id: '4',
      title: 'Getting Started',
      description: 'Press and hold the power button for 2 seconds to turn on. Start on the lowest setting to familiarize yourself with the intensity levels.',
      duration: 60,
      tips: ['Most products have multiple intensity levels', 'Experiment with different patterns'],
    },
    {
      id: '5',
      title: 'Exploration',
      description: 'Take your time exploring different sensations. Try different patterns and intensity levels to find what works best for you.',
      duration: 180,
      tips: ['Listen to your body', 'There\'s no right or wrong way to enjoy your product'],
    },
    {
      id: '6',
      title: 'After Care',
      description: 'After use, clean your product thoroughly and store in a cool, dry place away from direct sunlight and other products.',
      duration: 90,
      tips: ['Consider using a storage bag', 'Recharge if battery is low'],
    },
  ],
  masturbators: [
    {
      id: '1',
      title: 'Preparation',
      description: 'Ensure the product is clean and dry. Apply a generous amount of water-based lubricant to both yourself and the product opening.',
      duration: 60,
      tips: ['Warm the product slightly for a more natural feel', 'More lubricant = better experience'],
    },
    {
      id: '2',
      title: 'Usage',
      description: 'Insert gently and move at your own pace. Experiment with different speeds and pressure levels.',
      duration: 180,
      tips: ['Vary your technique for different sensations', 'Take breaks if needed'],
    },
    {
      id: '3',
      title: 'Cleaning',
      description: 'After use, clean thoroughly with warm water and toy cleaner. Pay special attention to textured areas.',
      duration: 120,
      warnings: ['Dry completely before storing to prevent mold'],
      tips: ['Use a drying stick for hard-to-reach areas'],
    },
  ],
  default: [
    {
      id: '1',
      title: 'Getting Started',
      description: 'Unbox your product and familiarize yourself with all components. Read through any included instructions.',
      duration: 120,
      tips: ['Keep packaging for storage'],
    },
    {
      id: '2',
      title: 'Cleaning',
      description: 'Clean your product before first use with appropriate cleaner or warm water and mild soap.',
      duration: 60,
    },
    {
      id: '3',
      title: 'Usage',
      description: 'Follow the included instructions for your specific product. Start slow and increase intensity as desired.',
      duration: 180,
      tips: ['Experiment to find what feels best for you'],
    },
    {
      id: '4',
      title: 'After Care',
      description: 'Clean after each use and store properly. Keep away from extreme temperatures and direct sunlight.',
      duration: 60,
    },
  ],
}

export default function InteractiveGuide({ product }: InteractiveGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [showTips, setShowTips] = useState(true)
  
  // Get guide steps based on product category
  const steps = product?.category 
    ? (categoryGuides[product.category.toLowerCase()] || categoryGuides.default)
    : categoryGuides.default
  
  const step = steps[currentStep]
  
  // Initialize timeRemaining when step changes or duration exists
  const initialTimeRemaining = step.duration || 0
  
  // Timer for step duration
  useEffect(() => {
    if (!isPlaying || !step.duration) return
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-advance to next step
          if (currentStep < steps.length - 1) {
            setCompletedSteps(prevSet => new Set([...prevSet, step.id]))
            setCurrentStep(prev => prev + 1)
          } else {
            setIsPlaying(false)
            setCompletedSteps(prevSet => new Set([...prevSet, step.id]))
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isPlaying, currentStep, step.id, steps.length])
  
  // Reset timer when step changes (using separate effect for initialization)
  useEffect(() => {
    setTimeRemaining(initialTimeRemaining)
  }, [initialTimeRemaining])
  
  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, step.id]))
      setCurrentStep(prev => prev + 1)
    }
  }
  
  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }
  
  const handleReset = () => {
    setCurrentStep(0)
    setIsPlaying(false)
    setCompletedSteps(new Set())
    if (step.duration) {
      setTimeRemaining(step.duration)
    }
  }
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="bg-warm-white border border-sand">
      {/* Header */}
      <div className="p-4 border-b border-sand">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display text-charcoal" style={{ fontWeight: 400 }}>
              Interactive Guide
            </h3>
            <p className="font-body text-warm-gray text-xs">
              Step-by-step instructions for {product?.name || 'your product'}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="p-2 border border-sand hover:border-terracotta transition-colors"
            title="Restart guide"
          >
            <RotateCcw className="w-4 h-4 text-warm-gray" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="relative">
          <div className="h-1 bg-sand">
            <div 
              className="h-full bg-terracotta transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(idx)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-colors ${
                  idx === currentStep
                    ? 'border-terracotta bg-terracotta text-cream'
                    : completedSteps.has(s.id)
                    ? 'border-green-500 bg-green-500 text-cream'
                    : 'border-sand bg-cream text-warm-gray'
                }`}
              >
                {completedSteps.has(s.id) ? (
                  <Check className="w-3 h-3" />
                ) : (
                  idx + 1
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        {/* Step Title & Timer */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-xs font-body text-terracotta uppercase tracking-wider">
              Step {currentStep + 1} of {steps.length}
            </span>
            <h4 className="font-display text-charcoal text-xl mt-1" style={{ fontWeight: 400 }}>
              {step.title}
            </h4>
          </div>
          {step.duration && (
            <div className="text-right">
              <div className="flex items-center gap-2 text-terracotta">
                <Clock className="w-4 h-4" />
                <span className="font-display text-2xl" style={{ fontWeight: 300 }}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="mt-2 px-3 py-1 bg-terracotta text-cream font-body text-xs uppercase tracking-wider hover:bg-terracotta/90"
              >
                {isPlaying ? 'Pause' : 'Start'} Timer
              </button>
            </div>
          )}
        </div>
        
        {/* Description */}
        <p className="font-body text-warm-gray leading-relaxed mb-6">
          {step.description}
        </p>
        
        {/* Visual Area */}
        <div className="aspect-video bg-gradient-to-br from-sand/50 to-cream mb-6 flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="w-12 h-12 text-terracotta/30 mx-auto mb-2" />
            <p className="font-body text-warm-gray text-sm">Interactive demonstration</p>
          </div>
        </div>
        
        {/* Tips */}
        {showTips && step.tips && step.tips.length > 0 && (
          <div className="mb-4 p-4 bg-sand/30 border-l-2 border-terracotta">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-terracotta" />
              <span className="font-body text-charcoal text-sm">Tips</span>
            </div>
            <ul className="space-y-1">
              {step.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-terracotta mt-1 flex-shrink-0" />
                  <span className="font-body text-warm-gray text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Warnings */}
        {step.warnings && step.warnings.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border-l-2 border-red-500">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="font-body text-charcoal text-sm">Important</span>
            </div>
            <ul className="space-y-1">
              {step.warnings.map((warning, idx) => (
                <li key={idx} className="font-body text-red-700 text-sm">
                  • {warning}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="p-4 border-t border-sand flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-4 py-2 border border-sand hover:border-terracotta disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="font-body text-sm">Previous</span>
        </button>
        
        <button
          onClick={() => setShowTips(!showTips)}
          className="font-body text-xs text-warm-gray hover:text-terracotta"
        >
          {showTips ? 'Hide Tips' : 'Show Tips'}
        </button>
        
        {currentStep === steps.length - 1 ? (
          <button
            onClick={() => {
              setCompletedSteps(prev => new Set([...prev, step.id]))
              // Could trigger completion celebration
            }}
            className="flex items-center gap-2 px-4 py-2 bg-terracotta text-cream font-body text-sm hover:bg-terracotta/90"
          >
            <Check className="w-4 h-4" />
            Complete
          </button>
        ) : (
          <button
            onClick={goNext}
            className="flex items-center gap-2 px-4 py-2 bg-charcoal text-cream font-body text-sm hover:bg-charcoal/90"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

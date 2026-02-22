'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useQuizStore, QuizQuestion } from '@/stores/quiz'
import { useCartStore } from '@/stores'
import { 
  ArrowLeft, ArrowRight, RotateCcw, Sparkles, Heart, 
  Check, Star, ShoppingCart, Loader2, ShoppingBag, Package
} from 'lucide-react'
import { toast } from 'sonner'

export default function QuizClient() {
  const router = useRouter()
  const {
    sessionId,
    setSessionId,
    questions,
    setQuestions,
    currentStep,
    answers,
    setAnswer,
    nextStep,
    prevStep,
    isComplete,
    setComplete,
    recommendations,
    profile,
    isLoading,
    setLoading,
    reset
  } = useQuizStore()

  const addToCart = useCartStore(s => s.addItem)
  const openCart = useCartStore(s => s.openCart)
  const [loadingQuestions, setLoadingQuestions] = useState(true)
  const [recommendationProducts, setRecommendationProducts] = useState<any[]>([])
  const [addingAllToCart, setAddingAllToCart] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  // Generate session ID on mount
  useEffect(() => {
    if (!sessionId) {
      setSessionId(`quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
    }
  }, [sessionId, setSessionId])

  // Fetch questions
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch('/api/quiz/questions')
        const data = await res.json()
        if (data.questions) {
          setQuestions(data.questions.map((q: any) => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
          })))
        }
      } catch (error) {
        console.error('Failed to fetch questions:', error)
      } finally {
        setLoadingQuestions(false)
      }
    }
    fetchQuestions()
  }, [setQuestions])

  // Submit quiz when complete
  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, answers })
      })
      const data = await res.json()
      if (data.success) {
        setComplete(data.recommendations, data.profile)
        setRecommendationProducts(data.recommendations)
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error)
    } finally {
      setLoading(false)
    }
  }

  // Add all recommended products to cart
  const handleAddAllToCart = async () => {
    if (recommendationProducts.length === 0) return
    
    setAddingAllToCart(true)
    try {
      const productIds = recommendationProducts.map(p => p.id)
      
      // Add each product to cart
      for (const product of recommendationProducts) {
        if (product.variants?.[0]) {
          addToCart({
            id: `${product.id}-${product.variants[0].id}`,
            productId: product.id,
            variantId: product.variants[0].id,
            name: product.name,
            category: product.category?.name || 'Product',
            price: product.variants[0].price,
            quantity: 1,
            image: product.images?.[0]?.url
          })
        }
      }

      // Track conversion
      await fetch('/api/quiz/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, productIds })
      })

      setAddedToCart(true)
      toast.success(`${recommendationProducts.length} items added to your bag!`)
      openCart()
    } catch (error) {
      console.error('Failed to add to cart:', error)
      toast.error('Failed to add items to cart')
    } finally {
      setAddingAllToCart(false)
    }
  }

  const getCurrentAnswer = (questionId: string): string | string[] => {
    const answer = answers.find(a => a.questionId === questionId)
    return answer?.answer || (questions.find(q => q.id === questionId)?.type === 'multiple' ? [] : '')
  }

  const handleSingleSelect = (questionId: string, value: string) => {
    setAnswer(questionId, value)
  }

  const handleMultiSelect = (questionId: string, value: string, checked: boolean) => {
    const current = getCurrentAnswer(questionId) as string[]
    if (checked) {
      setAnswer(questionId, [...current, value])
    } else {
      setAnswer(questionId, current.filter(v => v !== value))
    }
  }

  const canProceed = () => {
    const currentQuestion = questions[currentStep]
    if (!currentQuestion) return false
    const answer = getCurrentAnswer(currentQuestion.id)
    if (Array.isArray(answer)) {
      return answer.length > 0
    }
    return answer !== ''
  }

  const progress = questions.length > 0 ? ((currentStep + 1) / questions.length) * 100 : 0

  // Calculate total value
  const totalValue = recommendationProducts.reduce((sum, p) => {
    return sum + (p.variants?.[0]?.price || 0)
  }, 0)

  if (loadingQuestions) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-cream">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-terracotta" />
          <p className="font-body text-warm-gray">Preparing your personalized experience...</p>
        </div>
      </div>
    )
  }

  if (isComplete && recommendationProducts.length > 0) {
    return (
      <div className="min-h-screen pt-20 bg-cream">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="eyebrow mb-6">Personalized for You</span>
            <h1 
              className="font-display text-charcoal mb-4"
              style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)', fontWeight: 300 }}
            >
              Your Perfect Matches
            </h1>
            <p className="font-body text-warm-gray max-w-2xl mx-auto">
              Based on your unique preferences and goals, we've curated these recommendations just for you.
            </p>
          </div>

          {/* Add All to Cart Banner */}
          <div className="bg-warm-white border border-sand p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-terracotta/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-terracotta" />
              </div>
              <div>
                <h3 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                  Add All {recommendationProducts.length} Items
                </h3>
                <p className="font-body text-warm-gray text-sm">
                  Total value: <span className="text-charcoal">${(totalValue / 100).toFixed(2)}</span>
                </p>
              </div>
            </div>
            {addedToCart ? (
              <div className="flex items-center gap-2 text-terracotta">
                <Check className="w-5 h-5" />
                <span className="font-body">Added to bag!</span>
              </div>
            ) : (
              <button
                onClick={handleAddAllToCart}
                disabled={addingAllToCart}
                className="bg-charcoal text-cream px-8 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {addingAllToCart ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    Add All to Bag
                  </>
                )}
              </button>
            )}
          </div>

          {/* Recommendations Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {recommendationProducts.map((product, index) => (
              <div key={product.id} className="bg-warm-white border border-sand group">
                <div className="relative aspect-square bg-sand/30">
                  {product.images?.[0]?.url ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Heart className="h-12 w-12 text-warm-gray/30" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-warm-white text-xs font-body">
                      <Star className="h-3 w-3 text-terracotta" />
                      {Math.round(product.recommendation?.score || 85)}% Match
                    </span>
                    <span className="px-2 py-1 bg-charcoal text-cream text-xs font-body">
                      #{index + 1}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <Link href={`/product/${product.slug}`} className="block">
                    <h3 className="font-display text-charcoal text-lg mb-1 hover:text-terracotta transition-colors" style={{ fontWeight: 400 }}>
                      {product.name}
                    </h3>
                  </Link>
                  <p className="font-body text-warm-gray text-sm mb-3 line-clamp-2">
                    {product.shortDescription}
                  </p>
                  <div className="space-y-1 mb-3">
                    {product.recommendation?.reasons?.slice(0, 2).map((reason: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 font-body text-warm-gray text-xs">
                        <Check className="h-3 w-3 text-terracotta" />
                        {reason}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body text-charcoal">
                      ${((product.variants?.[0]?.price || 0) / 100).toFixed(2)}
                    </span>
                    <button 
                      onClick={() => {
                        if (product.variants?.[0]) {
                          addToCart({
                            id: `${product.id}-${product.variants[0].id}`,
                            productId: product.id,
                            variantId: product.variants[0].id,
                            name: product.name,
                            category: product.category?.name || 'Product',
                            price: product.variants[0].price,
                            quantity: 1,
                            image: product.images?.[0]?.url
                          })
                          toast.success('Added to bag')
                          openCart()
                        }
                      }}
                      className="px-4 py-2 bg-charcoal text-cream font-body text-xs uppercase tracking-wider hover:bg-terracotta transition-colors flex items-center gap-1"
                    >
                      <ShoppingCart className="h-3 w-3" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => {
                reset()
                setRecommendationProducts([])
                setAddedToCart(false)
              }}
              className="border border-charcoal text-charcoal px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-charcoal hover:text-cream transition-colors flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Retake Quiz
            </button>
            <button 
              onClick={() => router.push('/shop')}
              className="bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
            >
              Browse All Products
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentStep]

  return (
    <div className="min-h-screen pt-20 bg-cream">
      {/* Progress Bar */}
      <div className="fixed top-16 left-0 right-0 h-1 bg-sand z-40">
        <div 
          className="h-full bg-terracotta transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-16">
        {/* Back Button */}
        {currentStep > 0 && (
          <button
            onClick={prevStep}
            className="flex items-center gap-2 font-body text-warm-gray hover:text-terracotta mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}

        {/* Question */}
        {currentQuestion && (
          <div className="space-y-8">
            {/* Category Label */}
            <span className="eyebrow">
              {currentQuestion.category}
            </span>

            {/* Question Text */}
            <h2 
              className="font-display text-charcoal"
              style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 300 }}
            >
              {currentQuestion.question}
            </h2>

            {currentQuestion.description && (
              <p className="font-body text-warm-gray">
                {currentQuestion.description}
              </p>
            )}

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.type === 'single' ? (
                currentQuestion.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSingleSelect(currentQuestion.id, option.value)}
                    className={`w-full p-4 text-left border transition-all font-body text-sm ${
                      getCurrentAnswer(currentQuestion.id) === option.value
                        ? 'border-terracotta bg-terracotta/5 text-charcoal'
                        : 'border-sand hover:border-terracotta/50 text-charcoal'
                    }`}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                currentQuestion.options.map((option) => {
                  const currentAnswer = getCurrentAnswer(currentQuestion.id) as string[]
                  const isChecked = Array.isArray(currentAnswer) && currentAnswer.includes(option.value)
                  
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-4 border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-terracotta bg-terracotta/5'
                          : 'border-sand hover:border-terracotta/50'
                      }`}
                    >
                      <div className={`w-4 h-4 border flex items-center justify-center ${isChecked ? 'border-terracotta bg-terracotta' : 'border-sand'}`}>
                        {isChecked && <Check className="h-3 w-3 text-cream" />}
                      </div>
                      <span className="font-body text-sm text-charcoal">{option.label}</span>
                    </label>
                  )
                })
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-8 border-t border-sand">
              <span className="font-body text-warm-gray text-sm">
                {currentStep + 1} of {questions.length}
              </span>
              <button
                onClick={() => {
                  if (currentStep === questions.length - 1) {
                    handleSubmit()
                  } else {
                    nextStep()
                  }
                }}
                disabled={!canProceed() || isLoading}
                className="bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : currentStep === questions.length - 1 ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Get Recommendations
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!currentQuestion && !loadingQuestions && (
          <div className="text-center py-16">
            <h2 className="font-display text-charcoal text-2xl mb-4" style={{ fontWeight: 300 }}>Quiz Unavailable</h2>
            <p className="font-body text-warm-gray mb-6">
              We're preparing our quiz. Please check back soon.
            </p>
            <button 
              onClick={() => router.push('/shop')}
              className="bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
            >
              Browse Products
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

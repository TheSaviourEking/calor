'use client'

import { useState, useEffect } from 'react'
import {
  Image as ImageIcon, Video, MessageCircle, Heart, Eye, Clock,
  ChevronLeft, ChevronRight, Loader2, Plus, X, Star
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Experience {
  id: string
  productId: string
  product: {
    id: string
    name: string
    slug: string
    images: Array<{ url: string; altText: string }>
  }
  customerName: string
  title: string
  content: string
  experienceType: string
  images: string[]
  videoUrl: string | null
  rating: number | null
  enjoymentRating: number | null
  tags: string[]
  viewsCount: number
  likesCount: number
  commentsCount: number
  isFeatured: boolean
  createdAt: string
}

interface ExperienceGalleryProps {
  productId?: string
  limit?: number
  showCreate?: boolean
}

const experienceTypeLabels: Record<string, { label: string; color: string }> = {
  story: { label: 'Story', color: 'bg-purple-100 text-purple-700' },
  tip: { label: 'Tip', color: 'bg-green-100 text-green-700' },
  unboxing: { label: 'Unboxing', color: 'bg-blue-100 text-blue-700' },
  review: { label: 'Review', color: 'bg-amber-100 text-amber-700' },
}

export default function ExperienceGallery({
  productId,
  limit = 6,
  showCreate = true
}: ExperienceGalleryProps) {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const params = new URLSearchParams()
        if (productId) params.set('productId', productId)
        params.set('limit', limit.toString())

        const res = await fetch(`/api/experience/experiences?${params}`)
        if (res.ok) {
          const data = await res.json()
          setExperiences(data.experiences)
        }
      } catch (error) {
        console.error('Error fetching experiences:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchExperiences()
  }, [productId, limit])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handlePrev = () => {
    if (selectedExperience) {
      const idx = experiences.findIndex(e => e.id === selectedExperience.id)
      if (idx > 0) {
        setSelectedExperience(experiences[idx - 1])
        setCurrentIndex(idx - 1)
      }
    }
  }

  const handleNext = () => {
    if (selectedExperience) {
      const idx = experiences.findIndex(e => e.id === selectedExperience.id)
      if (idx < experiences.length - 1) {
        setSelectedExperience(experiences[idx + 1])
        setCurrentIndex(idx + 1)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="bg-warm-white border border-sand p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-terracotta animate-spin" />
      </div>
    )
  }

  if (experiences.length === 0) {
    return (
      <div className="bg-warm-white border border-sand p-8 text-center">
        <ImageIcon className="w-12 h-12 text-warm-gray mx-auto mb-4" />
        <p className="font-body text-warm-gray mb-4">No experiences shared yet</p>
        {showCreate && (
          <button className="px-4 py-2 bg-terracotta text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta/90">
            Share Your Experience
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-warm-white border border-sand">
      {/* Header */}
      <div className="p-4 border-b border-sand flex items-center justify-between">
        <div>
          <h3 className="font-display text-charcoal" style={{ fontWeight: 400 }}>
            Experience Gallery
          </h3>
          <p className="font-body text-warm-gray text-xs mt-1">
            Real stories from our community
          </p>
        </div>
        {showCreate && (
          <button className="flex items-center gap-1 px-3 py-1.5 bg-terracotta text-cream font-body text-xs uppercase tracking-wider hover:bg-terracotta/90">
            <Plus className="w-3 h-3" />
            Share
          </button>
        )}
      </div>

      {/* Featured Experience */}
      {experiences.filter(e => e.isFeatured)[0] && (
        <div
          className="relative p-4 bg-gradient-to-br from-terracotta/5 to-sand/30 border-b border-sand cursor-pointer"
          onClick={() => {
            setSelectedExperience(experiences.filter(e => e.isFeatured)[0])
            setCurrentIndex(experiences.findIndex(e => e.isFeatured))
          }}
        >
          <div className="absolute top-4 left-4 px-2 py-1 bg-terracotta text-cream font-body text-xs uppercase tracking-wider">
            Featured
          </div>
          <div className="flex gap-4">
            {experiences.filter(e => e.isFeatured)[0].images[0] && (
              <div className="w-32 h-32 flex-shrink-0 bg-sand overflow-hidden">
                <Image
                  src={experiences.filter(e => e.isFeatured)[0].images[0]}
                  alt={`${experiences.filter(e => e.isFeatured)[0].title} - community experience`}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 text-xs font-body ${experienceTypeLabels[experiences.filter(e => e.isFeatured)[0].experienceType]?.color || 'bg-sand text-charcoal'
                  }`}>
                  {experienceTypeLabels[experiences.filter(e => e.isFeatured)[0].experienceType]?.label || 'Story'}
                </span>
                {experiences.filter(e => e.isFeatured)[0].rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-gold text-gold" />
                    <span className="font-body text-xs text-charcoal">
                      {experiences.filter(e => e.isFeatured)[0].rating}
                    </span>
                  </div>
                )}
              </div>
              <h4 className="font-display text-charcoal mb-1" style={{ fontWeight: 400 }}>
                {experiences.filter(e => e.isFeatured)[0].title}
              </h4>
              <p className="font-body text-warm-gray text-sm line-clamp-2">
                {experiences.filter(e => e.isFeatured)[0].content}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span className="font-body text-xs text-warm-gray">
                  by {experiences.filter(e => e.isFeatured)[0].customerName}
                </span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-body text-xs text-warm-gray">
                    <Eye className="w-3 h-3" />
                    {experiences.filter(e => e.isFeatured)[0].viewsCount}
                  </span>
                  <span className="flex items-center gap-1 font-body text-xs text-warm-gray">
                    <Heart className="w-3 h-3" />
                    {experiences.filter(e => e.isFeatured)[0].likesCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Experience Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-1 p-1">
        {experiences.filter(e => !e.isFeatured).slice(0, 5).map((exp) => (
          <button
            key={exp.id}
            onClick={() => {
              setSelectedExperience(exp)
              setCurrentIndex(experiences.findIndex(e => e.id === exp.id))
            }}
            className="relative aspect-square bg-sand overflow-hidden group"
          >
            {exp.images[0] ? (
              <Image
                src={exp.images[0]}
                alt={exp.title}
                width={400}
                height={400}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cream to-sand">
                <span className="font-display text-charcoal/20 text-4xl" style={{ fontWeight: 300 }}>
                  {exp.title.charAt(0)}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/40 transition-colors flex items-center justify-center">
              <span className="font-body text-cream text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                View
              </span>
            </div>
            <div className="absolute bottom-2 left-2 flex items-center gap-2">
              <span className={`px-1.5 py-0.5 text-[10px] font-body ${experienceTypeLabels[exp.experienceType]?.color || 'bg-sand text-charcoal'
                }`}>
                {experienceTypeLabels[exp.experienceType]?.label || 'Story'}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Experience Detail Modal */}
      {selectedExperience && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/90 p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-cream border border-sand">
            {/* Modal Header */}
            <div className="sticky top-0 bg-cream border-b border-sand p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs font-body ${experienceTypeLabels[selectedExperience.experienceType]?.color || 'bg-sand text-charcoal'
                  }`}>
                  {experienceTypeLabels[selectedExperience.experienceType]?.label || 'Story'}
                </span>
                {selectedExperience.rating && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < selectedExperience.rating! ? 'fill-gold text-gold' : 'text-sand'}`}
                       
                      />
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedExperience(null)}
                className="text-warm-gray hover:text-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Images Carousel */}
            {selectedExperience.images.length > 0 && (
              <div className="relative">
                <div className="aspect-video bg-sand">
                  <Image
                    src={selectedExperience.images[0]}
                    alt={selectedExperience.title}
                    width={800}
                    height={450}
                    className="w-full h-full object-cover"
                  />
                </div>
                {selectedExperience.images.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {selectedExperience.images.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-terracotta' : 'bg-cream/50'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-4">
              {/* Author & Product */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-body text-xs text-warm-gray">by</span>
                  <span className="font-body text-charcoal text-sm ml-1">
                    {selectedExperience.customerName}
                  </span>
                </div>
                <Link
                  href={`/product/${selectedExperience.product.slug}`}
                  className="font-body text-xs text-terracotta hover:underline"
                >
                  {selectedExperience.product.name}
                </Link>
              </div>

              {/* Title */}
              <h3 className="font-display text-charcoal text-xl mb-2" style={{ fontWeight: 400 }}>
                {selectedExperience.title}
              </h3>

              {/* Content */}
              <p className="font-body text-warm-gray leading-relaxed mb-4">
                {selectedExperience.content}
              </p>

              {/* Tags */}
              {selectedExperience.tags && selectedExperience.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedExperience.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-sand/50 font-body text-xs text-warm-gray">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 py-4 border-t border-sand">
                <button className="flex items-center gap-1 font-body text-sm text-warm-gray hover:text-terracotta">
                  <Heart className="w-4 h-4" />
                  {selectedExperience.likesCount}
                </button>
                <span className="flex items-center gap-1 font-body text-sm text-warm-gray">
                  <MessageCircle className="w-4 h-4" />
                  {selectedExperience.commentsCount}
                </span>
                <span className="flex items-center gap-1 font-body text-sm text-warm-gray">
                  <Eye className="w-4 h-4" />
                  {selectedExperience.viewsCount}
                </span>
                <span className="flex items-center gap-1 font-body text-sm text-warm-gray ml-auto">
                  <Clock className="w-4 h-4" />
                  {formatDate(selectedExperience.createdAt)}
                </span>
              </div>
            </div>

            {/* Navigation */}
            {experiences.length > 1 && (
              <div className="sticky bottom-0 bg-cream border-t border-sand p-4 flex justify-between">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-1 px-3 py-1.5 border border-sand hover:border-terracotta disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="font-body text-sm text-warm-gray">
                  {currentIndex + 1} of {experiences.length}
                </span>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === experiences.length - 1}
                  className="flex items-center gap-1 px-3 py-1.5 border border-sand hover:border-terracotta disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Calendar, Clock, Video, Phone, MessageSquare, Star, 
  ChevronRight, Loader2, Check, X, User, ArrowLeft
} from 'lucide-react'

interface Consultant {
  id: string
  name: string
  title: string
  bio: string
  avatar: string | null
  credentials: string
  specialities: string
  languages: string
  rating: number
  reviewCount: number
  hourlyRate: number
  availability: { dayOfWeek: number; startTime: string; endTime: string }[]
  _count?: { reviews: number }
}

export default function ConsultationsClient() {
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'select' | 'schedule' | 'confirm'>('select')
  
  // Booking state
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [selectedType, setSelectedType] = useState<'video' | 'phone' | 'chat'>('video')
  const [duration, setDuration] = useState<number>(30)
  const [notes, setNotes] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)

  useEffect(() => {
    fetchConsultants()
  }, [])

  useEffect(() => {
    if (selectedConsultant && selectedDate) {
      fetchAvailableSlots()
    }
  }, [selectedConsultant, selectedDate])

  const fetchConsultants = async () => {
    try {
      const res = await fetch('/api/consultants')
      const data = await res.json()
      if (data.consultants) {
        setConsultants(data.consultants.map((c: any) => ({
          ...c,
          credentials: typeof c.credentials === 'string' ? JSON.parse(c.credentials) : c.credentials,
          specialities: typeof c.specialities === 'string' ? JSON.parse(c.specialities) : c.specialities,
          languages: typeof c.languages === 'string' ? JSON.parse(c.languages) : c.languages
        })))
      }
    } catch (error) {
      console.error('Failed to fetch consultants:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableSlots = async () => {
    if (!selectedConsultant) return
    setLoadingSlots(true)
    try {
      const res = await fetch(`/api/consultations?consultantId=${selectedConsultant.id}&date=${selectedDate}`)
      const data = await res.json()
      setAvailableSlots(data.slots || [])
    } catch (error) {
      console.error('Failed to fetch slots:', error)
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleBooking = async () => {
    if (!selectedConsultant || !selectedDate || !selectedTime) return
    
    setSubmitting(true)
    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`)
      
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultantId: selectedConsultant.id,
          scheduledAt: scheduledAt.toISOString(),
          duration,
          type: selectedType,
          notes
        })
      })
      
      const data = await res.json()
      if (data.success) {
        setBookingComplete(true)
      }
    } catch (error) {
      console.error('Failed to book consultation:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getPrice = () => {
    if (!selectedConsultant) return 0
    return Math.ceil((selectedConsultant.hourlyRate * duration) / 60)
  }

  // Get next 14 days for date selection
  const getAvailableDates = () => {
    const dates: { date: string; dayName: string }[] = []
    for (let i = 1; i <= 14; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      dates.push({
        date: d.toISOString().split('T')[0],
        dayName: format(d, 'EEE, MMM d')
      })
    }
    return dates
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-cream">
        <Loader2 className="h-8 w-8 animate-spin text-terracotta" />
      </div>
    )
  }

  if (bookingComplete) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-cream">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-terracotta/10 flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-terracotta" />
          </div>
          <h1 className="font-display text-charcoal text-3xl mb-4" style={{ fontWeight: 300 }}>Consultation Booked</h1>
          <p className="font-body text-warm-gray mb-6">
            Your {duration}-minute {selectedType} consultation with {selectedConsultant?.name} has been scheduled.
            You'll receive a confirmation email with all the details.
          </p>
          <div className="bg-warm-white border border-sand p-4 mb-6 text-left">
            <p className="font-body text-sm"><span className="text-warm-gray">Date:</span> <span className="text-charcoal">{format(new Date(selectedDate), 'MMMM d, yyyy')}</span></p>
            <p className="font-body text-sm mt-1"><span className="text-warm-gray">Time:</span> <span className="text-charcoal">{selectedTime}</span></p>
            <p className="font-body text-sm mt-1"><span className="text-warm-gray">Type:</span> <span className="text-charcoal capitalize">{selectedType}</span></p>
          </div>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => {
                setBookingComplete(false)
                setSelectedConsultant(null)
                setStep('select')
                setSelectedDate('')
                setSelectedTime('')
              }}
              className="border border-charcoal text-charcoal px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-charcoal hover:text-cream transition-colors"
            >
              Book Another
            </button>
            <Link href="/account">
              <span className="bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors inline-block">
                My Bookings
              </span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 bg-cream">
      {/* Hero Section */}
      <div className="bg-charcoal py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center">
          <span className="eyebrow text-terracotta-light">Expert Guidance</span>
          <h1 
            className="font-display text-cream mt-4"
            style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)', fontWeight: 300 }}
          >
            Virtual Consultations
          </h1>
          <p className="font-body text-warm-gray max-w-2xl mx-auto mt-4">
            Connect with certified wellness experts for personalized guidance. 
            Private, discreet, and tailored to your needs.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[
            { num: 1, label: 'Select Expert' },
            { num: 2, label: 'Schedule' },
            { num: 3, label: 'Confirm' }
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${step === ['select', 'schedule', 'confirm'][i] ? 'text-terracotta' : 'text-warm-gray'}`}>
                <span className={`w-8 h-8 flex items-center justify-center text-sm font-body ${
                  step === ['select', 'schedule', 'confirm'][i] ? 'bg-terracotta/10 text-terracotta' : 'bg-sand text-warm-gray'
                }`}>
                  {s.num}
                </span>
                <span className="hidden sm:inline font-body text-sm">{s.label}</span>
              </div>
              {i < 2 && <div className="w-8 h-px bg-sand" />}
            </div>
          ))}
        </div>

        {/* Step: Select Consultant */}
        {step === 'select' && (
          <div className="space-y-8">
            <h2 className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>Our Wellness Experts</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {consultants.map((consultant) => (
                <div key={consultant.id} className="bg-warm-white border border-sand p-6 hover:border-terracotta/50 transition-colors">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-sand flex items-center justify-center">
                      {consultant.avatar ? (
                        <Image src={consultant.avatar} alt={consultant.name} width={56} height={56} className="object-cover" />
                      ) : (
                        <User className="h-6 w-6 text-warm-gray" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>{consultant.name}</h3>
                      <p className="font-body text-warm-gray text-sm">{consultant.title}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 text-terracotta fill-terracotta" />
                        <span className="font-body text-xs text-charcoal">{consultant.rating.toFixed(1)}</span>
                        <span className="font-body text-xs text-warm-gray">
                          ({consultant._count?.reviews || consultant.reviewCount})
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="font-body text-warm-gray text-sm mb-4 line-clamp-3">
                    {consultant.bio}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(typeof consultant.specialities === 'string' ? JSON.parse(consultant.specialities) : consultant.specialities).slice(0, 4).map((s: string) => (
                      <span key={s} className="px-2 py-1 bg-sand/50 font-body text-xs text-charcoal">
                        {s}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-sand">
                    <div>
                      <span className="font-body text-charcoal text-lg">${(consultant.hourlyRate / 100).toFixed(0)}</span>
                      <span className="font-body text-warm-gray text-sm">/hour</span>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedConsultant(consultant)
                        setStep('schedule')
                      }}
                      className="bg-charcoal text-cream px-4 py-2 font-body text-xs uppercase tracking-wider hover:bg-terracotta transition-colors flex items-center gap-1"
                    >
                      Book
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: Schedule */}
        {step === 'schedule' && selectedConsultant && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Consultant Summary */}
              <div className="bg-warm-white border border-sand p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-sand flex items-center justify-center">
                    <User className="h-5 w-5 text-warm-gray" />
                  </div>
                  <div>
                    <h3 className="font-display text-charcoal" style={{ fontWeight: 400 }}>{selectedConsultant.name}</h3>
                    <p className="font-body text-warm-gray text-sm">{selectedConsultant.title}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedConsultant(null)
                      setStep('select')
                    }}
                    className="ml-auto font-body text-sm text-warm-gray hover:text-terracotta"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Consultation Type */}
              <div className="bg-warm-white border border-sand p-6">
                <h3 className="font-body text-charcoal mb-4">Consultation Type</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: 'video', icon: Video, label: 'Video' },
                    { type: 'phone', icon: Phone, label: 'Phone' },
                    { type: 'chat', icon: MessageSquare, label: 'Chat' }
                  ].map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type as any)}
                      className={`flex flex-col items-center gap-2 p-4 border transition-all ${
                        selectedType === type
                          ? 'border-terracotta bg-terracotta/5'
                          : 'border-sand hover:border-terracotta/50'
                      }`}
                    >
                      <Icon className="h-5 w-5 text-charcoal" />
                      <span className="font-body text-sm text-charcoal">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="bg-warm-white border border-sand p-6">
                <h3 className="font-body text-charcoal mb-4">Duration</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[30, 45, 60].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`flex flex-col items-center gap-1 p-4 border transition-all ${
                        duration === d
                          ? 'border-terracotta bg-terracotta/5'
                          : 'border-sand hover:border-terracotta/50'
                      }`}
                    >
                      <Clock className="h-5 w-5 text-charcoal" />
                      <span className="font-body text-sm text-charcoal">{d} min</span>
                      <span className="font-body text-xs text-warm-gray">
                        ${Math.ceil((selectedConsultant.hourlyRate * d) / 100)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div className="bg-warm-white border border-sand p-6">
                <h3 className="font-body text-charcoal mb-4">Select Date & Time</h3>
                
                {/* Date Selection */}
                <div className="mb-6">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {getAvailableDates().map(({ date, dayName }) => (
                      <button
                        key={date}
                        onClick={() => {
                          setSelectedDate(date)
                          setSelectedTime('')
                        }}
                        className={`flex-shrink-0 px-4 py-3 border text-center min-w-[90px] transition-all ${
                          selectedDate === date
                            ? 'border-terracotta bg-terracotta/5'
                            : 'border-sand hover:border-terracotta/50'
                        }`}
                      >
                        <span className="block font-body text-xs text-warm-gray">{dayName.split(',')[0]}</span>
                        <span className="block font-body text-sm text-charcoal">{dayName.split(',')[1]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div>
                    <p className="font-body text-warm-gray text-sm mb-3">
                      Available times for {format(new Date(selectedDate), 'MMMM d, yyyy')}
                    </p>
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-terracotta" />
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                            className={`px-3 py-2 border font-body text-sm transition-all ${
                              selectedTime === slot
                                ? 'border-terracotta bg-terracotta/5 text-charcoal'
                                : 'border-sand hover:border-terracotta/50 text-charcoal'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="font-body text-warm-gray py-4">
                        No available slots for this date. Please select another date.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="bg-warm-white border border-sand p-6">
                <h3 className="font-body text-charcoal mb-4">Notes (Optional)</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Share any topics or questions you'd like to discuss..."
                  className="w-full p-3 border border-sand bg-cream font-body text-sm min-h-[100px] focus:outline-none focus:border-terracotta resize-none"
                />
              </div>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-warm-white border border-sand p-6 sticky top-24">
                <h3 className="font-body text-charcoal mb-4">Booking Summary</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-warm-gray">Expert</span>
                    <span className="text-charcoal">{selectedConsultant.name}</span>
                  </div>
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-warm-gray">Type</span>
                    <span className="text-charcoal capitalize">{selectedType}</span>
                  </div>
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-warm-gray">Duration</span>
                    <span className="text-charcoal">{duration} min</span>
                  </div>
                  {selectedDate && (
                    <div className="flex justify-between font-body text-sm">
                      <span className="text-warm-gray">Date</span>
                      <span className="text-charcoal">{format(new Date(selectedDate), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {selectedTime && (
                    <div className="flex justify-between font-body text-sm">
                      <span className="text-warm-gray">Time</span>
                      <span className="text-charcoal">{selectedTime}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-sand pt-4 mb-6">
                  <div className="flex justify-between">
                    <span className="font-body text-charcoal">Total</span>
                    <span className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                      ${(getPrice() / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button 
                  className="w-full bg-charcoal text-cream py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors disabled:opacity-50"
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep('confirm')}
                >
                  Continue to Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && selectedConsultant && (
          <div className="max-w-xl mx-auto">
            <div className="bg-warm-white border border-sand p-8">
              <h2 className="font-display text-charcoal text-2xl mb-6 text-center" style={{ fontWeight: 300 }}>Confirm Your Booking</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-4 p-4 bg-cream border border-sand">
                  <div className="w-10 h-10 bg-sand flex items-center justify-center">
                    <User className="h-5 w-5 text-warm-gray" />
                  </div>
                  <div>
                    <p className="font-body text-charcoal">{selectedConsultant.name}</p>
                    <p className="font-body text-warm-gray text-sm">{selectedConsultant.title}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-cream border border-sand">
                    <p className="font-body text-warm-gray text-xs mb-1">Date</p>
                    <p className="font-body text-charcoal">{format(new Date(selectedDate), 'MMMM d, yyyy')}</p>
                  </div>
                  <div className="p-4 bg-cream border border-sand">
                    <p className="font-body text-warm-gray text-xs mb-1">Time</p>
                    <p className="font-body text-charcoal">{selectedTime}</p>
                  </div>
                  <div className="p-4 bg-cream border border-sand">
                    <p className="font-body text-warm-gray text-xs mb-1">Type</p>
                    <p className="font-body text-charcoal capitalize">{selectedType}</p>
                  </div>
                  <div className="p-4 bg-cream border border-sand">
                    <p className="font-body text-warm-gray text-xs mb-1">Duration</p>
                    <p className="font-body text-charcoal">{duration} minutes</p>
                  </div>
                </div>

                {notes && (
                  <div className="p-4 bg-cream border border-sand">
                    <p className="font-body text-warm-gray text-xs mb-1">Your Notes</p>
                    <p className="font-body text-charcoal text-sm">{notes}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-sand pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-body text-charcoal">Total</span>
                  <span className="font-display text-charcoal text-2xl" style={{ fontWeight: 400 }}>
                    ${(getPrice() / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  className="flex-1 border border-charcoal text-charcoal py-3 font-body text-sm uppercase tracking-wider hover:bg-charcoal hover:text-cream transition-colors"
                  onClick={() => setStep('schedule')}
                >
                  Back
                </button>
                <button 
                  className="flex-1 bg-charcoal text-cream py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={submitting}
                  onClick={handleBooking}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

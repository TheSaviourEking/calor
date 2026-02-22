'use client'

import { useState, useEffect, useMemo } from 'react'
import { Zap, Clock, Flame } from 'lucide-react'

interface FlashSaleBannerProps {
  promotion: {
    id: string
    name: string
    endsAt: string
    value: number
  }
  onEnded?: () => void
}

function useCountdown(endsAt: string) {
  const calculateTimeLeft = useMemo(() => () => {
    const difference = new Date(endsAt).getTime() - Date.now()
    if (difference <= 0) return { hours: 0, minutes: 0, seconds: 0, ended: true }
    return {
      hours: Math.floor(difference / (1000 * 60 * 60)),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      ended: false,
    }
  }, [endsAt])

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [calculateTimeLeft])

  return timeLeft
}

export default function FlashSaleBanner({ promotion, onEnded }: FlashSaleBannerProps) {
  const timeLeft = useCountdown(promotion.endsAt)

  useEffect(() => {
    if (timeLeft.ended && onEnded) {
      onEnded()
    }
  }, [timeLeft.ended, onEnded])

  if (timeLeft.ended) return null

  const pad = (num: number) => num.toString().padStart(2, '0')

  return (
    <div className="bg-terracotta text-warm-white py-3 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          <span className="font-body text-sm font-medium uppercase tracking-wider">
            {promotion.name}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="font-body text-sm">Ends in:</span>
          <div className="flex items-center gap-1 font-mono text-sm">
            <span className="bg-warm-white/20 px-2 py-1">{pad(timeLeft.hours)}</span>
            <span>:</span>
            <span className="bg-warm-white/20 px-2 py-1">{pad(timeLeft.minutes)}</span>
            <span>:</span>
            <span className="bg-warm-white/20 px-2 py-1">{pad(timeLeft.seconds)}</span>
          </div>
        </div>

        <span className="font-body text-sm font-medium">
          {promotion.value}% OFF
        </span>
      </div>
    </div>
  )
}

// Mini countdown for product cards
export function FlashSaleCountdown({ endsAt }: { endsAt: string }) {
  const timeLeft = useCountdown(endsAt)

  const pad = useMemo(() => (num: number) => num.toString().padStart(2, '0'), [])

  return (
    <div className="flex items-center gap-1 text-xs font-body text-warm-white bg-terracotta/90 px-2 py-1">
      <Flame className="w-3 h-3" />
      <span className="font-mono">
        {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </span>
    </div>
  )
}

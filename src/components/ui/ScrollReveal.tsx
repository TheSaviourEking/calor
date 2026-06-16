'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

type Direction = 'up' | 'down' | 'left' | 'right' | 'fade'

interface ScrollRevealProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  direction?: Direction
  threshold?: number
  once?: boolean
  className?: string
}

function getInitial(direction: Direction) {
  const base = { opacity: 0 }
  switch (direction) {
    case 'up':    return { ...base, y: 32 }
    case 'down':  return { ...base, y: -32 }
    case 'left':  return { ...base, x: 40 }
    case 'right': return { ...base, x: -40 }
    case 'fade':  return base
    default:      return { ...base, y: 32 }
  }
}

function getAnimate(direction: Direction) {
  const base = { opacity: 1 }
  switch (direction) {
    case 'up':    return { ...base, y: 0 }
    case 'down':  return { ...base, y: 0 }
    case 'left':  return { ...base, x: 0 }
    case 'right': return { ...base, x: 0 }
    case 'fade':  return base
    default:      return { ...base, y: 0 }
  }
}

export function ScrollReveal({
  children,
  delay = 0,
  duration = 0.7,
  direction = 'up',
  threshold = 0.15,
  once = true,
  className = '',
}: ScrollRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once,
    // threshold controls how far the element needs to be in view
    // We use a fixed offset as framer-motion margin expects a specific string type
    amount: threshold,
  })

  return (
    <motion.div
      ref={ref}
      initial={getInitial(direction)}
      animate={isInView ? getAnimate(direction) : getInitial(direction)}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface StaggerGridProps {
  children: React.ReactNode[]
  className?: string
  itemDelay?: number
  direction?: Direction
  threshold?: number
}

export function StaggerGrid({
  children,
  className = '',
  itemDelay = 0.08,
  direction = 'up',
  threshold = 0.1,
}: StaggerGridProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once: true,
    amount: threshold,
  })

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={getInitial(direction)}
          animate={isInView ? getAnimate(direction) : getInitial(direction)}
          transition={{
            duration: 0.55,
            delay: index * itemDelay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  )
}

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function FadeIn({ children, delay = 0, duration = 0.6, className = '' }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

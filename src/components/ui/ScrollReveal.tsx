'use client'

import { useRef } from 'react'
import { motion, useInView } from 'motion/react'

interface ScrollRevealProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function ScrollReveal({ children, delay = 0, className = '' }: ScrollRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-15% 0px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94], // Apple easing
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
}

export function StaggerGrid({ children, className = '' }: StaggerGridProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' })

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{
            duration: 0.5,
            delay: index * 0.08,
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
}

export function FadeIn({ children, delay = 0, duration = 0.6 }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  )
}

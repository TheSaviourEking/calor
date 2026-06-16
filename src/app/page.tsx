import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

import Hero from '@/components/home/Hero'
import Marquee from '@/components/home/Marquee'
import CategoryGrid from '@/components/home/CategoryGrid'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import SearchSection from '@/components/home/SearchSection'
import FeaturesShowcase from '@/components/home/FeaturesShowcase'
import VIPTeaser from '@/components/home/VIPTeaser'
import Philosophy from '@/components/home/Philosophy'
import GiftSets from '@/components/home/GiftSets'
import DigitalProducts from '@/components/home/DigitalProducts'
import PaymentTrust from '@/components/home/PaymentTrust'
import Newsletter from '@/components/home/Newsletter'
import ClientWrapper from '@/components/layout/ClientWrapper'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

function SectionSkeleton() {
  return <div className="w-full h-64 bg-sand/30 animate-pulse" />
}

export default function Home() {
  return (
    <ClientWrapper>
      {/* Hero — no scroll reveal, it's the entry point */}
      <Hero />

      {/* Marquee — immediate, no delay */}
      <Marquee />

      {/* Category Grid */}
      <ScrollReveal direction="up" delay={0} threshold={0.08}>
        <Suspense fallback={<SectionSkeleton />}>
          <CategoryGrid />
        </Suspense>
      </ScrollReveal>

      {/* Featured Products */}
      <ScrollReveal direction="up" delay={0} threshold={0.08}>
        <Suspense fallback={<SectionSkeleton />}>
          <FeaturedProducts />
        </Suspense>
      </ScrollReveal>

      {/* Features Showcase */}
      <ScrollReveal direction="up" delay={0} threshold={0.08}>
        <FeaturesShowcase />
      </ScrollReveal>

      {/* VIP Teaser */}
      <ScrollReveal direction="fade" delay={0} threshold={0.1}>
        <VIPTeaser />
      </ScrollReveal>

      {/* Search Section */}
      <ScrollReveal direction="up" delay={0} threshold={0.1}>
        <SearchSection />
      </ScrollReveal>

      {/* Philosophy */}
      <ScrollReveal direction="fade" delay={0} threshold={0.1}>
        <Philosophy />
      </ScrollReveal>

      {/* Gift Sets */}
      <ScrollReveal direction="up" delay={0} threshold={0.08}>
        <Suspense fallback={<SectionSkeleton />}>
          <GiftSets />
        </Suspense>
      </ScrollReveal>

      {/* Digital Products */}
      <ScrollReveal direction="up" delay={0} threshold={0.08}>
        <Suspense fallback={<SectionSkeleton />}>
          <DigitalProducts />
        </Suspense>
      </ScrollReveal>

      {/* Payment Trust */}
      <ScrollReveal direction="up" delay={0} threshold={0.08}>
        <PaymentTrust />
      </ScrollReveal>

      {/* Newsletter */}
      <ScrollReveal direction="fade" delay={0} threshold={0.1}>
        <Newsletter />
      </ScrollReveal>
    </ClientWrapper>
  )
}

import { Suspense } from 'react'
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

function SectionSkeleton() {
  return <div className="w-full h-64 bg-sand/30 animate-pulse" />
}

export default function Home() {
  return (
    <ClientWrapper>
      <Hero />
      <Marquee />
      <Suspense fallback={<SectionSkeleton />}>
        <CategoryGrid />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedProducts />
      </Suspense>
      <FeaturesShowcase />
      <VIPTeaser />
      <SearchSection />
      <Philosophy />
      <Suspense fallback={<SectionSkeleton />}>
        <GiftSets />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <DigitalProducts />
      </Suspense>
      <PaymentTrust />
      <Newsletter />
    </ClientWrapper>
  )
}

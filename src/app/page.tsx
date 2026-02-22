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

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ClientWrapper>
        <Hero />
        <Marquee />
        <CategoryGrid />
        <FeaturedProducts />
        <FeaturesShowcase />
        <VIPTeaser />
        <SearchSection />
        <Philosophy />
        <GiftSets />
        <DigitalProducts />
        <PaymentTrust />
        <Newsletter />
      </ClientWrapper>
    </Suspense>
  )
}

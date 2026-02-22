import { Metadata } from 'next'
import ClientWrapper from '@/components/layout/ClientWrapper'
import QuizClient from './QuizClient'

export const metadata: Metadata = {
  title: 'Find Your Perfect Match | CALŌR',
  description: 'Take our personalized quiz to discover products tailored to your unique preferences and wellness goals.'
}

export default function QuizPage() {
  return (
    <ClientWrapper>
      <QuizClient />
    </ClientWrapper>
  )
}

'use client'

import { useEffect } from 'react'
import Navigation from './Navigation'
import Footer from './Footer'
import CartDrawer from '@/components/cart/CartDrawer'
import { ComparisonProvider } from '@/components/comparison/ComparisonContext'
import ChatbotWidget from '@/components/chatbot/ChatbotWidget'
import { useAuthStore } from '@/stores/auth'

interface ClientWrapperProps {
  children: React.ReactNode
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  const fetchCustomer = useAuthStore((state) => state.fetchCustomer)

  useEffect(() => {
    fetchCustomer()
  }, [fetchCustomer])

  return (
    <ComparisonProvider>
      <Navigation />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <ChatbotWidget />
    </ComparisonProvider>
  )
}

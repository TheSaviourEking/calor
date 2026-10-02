'use client'

import { useEffect } from 'react'
import { useCartStore, useCheckoutStore } from '@/stores'

// Card payments return here via a Stripe redirect, so the payment page never
// gets the chance to empty the cart. Do it once a real order is on screen.
export default function ClearCheckoutState() {
  const clearCart = useCartStore((state) => state.clearCart)
  const clearAll = useCheckoutStore((state) => state.clearAll)

  useEffect(() => {
    clearCart()
    clearAll()
    try {
      sessionStorage.removeItem('calor_checkout_sid')
    } catch { /* ignore */ }
  }, [clearCart, clearAll])

  return null
}

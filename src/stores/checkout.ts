import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AppliedPromo {
  id: string
  code: string
  name: string
  type: 'percentage' | 'fixed' | 'free_shipping'
  value: number
  discountCents: number
}

export interface AppliedGiftCard {
  id: string
  code: string
  balanceCents: number
  appliedCents: number
}

export interface AppliedPoints {
  pointsUsed: number
  discountCents: number  // 100 points = $1 (100 cents)
}

interface CheckoutState {
  promoCode: AppliedPromo | null
  giftCard: AppliedGiftCard | null
  loyaltyPoints: AppliedPoints | null
  referralCode: string | null
  referralDiscount: number
  availablePoints: number  // Customer's available loyalty points
  
  // Actions
  applyPromo: (promo: AppliedPromo) => void
  removePromo: () => void
  applyGiftCard: (giftCard: AppliedGiftCard, maxAmount: number) => void
  removeGiftCard: () => void
  applyPoints: (points: number, maxDiscountCents: number) => void
  removePoints: () => void
  setAvailablePoints: (points: number) => void
  setReferralCode: (code: string | null, discount: number) => void
  clearAll: () => void
  
  // Computed helpers
  getTotalDiscount: (subtotal: number, shipping: number) => {
    promoDiscount: number
    giftCardDiscount: number
    pointsDiscount: number
    total: number
  }
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      promoCode: null,
      giftCard: null,
      loyaltyPoints: null,
      referralCode: null,
      referralDiscount: 0,
      availablePoints: 0,

      applyPromo: (promo) => set({ promoCode: promo }),
      
      removePromo: () => set({ promoCode: null }),
      
      applyGiftCard: (giftCard, maxAmount) => set({
        giftCard: {
          ...giftCard,
          appliedCents: Math.min(giftCard.balanceCents, maxAmount),
        }
      }),
      
      removeGiftCard: () => set({ giftCard: null }),
      
      applyPoints: (points, maxDiscountCents) => {
        // 100 points = $1 (100 cents)
        const maxPoints = Math.min(points, get().availablePoints)
        const maxPossibleDiscount = Math.floor(maxPoints) // in cents
        const actualDiscount = Math.min(maxPossibleDiscount, maxDiscountCents)
        const pointsUsed = actualDiscount // 1 point = 1 cent discount
        
        set({
          loyaltyPoints: {
            pointsUsed,
            discountCents: actualDiscount,
          }
        })
      },
      
      removePoints: () => set({ loyaltyPoints: null }),
      
      setAvailablePoints: (points) => set({ availablePoints: points }),
      
      setReferralCode: (code, discount) => set({ 
        referralCode: code,
        referralDiscount: discount 
      }),
      
      clearAll: () => set({
        promoCode: null,
        giftCard: null,
        loyaltyPoints: null,
        referralCode: null,
        referralDiscount: 0,
      }),
      
      getTotalDiscount: (subtotal, shipping) => {
        const state = get()
        let promoDiscount = 0
        let giftCardDiscount = 0
        let pointsDiscount = 0
        
        // Calculate promo discount
        if (state.promoCode) {
          if (state.promoCode.type === 'percentage') {
            promoDiscount = Math.floor((subtotal * state.promoCode.value) / 100)
          } else if (state.promoCode.type === 'fixed') {
            promoDiscount = state.promoCode.value
          } else if (state.promoCode.type === 'free_shipping') {
            promoDiscount = shipping
          }
        }
        
        // Add referral discount
        promoDiscount += state.referralDiscount
        
        // Calculate remaining after promo
        const afterPromo = subtotal + shipping - promoDiscount
        
        // Calculate points discount on remaining amount
        if (state.loyaltyPoints && afterPromo > 0) {
          pointsDiscount = Math.min(state.loyaltyPoints.discountCents, afterPromo)
        }
        
        // Calculate remaining after points
        const afterPoints = afterPromo - pointsDiscount
        
        // Calculate gift card discount on remaining amount
        if (state.giftCard && afterPoints > 0) {
          giftCardDiscount = Math.min(state.giftCard.balanceCents, afterPoints)
        }
        
        return {
          promoDiscount,
          giftCardDiscount,
          pointsDiscount,
          total: subtotal + shipping - promoDiscount - giftCardDiscount - pointsDiscount,
        }
      },
    }),
    {
      name: 'calor-checkout',
    }
  )
)

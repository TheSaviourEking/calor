import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistStore {
  items: string[] // product IDs
  addItem: (productId: string) => void
  removeItem: (productId: string) => void
  toggleItem: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => void
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (productId) => {
        const items = get().items
        if (!items.includes(productId)) {
          set({ items: [...items, productId] })
        }
      },
      
      removeItem: (productId) => {
        set({ items: get().items.filter((id) => id !== productId) })
      },
      
      toggleItem: (productId) => {
        const items = get().items
        if (items.includes(productId)) {
          set({ items: items.filter((id) => id !== productId) })
        } else {
          set({ items: [...items, productId] })
        }
      },
      
      isInWishlist: (productId) => {
        return get().items.includes(productId)
      },
      
      clearWishlist: () => set({ items: [] }),
    }),
    { name: 'calor-wishlist' }
  )
)

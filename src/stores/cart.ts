import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  productId: string
  variantId: string
  name: string
  category: string
  price: number
  quantity: number
  image?: string
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const items = get().items
        const existingItem = items.find((i) => i.id === item.id)

        if (existingItem) {
          const newQuantity = Math.min(existingItem.quantity + item.quantity, 10)
          set({
            items: items.map((i) =>
              i.id === item.id
                ? { ...i, quantity: newQuantity }
                : i
            ),
          })
        } else {
          // Cap initial add at 10
          set({ items: [...items, { ...item, quantity: Math.min(item.quantity, 10) }] })
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) })
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }

        const validQuantity = Math.min(quantity, 10)
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity: validQuantity } : i
          ),
        })
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
    }),
    { name: 'calor-cart' }
  )
)

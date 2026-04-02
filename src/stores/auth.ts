import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Customer {
  id: string
  email: string
  firstName: string
  lastName: string
  isAdmin?: boolean
}

interface AuthState {
  customer: Customer | null
  isAuthenticated: boolean
  isLoading: boolean
  hasFetched: boolean
  setCustomer: (customer: Customer | null) => void
  logout: () => void
  fetchCustomer: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      customer: null,
      isAuthenticated: false,
      isLoading: true,
      hasFetched: false,

      setCustomer: (customer) => set({
        customer,
        isAuthenticated: !!customer,
        isLoading: false,
        hasFetched: true
      }),

      logout: () => {
        set({
          customer: null,
          isAuthenticated: false,
          isLoading: false,
          hasFetched: false
        })
        // Clear other user-scoped stores
        try {
          localStorage.removeItem('calor-cart')
          localStorage.removeItem('calor-wishlist')
          localStorage.removeItem('calor-checkout')
          localStorage.removeItem('calor-quiz')
        } catch { /* ignore */ }
        // Also call the logout API
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => { })
      },

      fetchCustomer: async () => {
        if (get().hasFetched) return;

        try {
          const res = await fetch('/api/auth/me')
          const data = await res.json()

          if (data.customer) {
            set({
              customer: data.customer,
              isAuthenticated: true,
              isLoading: false,
              hasFetched: true
            })
          } else {
            set({
              customer: null,
              isAuthenticated: false,
              isLoading: false,
              hasFetched: true
            })
          }
        } catch {
          set({
            customer: null,
            isAuthenticated: false,
            isLoading: false,
            hasFetched: true
          })
        }
      },
    }),
    {
      name: 'calor-auth',
      partialize: (state) => ({
        customer: state.customer ? { id: state.customer.id, firstName: state.customer.firstName } : null,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
)

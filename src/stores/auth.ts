import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Customer {
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
  setCustomer: (customer: Customer | null) => void
  logout: () => void
  fetchCustomer: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      customer: null,
      isAuthenticated: false,
      isLoading: true,
      
      setCustomer: (customer) => set({ 
        customer, 
        isAuthenticated: !!customer,
        isLoading: false 
      }),
      
      logout: () => {
        set({ 
          customer: null, 
          isAuthenticated: false,
          isLoading: false 
        })
        // Also call the logout API
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
      },
      
      fetchCustomer: async () => {
        try {
          const res = await fetch('/api/auth/me')
          const data = await res.json()
          
          if (data.customer) {
            set({ 
              customer: data.customer, 
              isAuthenticated: true,
              isLoading: false 
            })
          } else {
            set({ 
              customer: null, 
              isAuthenticated: false,
              isLoading: false 
            })
          }
        } catch {
          set({ 
            customer: null, 
            isAuthenticated: false,
            isLoading: false 
          })
        }
      },
    }),
    {
      name: 'calor-auth',
      partialize: (state) => ({ 
        customer: state.customer,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)

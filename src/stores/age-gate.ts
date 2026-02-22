import { create } from 'zustand'

interface AgeGateStore {
  isVerified: boolean
  showAgeGate: boolean
  verify: () => void
  showGate: () => void
  hideGate: () => void
}

export const useAgeGateStore = create<AgeGateStore>((set) => ({
  isVerified: false,
  showAgeGate: false,
  
  verify: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('calor_age_verified', 'true')
    }
    set({ isVerified: true, showAgeGate: false })
  },
  
  showGate: () => set({ showAgeGate: true }),
  hideGate: () => set({ showAgeGate: false }),
}))

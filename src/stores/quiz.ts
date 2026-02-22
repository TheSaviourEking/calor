import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface QuizQuestion {
  id: string
  question: string
  description: string | null
  type: 'single' | 'multiple' | 'slider' | 'input'
  category: string
  options: { value: string; label: string; icon: string; weight: number }[]
  weight: number
  sortOrder: number
}

export interface QuizAnswer {
  questionId: string
  answer: string | string[]
}

interface QuizState {
  sessionId: string | null
  questions: QuizQuestion[]
  currentStep: number
  answers: QuizAnswer[]
  isComplete: boolean
  recommendations: {
    productId: string
    score: number
    reasons: string[]
  }[] | null
  profile: Record<string, string | string[]> | null
  isLoading: boolean

  // Actions
  setSessionId: (id: string) => void
  setQuestions: (questions: QuizQuestion[]) => void
  setAnswer: (questionId: string, answer: string | string[]) => void
  nextStep: () => void
  prevStep: () => void
  setComplete: (recommendations: { productId: string; score: number; reasons: string[] }[], profile: Record<string, string | string[]>) => void
  reset: () => void
  setLoading: (loading: boolean) => void
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      sessionId: null,
      questions: [],
      currentStep: 0,
      answers: [],
      isComplete: false,
      recommendations: null,
      profile: null,
      isLoading: false,

      setSessionId: (id) => set({ sessionId: id }),
      
      setQuestions: (questions) => set({ questions }),
      
      setAnswer: (questionId, answer) => set((state) => {
        const existingIndex = state.answers.findIndex(a => a.questionId === questionId)
        if (existingIndex >= 0) {
          const newAnswers = [...state.answers]
          newAnswers[existingIndex] = { questionId, answer }
          return { answers: newAnswers }
        }
        return { answers: [...state.answers, { questionId, answer }] }
      }),
      
      nextStep: () => set((state) => ({ 
        currentStep: Math.min(state.currentStep + 1, state.questions.length) 
      })),
      
      prevStep: () => set((state) => ({ 
        currentStep: Math.max(state.currentStep - 1, 0) 
      })),
      
      setComplete: (recommendations, profile) => set({ 
        isComplete: true, 
        recommendations,
        profile
      }),
      
      reset: () => set({ 
        currentStep: 0, 
        answers: [], 
        isComplete: false, 
        recommendations: null,
        profile: null,
        sessionId: null
      }),
      
      setLoading: (loading) => set({ isLoading: loading })
    }),
    {
      name: 'calor-quiz-storage',
      partialize: (state) => ({
        sessionId: state.sessionId,
        answers: state.answers,
        isComplete: state.isComplete,
        recommendations: state.recommendations
      })
    }
  )
)

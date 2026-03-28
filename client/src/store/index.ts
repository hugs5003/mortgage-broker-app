import { create } from 'zustand'
import type { UserProfile, MortgageDeal, User } from '../types'

interface AppStore {
  user: User | null
  token: string | null
  setUser: (user: User | null, token?: string) => void
  logout: () => void

  step: number
  userProfile: UserProfile
  setStep: (step: number) => void
  updateProfile: (updates: Partial<UserProfile>) => void

  deals: MortgageDeal[]
  loading: boolean
  error: string | null
  setDeals: (deals: MortgageDeal[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

const defaultProfile: UserProfile = {
  propertyValue: 300000,
  deposit: 60000,
  purchaseType: 'firstTime',
  grossIncome: 55000,
  termYears: 25,
  priorities: ['lowestMonthly'],
  riskTolerance: 50,
}

export const useStore = create<AppStore>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  setUser: (user, token) => {
    if (token) localStorage.setItem('token', token)
    set({ user, token: token ?? null })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  step: 1,
  userProfile: defaultProfile,
  setStep: (step) => set({ step }),
  updateProfile: (updates) =>
    set((state) => ({ userProfile: { ...state.userProfile, ...updates } })),

  deals: [],
  loading: false,
  error: null,
  setDeals: (deals) => set({ deals }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))

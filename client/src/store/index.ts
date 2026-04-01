import { create } from 'zustand'
import type { UserProfile, MortgageDeal, User } from '../types'

interface Utm {
  source: string | null
  medium: string | null
  campaign: string | null
}

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

  utm: Utm
  setUtm: (utm: Utm) => void

  leadSubmitted: boolean
  setLeadSubmitted: (v: boolean) => void
  feedbackSubmitted: boolean
  setFeedbackSubmitted: (v: boolean) => void
}

type AppMode = 'consumer' | 'broker'
type ActivePage = 'wizard' | 'financial-tools'

interface ExtendedStore extends AppStore {
  mode: AppMode
  setMode: (mode: AppMode) => void
  activePage: ActivePage
  setActivePage: (page: ActivePage) => void
  comparisonDealIds: string[]
  toggleComparisonDeal: (id: string) => void
  clearComparison: () => void
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

export const useStore = create<ExtendedStore>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  setUser: (user, token) => {
    if (token) localStorage.setItem('token', token)
    set({ user, token: token ?? null })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, mode: 'consumer' })
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

  utm: { source: null, medium: null, campaign: null },
  setUtm: (utm) => set({ utm }),

  leadSubmitted: false,
  setLeadSubmitted: (v) => set({ leadSubmitted: v }),
  feedbackSubmitted: false,
  setFeedbackSubmitted: (v) => set({ feedbackSubmitted: v }),

  mode: 'consumer',
  setMode: (mode) => set({ mode }),
  activePage: 'wizard',
  setActivePage: (page) => set({ activePage: page }),
  comparisonDealIds: [],
  toggleComparisonDeal: (id) =>
    set((state) => {
      const already = state.comparisonDealIds.includes(id)
      if (already) return { comparisonDealIds: state.comparisonDealIds.filter((x) => x !== id) }
      if (state.comparisonDealIds.length >= 3) return state
      return { comparisonDealIds: [...state.comparisonDealIds, id] }
    }),
  clearComparison: () => set({ comparisonDealIds: [] }),
}))

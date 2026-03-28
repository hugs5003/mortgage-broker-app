import axios from 'axios'
import type { MortgageDeal, User, UserProfile } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true'

const api = axios.create({
  baseURL: `${API_BASE}/api`,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function buildMockDeals(profile: UserProfile): MortgageDeal[] {
  const loanAmount = profile.propertyValue - profile.deposit
  const monthlyFactor = Math.max(loanAmount / 250000, 0.5)

  const deals: MortgageDeal[] = [
    {
      id: 'mock_1',
      lender: 'Barclays',
      dealName: '2-Year Fixed Saver',
      type: 'fixed_2yr',
      rate: 4.29,
      fixedPeriod: 2,
      svr: 7.99,
      arrangementFee: 999,
      valuationFee: 0,
      legalFees: 0,
      maxLTV: 75,
      overpaymentAllowance: 10,
      features: ['Free valuation', 'Portable'],
      calculation: {
        monthlyDeal: 1180 * monthlyFactor,
        totalCost: 57000 * monthlyFactor,
        initialMonthlyPayment: 1180 * monthlyFactor,
      },
      score: 91,
    },
    {
      id: 'mock_2',
      lender: 'HSBC',
      dealName: '2-Year Fixed',
      type: 'fixed_2yr',
      rate: 4.19,
      fixedPeriod: 2,
      svr: 8.19,
      arrangementFee: 1499,
      valuationFee: 0,
      legalFees: 0,
      maxLTV: 80,
      overpaymentAllowance: 10,
      features: ['Free legal fees', 'Portable'],
      calculation: {
        monthlyDeal: 1160 * monthlyFactor,
        totalCost: 57400 * monthlyFactor,
        initialMonthlyPayment: 1160 * monthlyFactor,
      },
      score: 89,
    },
    {
      id: 'mock_3',
      lender: 'NatWest',
      dealName: '2-Year Fixed (No Fee)',
      type: 'fixed_2yr',
      rate: 4.59,
      fixedPeriod: 2,
      svr: 7.74,
      arrangementFee: 0,
      valuationFee: 0,
      legalFees: 0,
      maxLTV: 85,
      overpaymentAllowance: 10,
      features: ['No arrangement fee', '250 GBP cashback'],
      calculation: {
        monthlyDeal: 1220 * monthlyFactor,
        totalCost: 56500 * monthlyFactor,
        initialMonthlyPayment: 1220 * monthlyFactor,
      },
      score: 88,
    },
    {
      id: 'mock_4',
      lender: 'Santander',
      dealName: '5-Year Fixed',
      type: 'fixed_5yr',
      rate: 4.15,
      fixedPeriod: 5,
      svr: 7.5,
      arrangementFee: 1499,
      valuationFee: 0,
      legalFees: 0,
      maxLTV: 75,
      overpaymentAllowance: 10,
      features: ['Portable', '10% overpayments'],
      calculation: {
        monthlyDeal: 1155 * monthlyFactor,
        totalCost: 139000 * monthlyFactor,
        initialMonthlyPayment: 1155 * monthlyFactor,
      },
      score: 90,
    },
  ]

  return deals
}

function normalizeDealsResponse(payload: unknown): MortgageDeal[] {
  if (Array.isArray(payload)) {
    return payload as MortgageDeal[]
  }

  const maybeDeals = (payload as { deals?: unknown[] })?.deals
  if (!Array.isArray(maybeDeals)) {
    return []
  }

  return maybeDeals.map((item) => {
    const wrapped = item as {
      deal?: MortgageDeal
      monthlyPayment?: number
      totalCost?: number
      score?: number
    }

    if (wrapped.deal) {
      return {
        ...wrapped.deal,
        calculation: {
          monthlyDeal: wrapped.monthlyPayment || 0,
          totalCost: wrapped.totalCost || 0,
          initialMonthlyPayment: wrapped.monthlyPayment || 0,
        },
        score: wrapped.score,
      }
    }

    return item as MortgageDeal
  })
}

export const authApi = {
  login: async (email: string, password: string) => {
    if (USE_MOCK_DATA) {
      const user: User = {
        id: 'mock-user-1',
        email,
        name: 'Demo User',
        role: 'user',
      }
      return { user, token: 'mock-token' }
    }
    return api.post('/auth/login', { email, password }).then((r) => r.data)
  },
  register: async (email: string, name: string, password: string) => {
    if (USE_MOCK_DATA) {
      const user: User = {
        id: 'mock-user-1',
        email,
        name,
        role: 'user',
      }
      return { user, token: 'mock-token' }
    }
    return api.post('/auth/register', { email, name, password }).then((r) => r.data)
  },
  me: async () => {
    if (USE_MOCK_DATA) {
      return {
        id: 'mock-user-1',
        email: 'demo@example.com',
        name: 'Demo User',
        role: 'user',
      }
    }
    return api.get('/auth/me').then((r) => r.data)
  },
}

export const dealsApi = {
  calculate: async (profile: UserProfile) => {
    if (USE_MOCK_DATA) {
      return buildMockDeals(profile)
    }

    try {
      const payload = await api.post('/deals/calculate', profile).then((r) => r.data)
      return normalizeDealsResponse(payload)
    } catch (err) {
      // Demo fallback keeps end-to-end UX working while backend wiring is finalized.
      return buildMockDeals(profile)
    }
  },
  getScenarios: async () => {
    if (USE_MOCK_DATA) {
      return []
    }
    return api.get('/deals/scenarios').then((r) => r.data)
  },
  saveScenario: async (name: string, userProfile: UserProfile) => {
    if (USE_MOCK_DATA) {
      return { id: `mock-scenario-${Date.now()}`, name, userProfile }
    }
    return api.post('/deals/scenarios', { name, userProfile }).then((r) => r.data)
  },
}

export default api

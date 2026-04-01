import axios from 'axios'
import type { BrokerHighlight, FeedbackSubmission, LeadSubmission, MortgageDeal, UserProfile } from '../types'

function resolveApiBase() {
  const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

  if (configuredApiUrl) {
    return configuredApiUrl.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    const isLocalHost =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

    if (isLocalHost) {
      return 'http://localhost:5000'
    }

    console.warn('VITE_API_URL is not set. Falling back to same-origin requests.')
    return window.location.origin
  }

  return 'http://localhost:5000'
}

const API_BASE = resolveApiBase()
const USE_CLIENT_MOCK_DEALS = import.meta.env.VITE_USE_CLIENT_MOCK_DEALS === 'true'

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
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  register: (email: string, name: string, password: string) =>
    api.post('/auth/register', { email, name, password }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
}

export const dealsApi = {
  calculate: async (profile: UserProfile) => {
    if (USE_CLIENT_MOCK_DEALS) {
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
  getScenarios: () => api.get('/deals/scenarios').then((r) => r.data),
  saveScenario: (name: string, userProfile: UserProfile) =>
    api.post('/deals/scenarios', { name, userProfile }).then((r) => r.data),
}

export const leadApi = {
  submit: (data: LeadSubmission) => api.post('/leads', data).then((r) => r.data),
}

export const feedbackApi = {
  submit: (data: FeedbackSubmission) => api.post('/feedback', data).then((r) => r.data),
}

export const brokerApi = {
  getSessions: () => api.get('/broker/sessions').then((r) => r.data),
  createSession: (data: Record<string, unknown>) =>
    api.post('/broker/sessions', data).then((r) => r.data),
  updateSession: (id: string, data: Record<string, unknown>) =>
    api.put(`/broker/sessions/${id}`, data).then((r) => r.data),
  getSession: (id: string) => api.get(`/broker/sessions/${id}`).then((r) => r.data),
  publishSession: (id: string) =>
    api.post(`/broker/sessions/${id}/publish`).then((r) => r.data),
  addHighlight: (
    sessionId: string,
    highlight: Pick<BrokerHighlight, 'dealId' | 'type' | 'comment'>
  ) =>
    api
      .post(`/broker/sessions/${sessionId}/highlights`, {
        dealId: highlight.dealId,
        highlightType: highlight.type,
        comment: highlight.comment,
      })
      .then((r) => r.data),
  removeHighlight: (sessionId: string, dealId: string) =>
    api.delete(`/broker/sessions/${sessionId}/highlights/${dealId}`).then((r) => r.data),
}

export const shareApi = {
  getByToken: (token: string) => api.get(`/share/${token}`).then((r) => r.data),
  applyOverride: (token: string, overrideData: Partial<UserProfile>) =>
    api.post(`/share/${token}/override`, { overrideData }).then((r) => r.data),
}

export const financialApi = {
  overpayVsInvest: (data: Record<string, number>) =>
    api.post('/financial/overpay-vs-invest', data).then((r) => r.data),
  compoundGrowth: (data: Record<string, number | boolean>) =>
    api.post('/financial/compound-growth', data).then((r) => r.data),
  savingsTimeline: (data: Record<string, number>) =>
    api.post('/financial/savings-timeline', data).then((r) => r.data),
  retirementProjection: (data: Record<string, number>) =>
    api.post('/financial/retirement-projection', data).then((r) => r.data),
  retirementGap: (data: Record<string, number>) =>
    api.post('/financial/retirement-gap', data).then((r) => r.data),
  firstHome: (data: Record<string, number>) =>
    api.post('/financial/first-home', data).then((r) => r.data),
  isaComparison: (data: Record<string, number>) =>
    api.post('/financial/isa-comparison', data).then((r) => r.data),
}

export default api

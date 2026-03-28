export interface UserProfile {
  propertyValue: number
  deposit: number
  purchaseType: string
  grossIncome: number
  termYears: number
  priorities: string[]
  riskTolerance: number
}

export interface DealCalculation {
  monthlyDeal: number
  totalCost: number
  initialMonthlyPayment: number
}

export interface MortgageDeal {
  id: string
  lender: string
  dealName: string
  type: string
  rate: number
  fixedPeriod: number
  svr: number
  arrangementFee: number
  valuationFee: number
  legalFees: number
  maxLTV: number
  overpaymentAllowance: number
  features: string[]
  score?: number
  calculation?: DealCalculation
}

export interface User {
  id: string
  email: string
  name: string
  role: string
}

export interface LeadSubmission {
  email: string
  consent: boolean
  source?: string
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  purchase_type?: string
}

export interface FeedbackSubmission {
  rating: number
  comment?: string
  email?: string
  purchase_type?: string
  utm_source?: string | null
  utm_campaign?: string | null
}

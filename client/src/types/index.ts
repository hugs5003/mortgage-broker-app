export interface UserProfile {
  propertyValue: number
  deposit: number
  purchaseType: string
  grossIncome: number
  termYears: number
  priorities: string[]
  riskTolerance: number
  // Extended optional fields
  age?: number
  employmentStatus?: string
  creditProfile?: string
  jointApplication?: boolean
  secondIncome?: number
  monthlyOutgoings?: number
  savingsAmount?: number
  overpaymentPlans?: boolean
  overpaymentAmount?: number
  movingWithin5Years?: boolean
  interestOnly?: boolean
  propertyType?: string
  leasehold?: boolean
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

export interface BrokerHighlight {
  dealId: string
  type: 'recommended' | 'alternative' | 'avoid'
  comment?: string
  displayOrder?: number
}

export interface BrokerSession {
  [key: string]: unknown
  id: string
  clientName: string
  clientEmail?: string
  status: 'draft' | 'published' | 'viewed' | 'expired'
  brokerNotes?: string
  shareToken?: string
  propertyValue?: number
  deposit?: number
  purchaseType?: string
  propertyType?: string
  leasehold?: boolean
  grossIncome?: number
  jointApplication?: boolean
  secondIncome?: number
  employmentStatus?: string
  monthlyOutgoings?: number
  creditProfile?: string
  age?: number
  termYears?: number
  priorities?: string[]
  overpaymentPlans?: boolean
  overpaymentAmount?: number
  movingWithin5Years?: boolean
  riskTolerance?: number
  savingsAmount?: number
  interestOnly?: boolean
  highlights?: BrokerHighlight[]
  createdAt?: string
  updatedAt?: string
}

export interface ShareSessionData {
  token: string
  expiresAt?: string
  session: BrokerSession
  deals?: MortgageDeal[]
}

export interface FeedbackSubmission {
  rating: number
  comment?: string
  email?: string
  purchase_type?: string
  utm_source?: string | null
  utm_campaign?: string | null
}

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

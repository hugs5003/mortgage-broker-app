// User types
export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'user' | 'admin' | 'broker';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'broker';
}

// Authentication
export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserPublic;
  token: string;
  expiresIn: string;
}

// Mortgage deals
export interface MortgageDeal {
  id: string;
  lender: string;
  dealName: string;
  type: MortgageType;
  rate: number;
  rateMargin?: number;
  fixedPeriod: number;
  svr: number;
  arrangementFee: number;
  valuationFee: number;
  legalFees: number;
  maxLTV: number;
  minLTV: number;
  ercYear1: number;
  ercYear2: number;
  ercYear3: number;
  ercYear4: number;
  ercYear5: number;
  overpaymentAllowance: number;
  portable: boolean;
  cashback: number;
  features: string[];
  lastUpdated: Date;
  provider: 'mock' | 'moneyfacts' | 'defaqto';
}

export type MortgageType =
  | 'fixed_2yr'
  | 'fixed_3yr'
  | 'fixed_5yr'
  | 'fixed_10yr'
  | 'tracker'
  | 'svr'
  | 'discount'
  | 'offset'
  | 'interest_only';

// User profile/scenario
export interface UserScenario {
  id: string;
  userId: string;
  name: string;
  propertyValue: number;
  deposit: number;
  purchaseType: 'firstTime' | 'movingHome' | 'remortgage' | 'buyToLet';
  propertyType: string;
  leasehold: boolean;
  grossIncome: number;
  jointApplication: boolean;
  secondIncome: number;
  employmentStatus: string;
  monthlyOutgoings: number;
  creditProfile: string;
  age: number;
  termYears: number;
  priorities: string[];
  overpaymentPlans: boolean;
  overpaymentAmount: number;
  movingWithin5Years: boolean;
  riskTolerance: number;
  savingsAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Calculation results
export interface MortgageCalculation {
  monthlyDeal: number;
  monthlySVR: number;
  totalDealPeriod: number;
  totalSVRPeriod: number;
  totalCost: number;
  totalInterest: number;
  remainingBalance: number;
  fees: number;
}

export interface DealScore {
  dealId: string;
  deal: MortgageDeal;
  calculation: MortgageCalculation;
  score: number;
  verdict: string;
}

// API request/response types
export interface CreateScenarioRequest {
  name: string;
  propertyValue: number;
  deposit: number;
  purchaseType: 'firstTime' | 'movingHome' | 'remortgage' | 'buyToLet';
  grossIncome: number;
  termYears: number;
  [key: string]: any;
}

export interface GetDealsRequest {
  propertyValue: number;
  deposit: number;
  termYears: number;
  grossIncome: number;
  priorities?: string[];
  riskTolerance?: number;
}

export interface ErrorResponse {
  error: string;
  statusCode: number;
  timestamp: string;
}

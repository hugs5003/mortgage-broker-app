import { MortgageDeal, MortgageType } from '@/types';

/**
 * Abstract interface for mortgage data providers
 * Allows swapping between mock, Moneyfacts, Defaqto, etc.
 */
export interface IMortgageDataProvider {
  name: string;
  getDeals(filters?: DealsFilter): Promise<MortgageDeal[]>;
  getDealById(id: string): Promise<MortgageDeal | null>;
  refreshDeals(): Promise<void>;
}

export interface DealsFilter {
  lender?: string;
  type?: MortgageType;
  maxLTV?: number;
  minRate?: number;
  maxRate?: number;
}

/**
 * Mock provider - returns hardcoded realistic data
 * Perfect for development and as a fallback
 */
export class MockMortgageDataProvider implements IMortgageDataProvider {
  name = 'mock';

  private deals: MortgageDeal[] = [
    // 2-Year Fixed
    {
      id: 'deal_1',
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
      minLTV: 0,
      ercYear1: 2.0,
      ercYear2: 1.0,
      ercYear3: 0,
      ercYear4: 0,
      ercYear5: 0,
      overpaymentAllowance: 10,
      portable: true,
      cashback: 0,
      features: ['Free valuation', 'Portable', '10% overpayment allowed'],
      lastUpdated: new Date(),
      provider: 'mock',
    },
    {
      id: 'deal_2',
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
      minLTV: 0,
      ercYear1: 3.0,
      ercYear2: 2.0,
      ercYear3: 0,
      ercYear4: 0,
      ercYear5: 0,
      overpaymentAllowance: 10,
      portable: true,
      cashback: 0,
      features: ['Free valuation', 'Free legal fees on remortgage', 'Portable'],
      lastUpdated: new Date(),
      provider: 'mock',
    },
    {
      id: 'deal_3',
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
      minLTV: 0,
      ercYear1: 2.0,
      ercYear2: 1.0,
      ercYear3: 0,
      ercYear4: 0,
      ercYear5: 0,
      overpaymentAllowance: 10,
      portable: true,
      cashback: 250,
      features: ['No arrangement fee', '£250 cashback', 'Portable'],
      lastUpdated: new Date(),
      provider: 'mock',
    },
    // 5-Year Fixed
    {
      id: 'deal_4',
      lender: 'Barclays',
      dealName: '5-Year Fixed',
      type: 'fixed_5yr',
      rate: 4.09,
      fixedPeriod: 5,
      svr: 7.99,
      arrangementFee: 999,
      valuationFee: 0,
      legalFees: 0,
      maxLTV: 75,
      minLTV: 0,
      ercYear1: 5.0,
      ercYear2: 4.0,
      ercYear3: 3.0,
      ercYear4: 2.0,
      ercYear5: 1.0,
      overpaymentAllowance: 10,
      portable: true,
      cashback: 0,
      features: ['Free valuation', 'Portable', '10% annual overpayment'],
      lastUpdated: new Date(),
      provider: 'mock',
    },
    {
      id: 'deal_5',
      lender: 'Halifax',
      dealName: '5-Year Fixed (No Fee)',
      type: 'fixed_5yr',
      rate: 4.39,
      fixedPeriod: 5,
      svr: 8.24,
      arrangementFee: 0,
      valuationFee: 0,
      legalFees: 0,
      maxLTV: 85,
      minLTV: 0,
      ercYear1: 4.0,
      ercYear2: 3.0,
      ercYear3: 2.0,
      ercYear4: 1.0,
      ercYear5: 0.5,
      overpaymentAllowance: 10,
      portable: false,
      cashback: 500,
      features: ['No arrangement fee', '£500 cashback'],
      lastUpdated: new Date(),
      provider: 'mock',
    },
    {
      id: 'deal_6',
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
      minLTV: 0,
      ercYear1: 5.0,
      ercYear2: 4.0,
      ercYear3: 3.0,
      ercYear4: 2.0,
      ercYear5: 1.0,
      overpaymentAllowance: 10,
      portable: true,
      cashback: 0,
      features: ['Free property valuation', 'Portable deal', 'Cashback on completion'],
      lastUpdated: new Date(),
      provider: 'mock',
    },
    // Tracker
    {
      id: 'deal_7',
      lender: 'HSBC',
      dealName: '2-Year Tracker',
      type: 'tracker',
      rate: 4.49,
      rateMargin: 0.24,
      fixedPeriod: 2,
      svr: 8.19,
      arrangementFee: 0,
      valuationFee: 0,
      legalFees: 0,
      maxLTV: 60,
      minLTV: 0,
      ercYear1: 0,
      ercYear2: 0,
      ercYear3: 0,
      ercYear4: 0,
      ercYear5: 0,
      overpaymentAllowance: 100,
      portable: true,
      cashback: 0,
      features: ['No early repayment charges', 'Unlimited overpayments', 'No arrangement fee'],
      lastUpdated: new Date(),
      provider: 'mock',
    },
    // SVR
    {
      id: 'deal_8',
      lender: 'Various',
      dealName: 'Standard Variable Rate',
      type: 'svr',
      rate: 7.99,
      fixedPeriod: 0,
      svr: 7.99,
      arrangementFee: 0,
      valuationFee: 0,
      legalFees: 0,
      maxLTV: 90,
      minLTV: 0,
      ercYear1: 0,
      ercYear2: 0,
      ercYear3: 0,
      ercYear4: 0,
      ercYear5: 0,
      overpaymentAllowance: 100,
      portable: false,
      cashback: 0,
      features: ['No ERCs', 'Flexible overpayments', 'Warning: usually more expensive than other deals'],
      lastUpdated: new Date(),
      provider: 'mock',
    },
  ];

  async getDeals(filters?: DealsFilter): Promise<MortgageDeal[]> {
    let results = [...this.deals];

    if (filters?.lender) {
      results = results.filter((d) => d.lender.toLowerCase().includes(filters.lender!.toLowerCase()));
    }

    if (filters?.type) {
      results = results.filter((d) => d.type === filters.type);
    }

    if (filters?.maxLTV) {
      results = results.filter((d) => d.maxLTV <= filters.maxLTV!);
    }

    if (filters?.minRate !== undefined) {
      results = results.filter((d) => d.rate >= filters.minRate!);
    }

    if (filters?.maxRate !== undefined) {
      results = results.filter((d) => d.rate <= filters.maxRate!);
    }

    return results;
  }

  async getDealById(id: string): Promise<MortgageDeal | null> {
    return this.deals.find((d) => d.id === id) || null;
  }

  async refreshDeals(): Promise<void> {
    console.log('Mock provider: no refresh needed');
  }
}

/**
 * Moneyfacts API provider (stub for when credentials are available)
 * TODO: Implement when API key is available
 */
export class MoneyfactsMortgageDataProvider implements IMortgageDataProvider {
  name = 'moneyfacts';
  private apiKey = process.env.MONEYFACTS_API_KEY;
  private apiSecret = process.env.MONEYFACTS_API_SECRET;
  private baseUrl = 'https://api.moneyfacts.co.uk/v1';

  async getDeals(filters?: DealsFilter): Promise<MortgageDeal[]> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Moneyfacts credentials not configured');
    }

    // TODO: Implement Moneyfacts API integration
    // Would call this.baseUrl + '/mortgages' with proper auth headers
    throw new Error('Moneyfacts integration not yet implemented');
  }

  async getDealById(id: string): Promise<MortgageDeal | null> {
    throw new Error('Moneyfacts integration not yet implemented');
  }

  async refreshDeals(): Promise<void> {
    throw new Error('Moneyfacts integration not yet implemented');
  }
}

/**
 * Factory function to get the configured provider
 */
export function getMortgageDataProvider(): IMortgageDataProvider {
  const providerName = process.env.MORTGAGE_DATA_PROVIDER || 'mock';

  switch (providerName) {
    case 'moneyfacts':
      return new MoneyfactsMortgageDataProvider();
    case 'mock':
    default:
      return new MockMortgageDataProvider();
  }
}

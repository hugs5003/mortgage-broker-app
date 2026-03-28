import { MortgageDeal, MortgageCalculation } from '@/types';

export class MortgageCalculationService {
  /**
   * Calculate monthly payment (capital + interest)
   */
  static monthlyPayment(principal: number, annualRate: number, termYears: number): number {
    if (annualRate === 0) return principal / (termYears * 12);
    const r = annualRate / 100 / 12;
    const n = termYears * 12;
    return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  /**
   * Calculate interest-only monthly payment
   */
  static monthlyInterestOnly(principal: number, annualRate: number): number {
    return (principal * (annualRate / 100)) / 12;
  }

  /**
   * Calculate Loan-to-Value ratio
   */
  static calculateLTV(propertyValue: number, deposit: number): number {
    if (propertyValue <= 0) return 0;
    return ((propertyValue - deposit) / propertyValue) * 100;
  }

  /**
   * Get LTV band (color coding)
   */
  static ltvBand(ltv: number): { label: string; color: string } {
    if (ltv <= 60) return { label: 'Excellent', color: 'green' };
    if (ltv <= 75) return { label: 'Good', color: 'emerald' };
    if (ltv <= 80) return { label: 'Moderate', color: 'amber' };
    if (ltv <= 90) return { label: 'High', color: 'orange' };
    return { label: 'Very High', color: 'red' };
  }

  /**
   * Calculate total interest over a period
   */
  static totalInterest(
    principal: number,
    annualRate: number,
    termYears: number,
    interestOnly = false
  ): number {
    if (interestOnly) {
      return this.monthlyInterestOnly(principal, annualRate) * termYears * 12;
    }
    const monthly = this.monthlyPayment(principal, annualRate, termYears);
    return monthly * termYears * 12 - principal;
  }

  /**
   * Full cost breakdown including deal period and SVR reversion
   */
  static totalCostBreakdown(
    principal: number,
    dealRate: number,
    dealYears: number,
    svrRate: number,
    termYears: number,
    fees: number,
    interestOnly = false
  ): MortgageCalculation {
    const loanAmount = principal;
    let totalPaid = fees;
    let remainingBalance = principal;
    let monthlyDeal, monthlySVR;

    if (interestOnly) {
      monthlyDeal = this.monthlyInterestOnly(loanAmount, dealRate);
      const dealMonths = dealYears * 12;
      totalPaid += monthlyDeal * dealMonths;
      const svrMonths = (termYears - dealYears) * 12;
      monthlySVR = this.monthlyInterestOnly(loanAmount, svrRate);
      totalPaid += monthlySVR * svrMonths;
      remainingBalance = principal;

      return {
        monthlyDeal,
        monthlySVR,
        totalDealPeriod: monthlyDeal * dealMonths + fees,
        totalSVRPeriod: monthlySVR * svrMonths,
        totalCost: totalPaid,
        totalInterest: totalPaid - fees,
        remainingBalance,
        fees,
      };
    }

    // Repayment mortgage
    monthlyDeal = this.monthlyPayment(loanAmount, dealRate, termYears);
    const dealMonths = Math.min(dealYears * 12, termYears * 12);

    let balance = loanAmount;
    const monthlyRate = dealRate / 100 / 12;
    for (let i = 0; i < dealMonths; i++) {
      const interest = balance * monthlyRate;
      const capitalRepaid = monthlyDeal - interest;
      balance -= capitalRepaid;
    }
    remainingBalance = Math.max(0, balance);

    const dealTotal = monthlyDeal * dealMonths;
    totalPaid += dealTotal;

    const remainingMonths = termYears * 12 - dealMonths;
    if (remainingMonths > 0 && remainingBalance > 0) {
      const remainingTermYears = remainingMonths / 12;
      monthlySVR = this.monthlyPayment(remainingBalance, svrRate, remainingTermYears);
      totalPaid += monthlySVR * remainingMonths;
    } else {
      monthlySVR = 0;
    }

    return {
      monthlyDeal,
      monthlySVR,
      totalDealPeriod: dealTotal + fees,
      totalSVRPeriod: monthlySVR * (termYears * 12 - dealMonths),
      totalCost: totalPaid,
      totalInterest: totalPaid - fees - loanAmount,
      remainingBalance,
      fees,
    };
  }

  /**
   * Stress test - what if rates rise?
   */
  static stressTest(principal: number, termYears: number, rateIncreases = [1, 2, 3]) {
    return rateIncreases.map((increase) => {
      const stressedRate = 5.25 + increase;
      const monthly = this.monthlyPayment(principal, stressedRate, termYears);
      return {
        rateIncrease: increase,
        stressedRate,
        monthlyPayment: monthly,
      };
    });
  }

  /**
   * Overpayment impact calculator
   */
  static overpaymentImpact(
    principal: number,
    annualRate: number,
    termYears: number,
    monthlyOverpayment: number
  ) {
    const normalMonthly = this.monthlyPayment(principal, annualRate, termYears);
    const normalTotalPaid = normalMonthly * termYears * 12;

    const r = annualRate / 100 / 12;
    let balance = principal;
    let months = 0;
    let totalPaid = 0;

    while (balance > 0 && months < termYears * 12) {
      const interest = balance * r;
      const payment = Math.min(normalMonthly + monthlyOverpayment, balance + interest);
      balance = balance + interest - payment;
      totalPaid += payment;
      months++;
      if (balance < 0.01) balance = 0;
    }

    const yearsSaved = termYears - months / 12;
    const interestSaved = normalTotalPaid - totalPaid;

    return {
      normalMonthly,
      newMonthly: normalMonthly + monthlyOverpayment,
      originalTermMonths: termYears * 12,
      newTermMonths: months,
      yearsSaved,
      interestSaved,
      totalWithOverpayment: totalPaid,
      totalWithout: normalTotalPaid,
    };
  }

  /**
   * Calculate stamp duty (England & Northern Ireland)
   */
  static calculateStampDuty(propertyValue: number, buyerType: 'standard' | 'firstTime' | 'additional'): number {
    let bands: Array<{ threshold: number; rate: number }>;

    if (buyerType === 'firstTime' && propertyValue <= 625000) {
      bands = [
        { threshold: 425000, rate: 0 },
        { threshold: 625000, rate: 5 },
      ];
    } else if (buyerType === 'additional') {
      bands = [
        { threshold: 250000, rate: 3 },
        { threshold: 925000, rate: 8 },
        { threshold: 1500000, rate: 13 },
        { threshold: Infinity, rate: 15 },
      ];
    } else {
      bands = [
        { threshold: 250000, rate: 0 },
        { threshold: 925000, rate: 5 },
        { threshold: 1500000, rate: 10 },
        { threshold: Infinity, rate: 12 },
      ];
    }

    let tax = 0;
    let previousThreshold = 0;

    for (const band of bands) {
      if (propertyValue <= previousThreshold) break;
      const taxableAmount = Math.min(propertyValue, band.threshold) - previousThreshold;
      if (taxableAmount > 0) {
        tax += taxableAmount * (band.rate / 100);
      }
      previousThreshold = band.threshold;
    }

    return Math.round(tax);
  }

  /**
   * Affordability check
   */
  static affordabilityCheck(
    grossIncome: number,
    monthlyOutgoings: number,
    loanAmount: number,
    termYears: number
  ) {
    const maxBorrowConservative = grossIncome * 4;
    const maxBorrowStretch = grossIncome * 4.5;

    const stressRate = 7.5;
    const stressMonthly = this.monthlyPayment(loanAmount, stressRate, termYears);

    const monthlyGross = grossIncome / 12;
    const estimatedTax = this.estimateMonthlyTax(grossIncome);
    const monthlyNet = monthlyGross - estimatedTax;

    const available = monthlyNet - monthlyOutgoings;
    const affordableAtStress = stressMonthly < available * 0.45;

    return {
      maxBorrowConservative,
      maxBorrowStretch,
      stressRate,
      stressMonthly,
      monthlyNet,
      monthlyDisposable: available,
      affordableAtStress,
      ratio: available > 0 ? (stressMonthly / available) * 100 : 999,
    };
  }

  /**
   * Rough UK income tax & NI estimator
   */
  static estimateMonthlyTax(annualGross: number): number {
    let tax = 0;
    const personalAllowance = 12570;
    const basicCeiling = 50270;
    const higherCeiling = 125140;

    if (annualGross > personalAllowance) {
      const basicTaxable = Math.min(annualGross, basicCeiling) - personalAllowance;
      tax += basicTaxable * 0.2;
    }
    if (annualGross > basicCeiling) {
      const higherTaxable = Math.min(annualGross, higherCeiling) - basicCeiling;
      tax += higherTaxable * 0.4;
    }
    if (annualGross > higherCeiling) {
      tax += (annualGross - higherCeiling) * 0.45;
    }

    // National Insurance
    const niThreshold = 12570;
    const niUpperLimit = 50270;
    if (annualGross > niThreshold) {
      const niLower = Math.min(annualGross, niUpperLimit) - niThreshold;
      tax += niLower * 0.08;
      if (annualGross > niUpperLimit) {
        tax += (annualGross - niUpperLimit) * 0.02;
      }
    }

    return tax / 12;
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount: number): string {
    return '£' + Math.round(amount).toLocaleString('en-GB');
  }

  static formatCurrencyFull(amount: number): string {
    return (
      '£' +
      amount.toLocaleString('en-GB', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }
}

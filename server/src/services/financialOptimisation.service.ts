import {
  CompoundGrowthResult,
  OverpayVsInvestResult,
  ISAComparisonResult,
  SavingsTimelineResult,
  FirstHomeSavingsResult,
  RetirementProjectionResult,
  RetirementGapResult,
} from '@/types';

export class FinancialOptimisationService {
  /**
   * Compound growth: FV = PV(1+r)^n + PMT[((1+r)^n - 1)/r]
   * Monthly compounding.
   */
  static compoundGrowth(
    principal: number,
    monthlyContribution: number,
    annualReturnRate: number,
    years: number
  ): CompoundGrowthResult {
    const r = annualReturnRate / 100 / 12;
    const yearByYear: CompoundGrowthResult['yearByYear'] = [];

    let balance = principal;
    for (let y = 1; y <= years; y++) {
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + r) + monthlyContribution;
      }
      const contributed = principal + monthlyContribution * y * 12;
      yearByYear.push({
        year: y,
        balance,
        contributed,
        growth: balance - contributed,
      });
    }

    const totalContributed = principal + monthlyContribution * years * 12;
    return {
      finalValue: balance,
      totalContributed,
      totalGrowth: balance - totalContributed,
      yearByYear,
    };
  }

  /**
   * Compound growth with inflation-adjusted real values.
   */
  static compoundGrowthWithInflation(
    principal: number,
    monthlyContribution: number,
    annualReturnRate: number,
    inflationRate: number,
    years: number
  ): CompoundGrowthResult & { realFinalValue: number } {
    const result = this.compoundGrowth(principal, monthlyContribution, annualReturnRate, years);
    const yearByYear = result.yearByYear.map((entry) => ({
      ...entry,
      realValue: entry.balance / Math.pow(1 + inflationRate / 100, entry.year),
    }));
    return {
      ...result,
      realFinalValue: result.finalValue / Math.pow(1 + inflationRate / 100, years),
      yearByYear,
    };
  }

  /**
   * Overpay mortgage vs invest: full month-by-month amortization comparison.
   */
  static overpayVsInvest(
    mortgagePrincipal: number,
    mortgageRate: number,
    mortgageTermYears: number,
    monthlyExtra: number,
    investmentReturnRate: number,
    investmentYears: number
  ): OverpayVsInvestResult {
    const mr = mortgageRate / 100 / 12;
    const totalNormalMonths = mortgageTermYears * 12;

    // Normal monthly payment
    let normalMonthly: number;
    if (mortgageRate === 0) {
      normalMonthly = mortgagePrincipal / totalNormalMonths;
    } else {
      normalMonthly =
        (mortgagePrincipal * mr * Math.pow(1 + mr, totalNormalMonths)) /
        (Math.pow(1 + mr, totalNormalMonths) - 1);
    }

    const totalPaidWithout = normalMonthly * totalNormalMonths;

    // With overpayment
    let balance = mortgagePrincipal;
    let monthsWithOverpay = 0;
    let totalPaidWithOverpay = 0;
    while (balance > 0.01 && monthsWithOverpay < totalNormalMonths) {
      const interest = balance * mr;
      const payment = Math.min(normalMonthly + monthlyExtra, balance + interest);
      balance = balance + interest - payment;
      totalPaidWithOverpay += payment;
      monthsWithOverpay++;
      if (balance < 0.01) balance = 0;
    }

    const interestWithout = totalPaidWithout - mortgagePrincipal;
    const interestWithOverpay = totalPaidWithOverpay - mortgagePrincipal;
    const interestSaved = interestWithout - interestWithOverpay;
    const yearsSaved = (totalNormalMonths - monthsWithOverpay) / 12;

    // Investment calculation
    const investResult = this.compoundGrowth(0, monthlyExtra, investmentReturnRate, investmentYears);

    const netBenefit = investResult.totalGrowth - interestSaved;

    // Break-even rate via binary search
    const breakEvenRate = this.findBreakEvenRate(monthlyExtra, investmentYears, interestSaved);

    let verdict: string;
    if (netBenefit > 0) {
      verdict = `Investing the extra £${Math.round(monthlyExtra)}/month is projected to beat overpaying the mortgage by £${Math.round(netBenefit).toLocaleString('en-GB')} over ${investmentYears} years.`;
    } else if (netBenefit < 0) {
      verdict = `Overpaying the mortgage saves £${Math.round(Math.abs(netBenefit)).toLocaleString('en-GB')} more than investing over ${investmentYears} years.`;
    } else {
      verdict = 'Overpaying and investing produce roughly the same outcome.';
    }

    return {
      overpayment: {
        interestSaved,
        yearsSaved,
        totalPaidWithOverpay,
        totalPaidWithout,
      },
      investment: {
        finalValue: investResult.finalValue,
        totalContributed: investResult.totalContributed,
        totalGrowth: investResult.totalGrowth,
      },
      netBenefit,
      breakEvenRate,
      verdict,
    };
  }

  private static findBreakEvenRate(
    monthlyExtra: number,
    investmentYears: number,
    interestSaved: number
  ): number {
    let low = 0;
    let high = 50;
    for (let i = 0; i < 100; i++) {
      const mid = (low + high) / 2;
      const investResult = this.compoundGrowth(0, monthlyExtra, mid, investmentYears);
      if (Math.abs(investResult.totalGrowth - interestSaved) < 0.01) break;
      if (investResult.totalGrowth < interestSaved) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return (low + high) / 2;
  }

  /**
   * ISA vs non-ISA comparison (simplified UK model).
   */
  static isaComparison(
    amount: number,
    annualReturn: number,
    years: number,
    isISA: boolean
  ): ISAComparisonResult {
    const r = annualReturn / 100 / 12;
    let balance = amount;
    for (let m = 0; m < years * 12; m++) {
      balance = balance * (1 + r);
    }
    const grossReturn = balance - amount;

    if (isISA) {
      return { grossReturn, taxPaid: 0, netReturn: grossReturn };
    }

    // Non-ISA: 20% basic rate on gains above £1,000 personal savings allowance
    const personalAllowance = 1000;
    const taxableGain = Math.max(0, grossReturn - personalAllowance);
    const taxPaid = taxableGain * 0.2;

    return { grossReturn, taxPaid, netReturn: grossReturn - taxPaid };
  }

  /**
   * Savings timeline: month-by-month until target is reached.
   */
  static savingsTimeline(
    targetAmount: number,
    currentSavings: number,
    monthlySaving: number,
    annualReturnRate: number
  ): SavingsTimelineResult {
    const r = annualReturnRate / 100 / 12;
    let balance = currentSavings;
    let months = 0;
    const monthByMonth: SavingsTimelineResult['monthByMonth'] = [];
    const maxMonths = 12 * 100;

    while (balance < targetAmount && months < maxMonths) {
      balance = r > 0 ? balance * (1 + r) + monthlySaving : balance + monthlySaving;
      months++;
      monthByMonth.push({ month: months, balance });
    }

    const totalContributed = currentSavings + monthlySaving * months;
    return {
      monthsToTarget: months,
      yearsToTarget: months / 12,
      totalContributed,
      interestEarned: balance - totalContributed,
      monthByMonth,
    };
  }

  /**
   * First home savings with optional Lifetime ISA bonus.
   */
  static firstHomeSavings(
    targetPropertyValue: number,
    targetDepositPercent: number,
    currentSavings: number,
    monthlySaving: number,
    annualReturnRate: number,
    lifetimeISABonus: boolean
  ): FirstHomeSavingsResult {
    const targetDeposit = targetPropertyValue * (targetDepositPercent / 100);
    let timeline = this.savingsTimeline(targetDeposit, currentSavings, monthlySaving, annualReturnRate);

    let lisaBonusTotal = 0;
    if (lifetimeISABonus) {
      const yearsOfSaving = Math.ceil(timeline.monthsToTarget / 12);
      const annualContribution = Math.min(monthlySaving * 12, 4000);
      lisaBonusTotal = annualContribution * 0.25 * yearsOfSaving;
      const adjustedTarget = Math.max(0, targetDeposit - lisaBonusTotal);
      if (adjustedTarget < targetDeposit) {
        timeline = this.savingsTimeline(adjustedTarget, currentSavings, monthlySaving, annualReturnRate);
      }
    }

    return {
      targetDeposit,
      monthsToTarget: timeline.monthsToTarget,
      yearsToTarget: timeline.yearsToTarget,
      withLISABonus: lisaBonusTotal,
      timeline,
    };
  }

  /**
   * Retirement number: the lump sum needed to sustain desired income.
   */
  static retirementNumber(
    desiredAnnualIncome: number,
    expectedReturnInRetirement: number,
    inflationRate: number
  ): { lumpSumNeeded: number } {
    const realReturn = (expectedReturnInRetirement - inflationRate) / 100;
    const lumpSumNeeded = realReturn <= 0
      ? desiredAnnualIncome * 25
      : desiredAnnualIncome / realReturn;
    return { lumpSumNeeded };
  }

  /**
   * Retirement projection: year-by-year pension pot growth.
   */
  static retirementProjection(
    currentAge: number,
    retirementAge: number,
    currentPension: number,
    monthlyContribution: number,
    employerMatch: number,
    annualReturnRate: number,
    inflationRate: number
  ): RetirementProjectionResult {
    const yearsToRetirement = retirementAge - currentAge;
    if (yearsToRetirement <= 0) {
      return {
        projectedPot: currentPension,
        projectedRealPot: currentPension,
        annualIncomeAt4Pct: currentPension * 0.04,
        monthlyIncomeAt4Pct: (currentPension * 0.04) / 12,
        shortfallVsTarget: 0,
        yearByYear: [],
      };
    }

    const totalMonthlyContribution = monthlyContribution + employerMatch;
    const r = annualReturnRate / 100 / 12;
    let balance = currentPension;
    const yearByYear: RetirementProjectionResult['yearByYear'] = [];

    for (let y = 1; y <= yearsToRetirement; y++) {
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + r) + totalMonthlyContribution;
      }
      const contributed = currentPension + totalMonthlyContribution * y * 12;
      const realValue = balance / Math.pow(1 + inflationRate / 100, y);
      yearByYear.push({
        year: y,
        age: currentAge + y,
        balance,
        contributed,
        growth: balance - contributed,
        realValue,
      });
    }

    const projectedPot = balance;
    const projectedRealPot = balance / Math.pow(1 + inflationRate / 100, yearsToRetirement);

    return {
      projectedPot,
      projectedRealPot,
      annualIncomeAt4Pct: projectedPot * 0.04,
      monthlyIncomeAt4Pct: (projectedPot * 0.04) / 12,
      shortfallVsTarget: 0,
      yearByYear,
    };
  }

  /**
   * Retirement gap: shortfall analysis and extra saving needed.
   */
  static retirementGap(
    desiredAnnualIncome: number,
    projectedPot: number,
    expectedReturnInRetirement: number
  ): RetirementGapResult {
    const annualFromPot = projectedPot * (expectedReturnInRetirement / 100);
    const annualShortfall = Math.max(0, desiredAnnualIncome - annualFromPot);

    const yearsOfIncomeAvailable = desiredAnnualIncome <= 0
      ? Infinity
      : projectedPot / desiredAnnualIncome;

    let monthlyExtraSavingNeeded = 0;
    if (annualShortfall > 0) {
      const effectiveRate = expectedReturnInRetirement / 100 || 0.04;
      const additionalPotNeeded = annualShortfall / effectiveRate;
      const r = expectedReturnInRetirement / 100 / 12;
      const n = 30 * 12;
      monthlyExtraSavingNeeded = r > 0
        ? (additionalPotNeeded * r) / (Math.pow(1 + r, n) - 1)
        : additionalPotNeeded / n;
    }

    return {
      annualShortfall,
      monthlyExtraSavingNeeded,
      yearsOfIncomeAvailable,
    };
  }
}

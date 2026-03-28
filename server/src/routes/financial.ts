import express, { Request, Response } from 'express';
import { FinancialOptimisationService } from '@/services/financialOptimisation.service';

export const financialRouter = express.Router();

/**
 * POST /api/financial/compound-growth
 */
financialRouter.post('/compound-growth', (req: Request, res: Response) => {
  try {
    const { principal, monthlyContribution, annualReturnRate, years, inflationRate } = req.body;

    if (principal == null || monthlyContribution == null || annualReturnRate == null || years == null) {
      return res.status(400).json({ error: 'principal, monthlyContribution, annualReturnRate, and years are required' });
    }

    if (inflationRate != null) {
      const result = FinancialOptimisationService.compoundGrowthWithInflation(
        principal, monthlyContribution, annualReturnRate, inflationRate, years
      );
      return res.json(result);
    }

    const result = FinancialOptimisationService.compoundGrowth(
      principal, monthlyContribution, annualReturnRate, years
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/financial/overpay-vs-invest
 */
financialRouter.post('/overpay-vs-invest', (req: Request, res: Response) => {
  try {
    const {
      mortgagePrincipal, mortgageRate, mortgageTermYears,
      monthlyExtra, investmentReturnRate, investmentYears,
    } = req.body;

    if (mortgagePrincipal == null || mortgageRate == null || mortgageTermYears == null ||
        monthlyExtra == null || investmentReturnRate == null || investmentYears == null) {
      return res.status(400).json({
        error: 'mortgagePrincipal, mortgageRate, mortgageTermYears, monthlyExtra, investmentReturnRate, and investmentYears are required',
      });
    }

    const result = FinancialOptimisationService.overpayVsInvest(
      mortgagePrincipal, mortgageRate, mortgageTermYears,
      monthlyExtra, investmentReturnRate, investmentYears
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/financial/isa-comparison
 */
financialRouter.post('/isa-comparison', (req: Request, res: Response) => {
  try {
    const { amount, annualReturn, years, isISA } = req.body;

    if (amount == null || annualReturn == null || years == null || isISA == null) {
      return res.status(400).json({ error: 'amount, annualReturn, years, and isISA are required' });
    }

    const result = FinancialOptimisationService.isaComparison(amount, annualReturn, years, isISA);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/financial/savings-timeline
 */
financialRouter.post('/savings-timeline', (req: Request, res: Response) => {
  try {
    const { targetAmount, currentSavings, monthlySaving, annualReturnRate } = req.body;

    if (targetAmount == null || currentSavings == null || monthlySaving == null || annualReturnRate == null) {
      return res.status(400).json({ error: 'targetAmount, currentSavings, monthlySaving, and annualReturnRate are required' });
    }

    const result = FinancialOptimisationService.savingsTimeline(
      targetAmount, currentSavings, monthlySaving, annualReturnRate
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/financial/first-home
 */
financialRouter.post('/first-home', (req: Request, res: Response) => {
  try {
    const {
      targetPropertyValue, targetDepositPercent, currentSavings,
      monthlySaving, annualReturnRate, lifetimeISABonus,
    } = req.body;

    if (targetPropertyValue == null || targetDepositPercent == null || currentSavings == null ||
        monthlySaving == null || annualReturnRate == null) {
      return res.status(400).json({
        error: 'targetPropertyValue, targetDepositPercent, currentSavings, monthlySaving, and annualReturnRate are required',
      });
    }

    const result = FinancialOptimisationService.firstHomeSavings(
      targetPropertyValue, targetDepositPercent, currentSavings,
      monthlySaving, annualReturnRate, lifetimeISABonus ?? false
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/financial/retirement-projection
 */
financialRouter.post('/retirement-projection', (req: Request, res: Response) => {
  try {
    const {
      currentAge, retirementAge, currentPension, monthlyContribution,
      employerMatch, annualReturnRate, inflationRate,
    } = req.body;

    if (currentAge == null || retirementAge == null || currentPension == null ||
        monthlyContribution == null || employerMatch == null || annualReturnRate == null || inflationRate == null) {
      return res.status(400).json({
        error: 'currentAge, retirementAge, currentPension, monthlyContribution, employerMatch, annualReturnRate, and inflationRate are required',
      });
    }

    const result = FinancialOptimisationService.retirementProjection(
      currentAge, retirementAge, currentPension, monthlyContribution,
      employerMatch, annualReturnRate, inflationRate
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/financial/retirement-gap
 */
financialRouter.post('/retirement-gap', (req: Request, res: Response) => {
  try {
    const { desiredAnnualIncome, projectedPot, expectedReturnInRetirement } = req.body;

    if (desiredAnnualIncome == null || projectedPot == null || expectedReturnInRetirement == null) {
      return res.status(400).json({
        error: 'desiredAnnualIncome, projectedPot, and expectedReturnInRetirement are required',
      });
    }

    const result = FinancialOptimisationService.retirementGap(
      desiredAnnualIncome, projectedPot, expectedReturnInRetirement
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

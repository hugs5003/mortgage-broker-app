import express, { Response } from 'express';
import { AuthenticatedRequest, authenticateToken } from '@/middleware/auth';
import { getMortgageDataProvider } from '@/services/mortgageDataProvider';
import { MortgageCalculationService } from '@/services/mortgageCalculation.service';
import pool from '@/database/connection';
import { v4 as uuidv4 } from 'uuid';
import { GetDealsRequest, CreateScenarioRequest, UserScenario } from '@/types';

export const dealsRouter = express.Router();
const provider = getMortgageDataProvider();

/**
 * POST /deals/calculate
 * Get ranked deals based on user profile
 */
dealsRouter.post('/calculate', async (req, res) => {
  try {
    const body: GetDealsRequest = req.body;
    const {
      propertyValue,
      deposit,
      termYears,
      grossIncome,
      priorities = ['lowestMonthly'],
      riskTolerance = 50,
    } = body;

    // Validation
    if (!propertyValue || !deposit || !termYears || !grossIncome) {
      return res.status(400).json({
        error: 'propertyValue, deposit, termYears, and grossIncome are required',
      });
    }

    const ltv = MortgageCalculationService.calculateLTV(propertyValue, deposit);
    const loanAmount = propertyValue - deposit;

    // Get eligible deals
    let deals = await provider.getDeals({ maxLTV: ltv });

    // Score and rank deals
    const scored = deals.map((deal) => {
      const totalFees = deal.arrangementFee + deal.valuationFee + deal.legalFees;
      const calculation = MortgageCalculationService.totalCostBreakdown(
        loanAmount,
        deal.rate,
        deal.fixedPeriod || 2,
        deal.svr,
        termYears,
        totalFees,
        false
      );

      // Simple scoring system
      let score = 100;
      if (priorities.includes('lowestMonthly')) {
        score -= calculation.monthlyDeal / 20;
      }
      if (priorities.includes('certainty') && deal.type.includes('fixed')) {
        score += 25;
      }

      return {
        deal,
        calculation,
        score,
        totalFees,
      };
    });

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Calculate additional metrics
    const ltvBand = MortgageCalculationService.ltvBand(ltv);
    const stampDuty = MortgageCalculationService.calculateStampDuty(
      propertyValue,
      body.purchaseType === 'firstTime' ? 'firstTime' : 'standard'
    );
    const affordability = MortgageCalculationService.affordabilityCheck(
      grossIncome,
      body.monthlyOutgoings || 0,
      loanAmount,
      termYears
    );
    const stressTest = MortgageCalculationService.stressTest(loanAmount, termYears);

    res.json({
      deals: scored.slice(0, 10).map((s) => ({
        deal: s.deal,
        monthlyPayment: s.calculation.monthlyDeal,
        totalCost: s.calculation.totalCost,
        totalInterest: s.calculation.totalInterest,
        fees: s.totalFees,
        score: s.score,
      })),
      summary: {
        propertyValue,
        deposit,
        loanAmount,
        ltv: ltv.toFixed(1),
        ltvBand,
        stampDuty,
        affordability,
        stressTest,
      },
      dealsCount: deals.length,
    });
  } catch (err: any) {
    console.error('Calculate error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /deals
 * Get all available deals (with optional filters)
 */
dealsRouter.get('/', async (req, res) => {
  try {
    const deals = await provider.getDeals({
      lender: req.query.lender as string,
      type: req.query.type as any,
      maxLTV: req.query.maxLTV ? Number(req.query.maxLTV) : undefined,
    });

    res.json(deals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /deals/:id
 * Get a single deal by ID
 */
dealsRouter.get('/:id', async (req, res) => {
  try {
    const deal = await provider.getDealById(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json(deal);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /deals/scenarios
 * Save a user scenario
 */
dealsRouter.post('/scenarios', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const body: CreateScenarioRequest = req.body;
    const id = uuidv4();

    const result = await pool.query(
      `INSERT INTO user_scenarios (
        id, user_id, name, property_value, deposit, purchase_type,
        gross_income, term_years, priorities
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        id,
        req.user.id,
        body.name,
        body.propertyValue,
        body.deposit,
        body.purchaseType,
        body.grossIncome,
        body.termYears,
        JSON.stringify(body.priorities || []),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /deals/scenarios
 * Get user's saved scenarios
 */
dealsRouter.get('/scenarios', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await pool.query(
      'SELECT * FROM user_scenarios WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /deals/scenarios/:id
 * Delete a scenario
 */
dealsRouter.delete('/scenarios/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await pool.query(
      'DELETE FROM user_scenarios WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    res.json({ message: 'Scenario deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

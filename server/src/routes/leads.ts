import express, { Request, Response } from 'express';
import pool from '@/database/connection';

export const leadsRouter = express.Router();

/**
 * POST /leads — public, no auth required.
 * Captures an email address with explicit marketing consent.
 */
leadsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { email, consent, source, utm_source, utm_medium, utm_campaign, purchase_type } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    // Basic email format validation — prevents obviously invalid entries
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!consent) {
      return res.status(400).json({ error: 'Marketing consent is required to save your results' });
    }

    await pool.query(
      `INSERT INTO leads (email, consent, consent_at, source, utm_source, utm_medium, utm_campaign, purchase_type)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5, $6, $7)
       ON CONFLICT DO NOTHING`,
      [
        email.toLowerCase().trim(),
        true,
        source || 'results_page',
        utm_source || null,
        utm_medium || null,
        utm_campaign || null,
        purchase_type || null,
      ]
    );

    res.status(201).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save email address' });
  }
});

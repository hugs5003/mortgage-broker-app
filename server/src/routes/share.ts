import express, { Request, Response } from 'express';
import pool from '@/database/connection';
import { BrokerService } from '@/services/broker.service';

export const shareRouter = express.Router();

/**
 * GET /share/:token — public endpoint, returns full session data for consumer view
 */
shareRouter.get('/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token || token.length !== 64) {
      return res.status(400).json({ error: 'Invalid share token' });
    }

    const data = await BrokerService.getSessionByShareToken(token);
    res.json(data);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * POST /share/:token/override — save consumer's what-if override (public, no auth)
 */
shareRouter.post('/:token/override', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { overrideData } = req.body;

    if (!token || token.length !== 64) {
      return res.status(400).json({ error: 'Invalid share token' });
    }

    if (!overrideData || typeof overrideData !== 'object') {
      return res.status(400).json({ error: 'overrideData object is required' });
    }

    // Look up the share link by token to get its ID
    const linkResult = await pool.query(
      `SELECT id FROM share_links
       WHERE token = $1 AND is_active = true AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
      [token]
    );

    if (linkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Share link not found or expired' });
    }

    const override = await BrokerService.saveConsumerOverride(
      linkResult.rows[0].id,
      overrideData
    );
    res.status(201).json(override);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

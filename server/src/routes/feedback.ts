import express, { Request, Response } from 'express';
import pool from '@/database/connection';

export const feedbackRouter = express.Router();

/**
 * POST /feedback — public, no auth required.
 * Captures a 1–5 star rating with optional comment and email.
 */
feedbackRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { rating, comment, email, purchase_type, utm_source, utm_campaign } = req.body;

    const parsedRating = parseInt(rating, 10);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
    }

    // Validate optional email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    await pool.query(
      `INSERT INTO feedback (rating, comment, email, purchase_type, utm_source, utm_campaign)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        parsedRating,
        comment ? String(comment).slice(0, 2000) : null,
        email ? email.toLowerCase().trim() : null,
        purchase_type || null,
        utm_source || null,
        utm_campaign || null,
      ]
    );

    res.status(201).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

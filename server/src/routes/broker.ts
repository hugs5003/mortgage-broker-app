import express, { Response } from 'express';
import { AuthenticatedRequest, authenticateToken, requireBroker } from '@/middleware/auth';
import { BrokerService } from '@/services/broker.service';

export const brokerRouter = express.Router();

// All broker routes require authentication + broker role
brokerRouter.use(authenticateToken, requireBroker);

/**
 * POST /broker/sessions — create a new broker session
 */
brokerRouter.post('/sessions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = await BrokerService.createSession(req.user.id, req.body);
    res.status(201).json(session);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * GET /broker/sessions — list broker's sessions
 */
brokerRouter.get('/sessions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const sessions = await BrokerService.getSessions(req.user.id);
    res.json(sessions);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * GET /broker/sessions/:id — get single session with highlights
 */
brokerRouter.get('/sessions/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await BrokerService.getSession(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * PUT /broker/sessions/:id — update session
 */
brokerRouter.put('/sessions/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = await BrokerService.updateSession(req.params.id, req.user.id, req.body);
    res.json(session);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * POST /broker/sessions/:id/publish — publish session + generate share link
 */
brokerRouter.post('/sessions/:id/publish', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await BrokerService.publishSession(req.params.id, req.user.id);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * POST /broker/sessions/:id/highlights — add deal highlight
 */
brokerRouter.post('/sessions/:id/highlights', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dealId, highlightType, comment, displayOrder } = req.body;

    if (!dealId) {
      return res.status(400).json({ error: 'dealId is required' });
    }

    const highlight = await BrokerService.addDealHighlight(
      req.params.id,
      dealId,
      highlightType || 'recommended',
      comment || null,
      displayOrder || 0
    );
    res.status(201).json(highlight);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * DELETE /broker/sessions/:id/highlights/:dealId — remove highlight
 */
brokerRouter.delete('/sessions/:id/highlights/:dealId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await BrokerService.removeDealHighlight(req.params.id, req.params.dealId);
    res.json({ message: 'Highlight removed' });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

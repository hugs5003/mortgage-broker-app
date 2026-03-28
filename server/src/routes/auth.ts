import express, { Response } from 'express';
import { UserService } from '@/services/user.service';
import { AuthenticatedRequest, authenticateToken } from '@/middleware/auth';

export const authRouter = express.Router();

/**
 * POST /auth/register
 */
authRouter.post('/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password required' });
    }

    const result = await UserService.register(email, name, password);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * POST /auth/login
 */
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await UserService.login(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * GET /auth/me
 */
authRouter.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await UserService.getUserById(req.user.id);
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /auth/profile
 */
authRouter.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, email } = req.body;
    const updated = await UserService.updateUser(req.user.id, { name, email });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

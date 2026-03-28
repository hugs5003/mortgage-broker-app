import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initializeDatabase, runMigrations } from '@/database/connection';
import { errorHandler, requestLogger } from '@/middleware/auth';
import { authRouter } from '@/routes/auth';
import { dealsRouter } from '@/routes/deals';
import { financialRouter } from '@/routes/financial';
import { brokerRouter } from '@/routes/broker';
import { shareRouter } from '@/routes/share';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// ===== Middleware =====
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests, please try again later',
});
app.use(limiter);

// ===== Routes =====
app.use('/api/auth', authRouter);
app.use('/api/deals', dealsRouter);
app.use('/api/financial', financialRouter);
app.use('/api/broker', brokerRouter);
app.use('/api/share', shareRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API docs
app.get('/api', (req, res) => {
  res.json({
    api: 'Mortgage Broker API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login with email & password',
        'GET /api/auth/me': 'Get current user profile',
        'PUT /api/auth/profile': 'Update user profile',
      },
      deals: {
        'GET /api/deals': 'Get all available mortgage deals',
        'GET /api/deals/:id': 'Get a specific deal',
        'POST /api/deals/calculate': 'Calculate and rank deals based on user profile',
        'POST /api/deals/scenarios': 'Save a mortgage scenario',
        'GET /api/deals/scenarios': 'Get user saved scenarios',
        'DELETE /api/deals/scenarios/:id': 'Delete a scenario',
      },
      financial: {
        'POST /api/financial/compound-growth': 'Compound growth projection',
        'POST /api/financial/overpay-vs-invest': 'Overpay mortgage vs invest comparison',
        'POST /api/financial/isa-comparison': 'ISA vs non-ISA tax comparison',
        'POST /api/financial/savings-timeline': 'Savings goal timeline',
        'POST /api/financial/first-home': 'First home savings with optional LISA',
        'POST /api/financial/retirement-projection': 'Retirement pot projection',
        'POST /api/financial/retirement-gap': 'Retirement income gap analysis',
      },
      broker: {
        'POST /api/broker/sessions': 'Create a broker session (broker only)',
        'GET /api/broker/sessions': 'List broker sessions (broker only)',
        'GET /api/broker/sessions/:id': 'Get a broker session (broker only)',
        'PUT /api/broker/sessions/:id': 'Update a broker session (broker only)',
        'POST /api/broker/sessions/:id/publish': 'Publish session + generate share link (broker only)',
        'POST /api/broker/sessions/:id/highlights': 'Add deal highlight (broker only)',
        'DELETE /api/broker/sessions/:id/highlights/:dealId': 'Remove deal highlight (broker only)',
      },
      share: {
        'GET /api/share/:token': 'Get shared session data (public)',
        'POST /api/share/:token/override': 'Save consumer what-if override (public)',
      },
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling
app.use(errorHandler);

// ===== Startup =====
async function start() {
  try {
    console.log('🌍 Initializing database...');
    await initializeDatabase();

    console.log('📦 Running migrations...');
    await runMigrations();

    app.listen(port, () => {
      console.log(`✅ Mortgage Broker API running on http://localhost:${port}`);
      console.log(`📚 API docs: http://localhost:${port}/api`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();

export default app;

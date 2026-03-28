import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initializeDatabase, runMigrations } from '@/database/connection';
import { errorHandler, requestLogger } from '@/middleware/auth';
import { authRouter } from '@/routes/auth';
import { dealsRouter } from '@/routes/deals';

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

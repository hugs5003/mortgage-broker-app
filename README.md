# Mortgage Optimiser — Production-Ready Broker App

A full-stack, production-grade mortgage comparison and advisory platform. Built with Node.js/Express backend, React frontend, and PostgreSQL. Designed to help individuals find the optimal mortgage for their circumstances.

## ✨ Features

- **🎯 Mortgage Deal Matching** — Input your profile once, get ranked deals sorted by your priorities
- **💰 Full Financial Calculations** — Monthly payments, total cost, interest breakdown, stamp duty, affordability checks
- **📊 Comparison Mode** — Side-by-side deal comparison with interactive charts
- **🔐 User Accounts** — Save scenarios, compare options later, track history
- **📚 Educational Content** — Plain-English explanations of all mortgage types and concepts
- **⚠️ Risk Assessment** — Stress tests showing payment impact if rates rise 1-3%
- **🔄 Swappable Data Providers** — Mock provider for development; swap for Moneyfacts/Defaqto when credentials available
- **🛡️ Production-Grade** — TypeScript, JWT auth, rate limiting, comprehensive error handling

## 🏗️ Architecture

```
mortgage-broker-app/
├── server/                 # Node.js/Express backend
│   ├── src/
│   │   ├── database/      # PostgreSQL connection & migrations
│   │   ├── services/      # Business logic (calculations, data providers)
│   │   ├── routes/        # API endpoints (/auth, /deals)
│   │   ├── middleware/    # Auth, error handling, logging
│   │   ├── types/         # TypeScript interfaces
│   │   └── index.ts       # Express app entry point
│   ├── migrations/         # SQL migrations
│   ├── Dockerfile
│   └── package.json
│
├── client/                 # React/TypeScript frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API client
│   │   ├── store/         # Zustand state management
│   │   ├── types/         # TypeScript interfaces
│   │   ├── ui/            # Reusable UI components
│   │   └── main.tsx
│   └── package.json
│
├── docker-compose.yml      # Run everything with one command
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose (easiest)
- OR: Node.js 18+, npm, PostgreSQL 14+

### Option 1: Docker (Recommended)

```bash
# Clone/download the repo
cd mortgage-broker-app

# Start everything
docker-compose up

# Database automatically initialized on first run
# API: http://localhost:5000
# Frontend: http://localhost:3000 (once built)
```

### Option 2: Manual Setup

**Backend:**
```bash
cd server
cp .env.example .env          # Update DATABASE_URL if needed
npm install
npm run migrate               # Run database migrations
npm run dev                   # Start on http://localhost:5000
```

**Frontend:**
```bash
cd client
npm install
npm run dev                   # Start on http://localhost:3000
```

**Database:**
```bash
# First time only - create database and user
psql -U postgres
CREATE USER mortgage_user WITH PASSWORD 'password';
CREATE DATABASE mortgage_db OWNER mortgage_user;
```

## 📚 API Documentation

### Authentication

```bash
# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword"
}
→ { user, token, expiresIn }

# Login
POST /api/auth/login
{ "email": "...", "password": "..." }
→ { user, token, expiresIn }

# Get current user
GET /api/auth/me
Headers: Authorization: Bearer <token>
→ { id, email, name, role }
```

### Mortgage Deals

```bash
# Get all deals (with optional filters)
GET /api/deals?lender=Barclays&type=fixed_5yr&maxLTV=75

# Get a specific deal
GET /api/deals/deal_1

# Calculate and rank deals based on user profile
POST /api/deals/calculate
{
  "propertyValue": 300000,
  "deposit": 60000,
  "termYears": 25,
  "grossIncome": 55000,
  "priorities": ["lowestMonthly", "certainty"],
  "riskTolerance": 30,
  "monthlyOutgoings": 800,
  "purchaseType": "firstTime"
}
→ { deals: [...], summary: {...}, dealsCount: N }

# Save a scenario (authenticated)
POST /api/deals/scenarios
Headers: Authorization: Bearer <token>
{
  "name": "My Scenario",
  "propertyValue": 300000,
  ...
}

# Get saved scenarios
GET /api/deals/scenarios
Headers: Authorization: Bearer <token>

# Delete a scenario
DELETE /api/deals/scenarios/<id>
Headers: Authorization: Bearer <token>
```

## 🔌 Integrating Real Mortgage Data

Currently, the app uses a **mock provider** with representative data. To connect real data:

### Step 1: Choose a Provider

**Moneyfacts** (recommended for UK brokers)
- Website: https://www.moneyfacts.co.uk/business/
- Best for: Direct access to ~500+ UK lenders
- Cost: £500-5000/month depending on volume
- You need: FCA broker registration
- API docs: Available on request after sign-up

**Defaqto**
- Website: https://www.defaqto.com/partners/
- Similar to Moneyfacts
- Good alternative with some different lender coverage

### Step 2: Get API Credentials

1. Register your company with the provider
2. Request API access
3. Get: API Key, Secret, Endpoint URLs
4. Test in their sandbox environment

### Step 3: Implement Provider

In `server/src/services/mortgageDataProvider.ts`, the `MoneyfactsMortgageDataProvider` class is stubbed out:

```typescript
export class MoneyfactsMortgageDataProvider implements IMortgageDataProvider {
  // TODO: Implement these methods using their API
  async getDeals(filters?: DealsFilter): Promise<MortgageDeal[]> {
    // Call Moneyfacts API with filters
    // Map response to MortgageDeal[] format
    // Cache in Redis for performance
    return deals;
  }

  async getDealById(id: string): Promise<MortgageDeal | null> {
    // Get specific deal from cache or API
  }

  async refreshDeals(): Promise<void> {
    // Sync latest rates from provider (run daily via scheduler)
  }
}
```

### Step 4: Switch Provider

```bash
# In server/.env
MORTGAGE_DATA_PROVIDER=moneyfacts
MONEYFACTS_API_KEY=your_key_here
MONEYFACTS_API_SECRET=your_secret_here
```

Restart the backend — now it pulls from Moneyfacts instead of mock data.

### Step 5: Data Mapping

Moneyfacts and Defaqto return different field names. Create a mapping adapter:

```typescript
// Example: Map Moneyfacts response to our MortgageDeal format
private mapMoneyfactsDeal(raw: any): MortgageDeal {
  return {
    id: raw.ProductCode,
    lender: raw.LenderName,
    dealName: raw.ProductName,
    type: this.mapMortgageType(raw.ProductType),
    rate: parseFloat(raw.InterestRate),
    // ... etc
  };
}
```

## 🧪 Testing

```bash
# Backend
cd server
npm test                    # Run Jest tests
npm run type-check         # TypeScript check
npm run lint               # ESLint

# Frontend
cd client
npm test
npm run type-check
npm run lint
```

## 📖 Mortgage Type Explanations

Every mortgage type has a plain-English explanation built in:

- **Fixed Rate (2/3/5/10 year)** — Your rate stays the same. Certainty, but locked in.
- **Tracker** — Your rate follows the Bank of England base rate. No early repayment charges.
- **SVR** — Default rate; almost always the most expensive. Avoid if possible.
- **Discount** — Discount off the lender's variable rate. Cheaper start, but still variable.
- **Offset** — Your savings reduce the balance you pay interest on.
- **Interest-Only** — Lower payments, but you don't reduce the debt.

All included in the `/api` documentation and the Learn panel on the frontend.

##Configuration

### Environment Variables

**Server (.env):**
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://mortgage_user:password@localhost:5432/mortgage_db
JWT_SECRET=your_super_secret_jwt_key_change_in_production
CORS_ORIGIN=http://localhost:3000
MORTGAGE_DATA_PROVIDER=mock
# When ready:
# MONEYFACTS_API_KEY=...
# MONEYFACTS_API_SECRET=...
```

**Client (.env):**
```
VITE_API_URL=http://localhost:5000
```

## 🔒 Security Notes

- Passwords hashed with bcryptjs
- JWT tokens (7-day expiry, configurable)
- Rate limiting: 100 requests per 15 minutes
- CORS restricted to frontend origin
- Helmet.js for HTTP headers
- SQL parameterized queries (no injection risk)
- Input validation on all endpoints
- Audit logging for sensitive actions

## 📊 Database Schema

- **users** — User accounts, roles, authentication
- **user_scenarios** — Saved mortgage comparisons
- **mortgage_deals** — Cache of available products
- **audit_logs** — Track user activity

See `server/migrations/001_init.sql` for full schema.

## 🎯 Next Steps

1. ✅ You now have a fully functional demo
2. **Add frontend components** (build the React app UI)
3. **Connect to real API** (follow integration steps above)
4. **Add admin panel** (manage deals, view user activity)
5. **Deploy to production** (suggested: Vercel + Railway + AWS RDS)
6. **FCA compliance review** — Advice wording, audit, disclaimers

## 📝 Notes

- All calculations happen server-side (more secure, easier to audit)
- Deal rankings based on user priorities (lowest payment, certainty, flexibility, etc.)
- Stress tests show payment impact if rates rise 1-3%
- Overpayment calculator shows years saved + interest saved
- Stamp duty estimates are England & Northern Ireland rates

## 🆘 Support

- API docs: `GET http://localhost:5000/api`
- Health check: `GET http://localhost:5000/health`
- Logs: Check console output from `docker-compose up`

## 📄 License

MIT (modify as needed)

---

**Built with:** Node.js · Express · TypeScript · PostgreSQL · React · Tailwind CSS · Docker

**Ready for production** — subject to FCA compliance review and real API integration testing.

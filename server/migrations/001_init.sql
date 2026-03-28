-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'broker')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- User scenarios (saved mortgage comparisons)
CREATE TABLE IF NOT EXISTS user_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  property_value DECIMAL(15,2) NOT NULL,
  deposit DECIMAL(15,2) NOT NULL,
  purchase_type VARCHAR(50) NOT NULL,
  property_type VARCHAR(100),
  leasehold BOOLEAN DEFAULT FALSE,
  gross_income DECIMAL(15,2) NOT NULL,
  joint_application BOOLEAN DEFAULT FALSE,
  second_income DECIMAL(15,2) DEFAULT 0,
  employment_status VARCHAR(100),
  monthly_outgoings DECIMAL(15,2) DEFAULT 0,
  credit_profile VARCHAR(50),
  age INTEGER,
  term_years INTEGER NOT NULL,
  priorities TEXT[] DEFAULT ARRAY[]::TEXT[],
  overpayment_plans BOOLEAN DEFAULT FALSE,
  overpayment_amount DECIMAL(15,2) DEFAULT 0,
  moving_within_5_years BOOLEAN DEFAULT FALSE,
  risk_tolerance INTEGER DEFAULT 50,
  savings_amount DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scenarios_user_id ON user_scenarios(user_id);
CREATE INDEX idx_scenarios_created_at ON user_scenarios(created_at);

-- Mortgage deals (cache of available products)
CREATE TABLE IF NOT EXISTS mortgage_deals (
  id VARCHAR(255) PRIMARY KEY,
  lender VARCHAR(255) NOT NULL,
  deal_name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  rate DECIMAL(5,3) NOT NULL,
  rate_margin DECIMAL(5,3),
  fixed_period INTEGER,
  svr DECIMAL(5,3),
  arrangement_fee DECIMAL(10,2),
  valuation_fee DECIMAL(10,2),
  legal_fees DECIMAL(10,2),
  max_ltv DECIMAL(5,2),
  min_ltv DECIMAL(5,2),
  erc_year_1 DECIMAL(5,2),
  erc_year_2 DECIMAL(5,2),
  erc_year_3 DECIMAL(5,2),
  erc_year_4 DECIMAL(5,2),
  erc_year_5 DECIMAL(5,2),
  overpayment_allowance DECIMAL(5,2),
  portable BOOLEAN,
  cashback DECIMAL(10,2),
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  provider VARCHAR(50) DEFAULT 'mock',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deals_lender ON mortgage_deals(lender);
CREATE INDEX idx_deals_type ON mortgage_deals(type);
CREATE INDEX idx_deals_provider ON mortgage_deals(provider);

-- Audit log for tracking user activity & calculations
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);

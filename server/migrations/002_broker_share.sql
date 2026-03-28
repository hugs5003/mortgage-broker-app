-- Broker sessions — a broker's recommendation package for a client
CREATE TABLE IF NOT EXISTS broker_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID REFERENCES users(id),
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'viewed', 'expired')),
  property_value DECIMAL(15,2),
  deposit DECIMAL(15,2),
  purchase_type VARCHAR(50),
  property_type VARCHAR(100),
  leasehold BOOLEAN DEFAULT FALSE,
  gross_income DECIMAL(15,2),
  joint_application BOOLEAN DEFAULT FALSE,
  second_income DECIMAL(15,2) DEFAULT 0,
  employment_status VARCHAR(100),
  monthly_outgoings DECIMAL(15,2) DEFAULT 0,
  credit_profile VARCHAR(50),
  age INTEGER,
  term_years INTEGER,
  priorities TEXT[] DEFAULT ARRAY[]::TEXT[],
  overpayment_plans BOOLEAN DEFAULT FALSE,
  overpayment_amount DECIMAL(15,2) DEFAULT 0,
  moving_within_5_years BOOLEAN DEFAULT FALSE,
  risk_tolerance INTEGER DEFAULT 50,
  savings_amount DECIMAL(15,2) DEFAULT 0,
  broker_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX idx_broker_sessions_broker_id ON broker_sessions(broker_id);

-- Broker deal highlights — which deals the broker is highlighting
CREATE TABLE IF NOT EXISTS broker_deal_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES broker_sessions(id) ON DELETE CASCADE,
  deal_id VARCHAR(255) NOT NULL,
  highlight_type VARCHAR(50) DEFAULT 'recommended' CHECK (highlight_type IN ('recommended', 'alternative', 'avoid')),
  broker_comment TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_broker_deal_highlights_session_id ON broker_deal_highlights(session_id);

-- Share links — unique URLs for consumers
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES broker_sessions(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX idx_share_links_session_id ON share_links(session_id);
CREATE INDEX idx_share_links_token ON share_links(token);

-- Consumer overrides — when a consumer edits the broker's inputs
CREATE TABLE IF NOT EXISTS consumer_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID REFERENCES share_links(id) ON DELETE CASCADE,
  override_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

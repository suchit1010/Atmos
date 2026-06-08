-- =============================================
-- ATMOS Protocol — PostgreSQL + PostGIS Schema
-- =============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number    VARCHAR(20) UNIQUE,
  email           VARCHAR(255) UNIQUE,
  name            VARCHAR(255),
  organisation    VARCHAR(255),
  role            VARCHAR(50) NOT NULL DEFAULT 'producer',
  kyc_status      VARCHAR(50) NOT NULL DEFAULT 'pending',
  country_code    VARCHAR(5) DEFAULT '+91',
  wallet_address  VARCHAR(100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_role CHECK (role IN ('producer','buyer','auditor','admin')),
  CONSTRAINT valid_kyc  CHECK (kyc_status IN ('pending','verified','rejected'))
);

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_email ON users(email);

-- ─────────────────────────────────────────
-- USER DEVICES (for fingerprinting)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_devices (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fingerprint VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, fingerprint)
);

-- ─────────────────────────────────────────
-- PROJECTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id),
  entity_type  VARCHAR(50) NOT NULL,
  name         VARCHAR(255) NOT NULL,
  location     GEOGRAPHY(POINT, 4326),
  boundary     GEOGRAPHY(POLYGON, 4326),
  area_ha      DECIMAL(10,4),
  metadata     JSONB NOT NULL DEFAULT '{}',
  media_urls   TEXT[] DEFAULT '{}',
  status       VARCHAR(50) NOT NULL DEFAULT 'draft',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_entity CHECK (entity_type IN (
    'biochar','agroforestry','soil_carbon','crop_residue',
    'solar_energy','ev_fleet','building','shipping',
    'aviation','city','individual'
  )),
  CONSTRAINT valid_status CHECK (status IN (
    'draft','submitted','analyzing','ai_complete',
    'zk_generated','verified','listed','sold','rejected'
  ))
);

CREATE INDEX idx_projects_user    ON projects(user_id);
CREATE INDEX idx_projects_status  ON projects(status);
CREATE INDEX idx_projects_entity  ON projects(entity_type);
CREATE INDEX idx_projects_geo     ON projects USING GIST(location);
CREATE INDEX idx_projects_boundary ON projects USING GIST(boundary);

-- ─────────────────────────────────────────
-- SATELLITE ANALYSIS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS satellite_analyses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  ndvi_current    DECIMAL(5,4),
  ndvi_baseline   DECIMAL(5,4),
  ndvi_trend      JSONB,              -- Array of [date, value] pairs
  biomass_tonnes  DECIMAL(10,3),
  land_use        VARCHAR(100),
  land_consistency VARCHAR(50),
  crop_activity   VARCHAR(50),
  fire_detected   BOOLEAN DEFAULT FALSE,
  cloud_cover_pct DECIMAL(5,2),
  image_date      DATE,
  raw_response    JSONB,
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_satellite_project ON satellite_analyses(project_id);

-- ─────────────────────────────────────────
-- AI VERIFICATIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_verifications (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id              UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  co2e_estimated          DECIMAL(12,4) NOT NULL,
  co2e_lower_bound        DECIMAL(12,4),
  co2e_upper_bound        DECIMAL(12,4),
  confidence_score        SMALLINT NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
  fraud_risk              VARCHAR(20) NOT NULL DEFAULT 'unknown',
  activity_detection      SMALLINT CHECK (activity_detection BETWEEN 0 AND 100),
  satellite_consistency   SMALLINT CHECK (satellite_consistency BETWEEN 0 AND 100),
  data_quality            SMALLINT CHECK (data_quality BETWEEN 0 AND 100),
  methodology_match       VARCHAR(50),
  permanence_score        SMALLINT,
  co_benefit_score        SMALLINT,
  grade                   CHAR(1),
  price_min_inr           DECIMAL(12,2),
  price_max_inr           DECIMAL(12,2),
  model_version           VARCHAR(50) DEFAULT 'v1.0',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_fraud CHECK (fraud_risk IN ('low','medium','high','unknown')),
  CONSTRAINT valid_grade CHECK (grade IN ('S','A','B','C','D'))
);

CREATE INDEX idx_ai_project ON ai_verifications(project_id);

-- ─────────────────────────────────────────
-- ZK PROOFS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS zk_proofs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  verification_id     UUID REFERENCES ai_verifications(id),
  proof_hash          VARCHAR(255) UNIQUE NOT NULL,
  proof_data          TEXT,              -- serialised Groth16 proof JSON
  public_signals      JSONB NOT NULL,    -- what is revealed
  private_inputs_hash VARCHAR(255),      -- hash of private inputs (never stored raw)
  circuit_version     VARCHAR(50) DEFAULT 'carbon_mrv_v1',
  verification_status VARCHAR(50) DEFAULT 'pending',
  solana_anchor_tx    VARCHAR(255),      -- tx hash anchoring proof on-chain
  anchor_slot         BIGINT,
  generated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  anchored_at         TIMESTAMPTZ,
  CONSTRAINT valid_zk_status CHECK (verification_status IN ('pending','verified','failed','anchored'))
);

CREATE INDEX idx_zk_project ON zk_proofs(project_id);
CREATE INDEX idx_zk_hash    ON zk_proofs(proof_hash);

-- ─────────────────────────────────────────
-- CARBON CREDITS (SPL Tokens)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS carbon_credits (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id        UUID NOT NULL REFERENCES projects(id),
  zk_proof_id       UUID REFERENCES zk_proofs(id),
  mint_address      VARCHAR(255) UNIQUE,
  amount_co2e       DECIMAL(12,4) NOT NULL,
  grade             CHAR(1),
  methodology       VARCHAR(50),
  vintage_year      SMALLINT,
  status            VARCHAR(50) NOT NULL DEFAULT 'pending_mint',
  list_price_inr    DECIMAL(12,2),
  solana_mint_tx    VARCHAR(255),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retired_at        TIMESTAMPTZ,
  CONSTRAINT valid_credit_status CHECK (status IN (
    'pending_mint','minted','listed','sold','retired','cancelled'
  ))
);

CREATE INDEX idx_credits_project ON carbon_credits(project_id);
CREATE INDEX idx_credits_status  ON carbon_credits(status);
CREATE INDEX idx_credits_mint    ON carbon_credits(mint_address);

-- ─────────────────────────────────────────
-- USER PORTFOLIO (tracks credit ownership)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_portfolio (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credit_id       UUID NOT NULL REFERENCES carbon_credits(id),
  quantity        DECIMAL(12,4) NOT NULL DEFAULT 0,
  acquired_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retired_at      TIMESTAMPTZ,
  source          VARCHAR(50) NOT NULL DEFAULT 'minted',
  CONSTRAINT valid_source CHECK (source IN ('minted','purchased','airdrop')),
  UNIQUE(user_id, credit_id)
);

CREATE INDEX idx_portfolio_user   ON user_portfolio(user_id);
CREATE INDEX idx_portfolio_credit ON user_portfolio(credit_id);
CREATE INDEX idx_portfolio_active ON user_portfolio(user_id, retired_at) WHERE retired_at IS NULL;

-- ─────────────────────────────────────────
-- MARKETPLACE LISTINGS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id     UUID NOT NULL REFERENCES users(id),
  credit_id     UUID NOT NULL REFERENCES carbon_credits(id),
  quantity      DECIMAL(12,4) NOT NULL,
  unit_price_inr DECIMAL(12,2) NOT NULL,
  currency      VARCHAR(10) DEFAULT 'INR',
  status        VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sold_at       TIMESTAMPTZ,
  CONSTRAINT valid_listing_status CHECK (status IN ('active','sold','withdrawn'))
);

CREATE INDEX idx_listings_seller ON marketplace_listings(seller_id);
CREATE INDEX idx_listings_credit ON marketplace_listings(credit_id);
CREATE INDEX idx_listings_status ON marketplace_listings(status);

-- ─────────────────────────────────────────
-- PAYMENT INTENTS (Dodo Payments)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_intents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dodo_session_id   VARCHAR(255) UNIQUE,
  buyer_id          UUID NOT NULL REFERENCES users(id),
  listing_id        UUID REFERENCES marketplace_listings(id),
  amount_inr        DECIMAL(12,2) NOT NULL,
  amount_usdc       DECIMAL(12,6),
  quantity          DECIMAL(12,4) NOT NULL,
  status            VARCHAR(50) NOT NULL DEFAULT 'pending',
  checkout_url      TEXT,
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  CONSTRAINT valid_payment_status CHECK (status IN (
    'pending','processing','succeeded','failed','expired','refunded'
  ))
);

CREATE INDEX idx_payments_buyer  ON payment_intents(buyer_id);
CREATE INDEX idx_payments_dodo   ON payment_intents(dodo_session_id);
CREATE INDEX idx_payments_status ON payment_intents(status);

-- ─────────────────────────────────────────
-- ON-CHAIN SETTLEMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settlements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id      UUID NOT NULL REFERENCES payment_intents(id),
  buyer_id        UUID NOT NULL REFERENCES users(id),
  credit_id       UUID NOT NULL REFERENCES carbon_credits(id),
  tx_hash         VARCHAR(255) UNIQUE,
  slot            BIGINT,
  amount_co2e     DECIMAL(12,4),
  status          VARCHAR(50) NOT NULL DEFAULT 'pending',
  confirmed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_settlement_status CHECK (status IN ('pending','confirmed','failed'))
);

CREATE INDEX idx_settlements_payment ON settlements(payment_id);
CREATE INDEX idx_settlements_tx      ON settlements(tx_hash);

-- ─────────────────────────────────────────
-- RETIREMENT CERTIFICATES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS retirement_certificates (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credit_id           UUID NOT NULL REFERENCES carbon_credits(id),
  retiring_user_id    UUID NOT NULL REFERENCES users(id),
  organisation_name   VARCHAR(255),
  esg_reference       VARCHAR(255),
  amount_co2e         DECIMAL(12,4) NOT NULL,
  burn_tx_hash        VARCHAR(255) UNIQUE,
  nft_mint_address    VARCHAR(255),
  certificate_url     TEXT,
  retired_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- PRICE TICKER (time-series)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS price_ticker (
  id          BIGSERIAL PRIMARY KEY,
  grade       CHAR(1) NOT NULL,
  price_inr   DECIMAL(12,2) NOT NULL,
  volume      DECIMAL(12,4) DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticker_grade ON price_ticker(grade, recorded_at DESC);

-- ─────────────────────────────────────────
-- AUDIT LOG
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  event_type  VARCHAR(100) NOT NULL,
  user_id     UUID,
  entity_type VARCHAR(50),
  entity_id   UUID,
  metadata    JSONB DEFAULT '{}',
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user   ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_event  ON audit_log(event_type, created_at DESC);

-- ─────────────────────────────────────────
-- OTP RATE LIMITING
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_attempts (
  id          BIGSERIAL PRIMARY KEY,
  phone       VARCHAR(20) NOT NULL,
  attempts    SMALLINT DEFAULT 1,
  window_end  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_phone ON otp_attempts(phone, window_end);

-- ─────────────────────────────────────────
-- FUNCTIONS + TRIGGERS
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();

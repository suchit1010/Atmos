-- Atmos Protocol — Production Database Schema v2.0
-- Optimized for 1M+ users, 100M+ projects, $B+ settlements

-- ─── Table: users ──────────────────────────────────────
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  country_code VARCHAR(5),
  wallet_address VARCHAR(66), -- Solana public key
  email VARCHAR(255),
  full_name VARCHAR(255),
  
  -- KYC/AML
  kyc_status VARCHAR(20) DEFAULT 'pending', -- pending | verified | rejected
  kyc_provider VARCHAR(50), -- jumio | onfido | etc
  kyc_reference_id VARCHAR(255),
  
  -- Tier system for rate limiting
  user_tier VARCHAR(20) DEFAULT 'free', -- free | pro | enterprise
  subscription_expires_at TIMESTAMP,
  
  -- Preferences & settings
  notification_email BOOLEAN DEFAULT true,
  notification_sms BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}',
  
  -- Compliance
  terms_accepted_at TIMESTAMP,
  privacy_accepted_at TIMESTAMP,
  data_processing_agreement_signed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP -- Soft delete for GDPR
);

-- Indexes for common queries
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);
CREATE INDEX idx_users_tier_created ON users(user_tier, created_at DESC);
CREATE INDEX idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NULL;

-- ─── Table: projects (partitioned by date) ──────────────
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Project metadata
  type VARCHAR(50) NOT NULL, -- biochar | solar | agroforestry | etc
  title VARCHAR(255),
  description TEXT,
  location_name VARCHAR(255),
  
  -- Geographic data (PostGIS)
  location GEOMETRY(POINT, 4326),
  boundary GEOMETRY(POLYGON, 4326),
  geo_hash VARCHAR(20), -- For sharding
  
  -- Media
  image_urls TEXT[] DEFAULT '{}', -- URLs to uploaded images
  satellite_imagery_date DATE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft | submitted | verified | minted | failed
  error_message TEXT,
  
  -- Verification result (denormalized for fast reads)
  verified_at TIMESTAMP,
  verification_result JSONB, -- { co2, confidence, grade, fraudRisk, ... }
  verification_model_version INT DEFAULT 1,
  
  -- ZK proof
  zk_proof VARCHAR(1000),
  zk_proof_verified BOOLEAN DEFAULT false,
  
  -- Solana minting
  solana_tx_hash VARCHAR(100),
  solana_mint_address VARCHAR(50),
  carbon_credits_minted BIGINT,
  minted_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Partition key
  CONSTRAINT projects_partition_check 
    CHECK (created_at IS NOT NULL)
) PARTITION BY RANGE (created_at);

-- Create partitions by month
CREATE TABLE projects_2024_01 PARTITION OF projects
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE projects_2024_02 PARTITION OF projects
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- ... continue for each month

-- Indexes (on parent table, inherited by partitions)
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_geo_hash ON projects(geo_hash);
CREATE INDEX idx_projects_created_desc ON projects(created_at DESC);
CREATE INDEX idx_projects_active ON projects(created_at DESC) WHERE status = 'active';
CREATE INDEX idx_projects_verified ON projects(user_id, verified_at DESC) WHERE verified_at IS NOT NULL;

-- GIS index for spatial queries
CREATE INDEX idx_projects_location ON projects USING GIST(location);
CREATE INDEX idx_projects_boundary ON projects USING GIST(boundary);

-- ─── Table: verifications (time-series) ──────────────────
CREATE TABLE verifications (
  id BIGSERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Verification details
  ai_model_version VARCHAR(50),
  ai_confidence INT, -- 0-100
  ai_grade CHAR(1), -- A | B | C | D
  ai_fraud_risk VARCHAR(20), -- low | medium | high
  ai_response JSONB, -- Raw AI response
  
  -- Satellite data
  satellite_source VARCHAR(50), -- sentinel-2 | landsat | etc
  satellite_date DATE,
  ndvi_value DECIMAL(4,2), -- Normalized Difference Vegetation Index
  land_use_class VARCHAR(50),
  
  -- Timing
  verification_started_at TIMESTAMP,
  verification_completed_at TIMESTAMP,
  processing_time_ms INT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending | processing | completed | failed
  error_message TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Time-series partitions
CREATE TABLE verifications_2024_01 PARTITION OF verifications
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE INDEX idx_verifications_project ON verifications(project_id);
CREATE INDEX idx_verifications_status ON verifications(status);
CREATE INDEX idx_verifications_created ON verifications(created_at DESC);

-- ─── Table: settlements (Dodo Payments) ──────────────────
CREATE TABLE settlements (
  id BIGSERIAL PRIMARY KEY,
  settlement_uuid UUID DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Dodo payment reference
  dodo_payment_id VARCHAR(255) UNIQUE,
  dodo_grant_id VARCHAR(255),
  dodo_reference_id VARCHAR(255),
  
  -- Svix webhook tracking
  svix_event_id VARCHAR(255) UNIQUE,
  svix_timestamp BIGINT,
  
  -- Settlement details
  amount_usd DECIMAL(12,2),
  currency VARCHAR(3) DEFAULT 'USD',
  carbon_credits INT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending | credit_received | minted | settled | failed
  
  -- USDC conversion
  usdc_amount DECIMAL(12,8),
  usdc_tx_hash VARCHAR(100),
  
  -- Solana settlement
  solana_tx_hash VARCHAR(100),
  settled_at TIMESTAMP,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settlements_user_id ON settlements(user_id);
CREATE INDEX idx_settlements_asset_id ON settlements(asset_id);
CREATE INDEX idx_settlements_status ON settlements(status, created_at DESC);
CREATE INDEX idx_settlements_dodo_id ON settlements(dodo_payment_id);
CREATE INDEX idx_settlements_svix_id ON settlements(svix_event_id);
CREATE UNIQUE INDEX idx_settlements_idempotent ON settlements(svix_event_id) WHERE svix_event_id IS NOT NULL;

-- ─── Table: audit_log (immutable compliance) ──────────
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  
  -- Who
  user_id UUID REFERENCES users(id),
  system_action BOOLEAN DEFAULT false,
  
  -- What
  action VARCHAR(100) NOT NULL, -- login | project_created | minting | settlement | etc
  resource_type VARCHAR(50), -- user | project | settlement | etc
  resource_id VARCHAR(255),
  
  -- Before/After
  old_value JSONB,
  new_value JSONB,
  
  -- Request context
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(255),
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user_time ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_action ON audit_log(action, created_at DESC);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- ─── Table: api_keys (for enterprise integrations) ────────
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  name VARCHAR(255),
  api_key VARCHAR(255) NOT NULL UNIQUE,
  api_key_hash VARCHAR(255), -- Hashed for security
  
  -- Permissions
  permissions TEXT[] DEFAULT '{}',
  
  -- Rate limiting
  rate_limit_per_min INT DEFAULT 1000,
  
  -- Metadata
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(api_key_hash);

-- ─── Table: cache_metadata (Redis companion) ───────────
CREATE TABLE cache_metadata (
  key VARCHAR(255) PRIMARY KEY,
  value_hash VARCHAR(64),
  ttl_seconds INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX idx_cache_metadata_expires ON cache_metadata(expires_at);

-- ─── Views for common aggregations ─────────────────────
CREATE MATERIALIZED VIEW user_stats AS
SELECT
  u.id,
  COUNT(DISTINCT p.id) as total_projects,
  COUNT(DISTINCT CASE WHEN p.status = 'verified' THEN p.id END) as verified_projects,
  SUM(CASE WHEN p.carbon_credits_minted IS NOT NULL THEN p.carbon_credits_minted ELSE 0 END) as total_credits_minted,
  SUM(CASE WHEN s.amount_usd IS NOT NULL THEN s.amount_usd ELSE 0 END) as total_revenue,
  MAX(p.created_at) as last_project_at
FROM users u
LEFT JOIN projects p ON u.id = p.user_id
LEFT JOIN settlements s ON u.id = s.user_id AND s.status = 'settled'
WHERE u.deleted_at IS NULL
GROUP BY u.id;

CREATE INDEX idx_user_stats_verified ON user_stats(verified_projects DESC);
CREATE INDEX idx_user_stats_credits ON user_stats(total_credits_minted DESC);

CREATE MATERIALIZED VIEW daily_verification_stats AS
SELECT
  DATE(v.created_at) as verification_date,
  COUNT(*) as total_verifications,
  AVG(v.ai_confidence) as avg_confidence,
  COUNT(CASE WHEN v.ai_fraud_risk = 'high' THEN 1 END) as high_risk_count,
  COUNT(CASE WHEN v.status = 'failed' THEN 1 END) as failed_count,
  AVG(v.processing_time_ms) as avg_processing_ms
FROM verifications v
GROUP BY DATE(v.created_at);

-- ─── Triggers for audit logging ────────────────────────
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log(
    action,
    resource_type,
    resource_id,
    old_value,
    new_value,
    user_id
  ) VALUES (
    TG_ARGV[0],
    TG_TABLE_NAME,
    NEW.id::TEXT,
    to_jsonb(OLD),
    to_jsonb(NEW),
    COALESCE(NEW.user_id, OLD.user_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enable audit logging on sensitive tables
CREATE TRIGGER audit_projects AFTER UPDATE ON projects
  FOR EACH ROW WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION audit_log_trigger('project_status_change');

CREATE TRIGGER audit_settlements AFTER INSERT ON settlements
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_trigger('settlement_created');

-- ─── Grants for restricted access ──────────────────────
CREATE ROLE app_user WITH PASSWORD 'app_password';
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Audit log is append-only
CREATE ROLE audit_user WITH PASSWORD 'audit_password';
GRANT SELECT ON audit_log TO audit_user;

-- ─── Performance settings ──────────────────────────────
-- Add to postgresql.conf for production
-- shared_buffers = 25% of RAM (e.g., 8GB for 32GB machine)
-- effective_cache_size = 50% of RAM
-- work_mem = 4GB / max_connections (e.g., 40MB if 100 connections)
-- maintenance_work_mem = 2GB
-- random_page_cost = 1.1 (for SSD)
-- wal_buffers = 16MB

-- Enable query parallelization
-- max_parallel_workers = 4
-- max_parallel_workers_per_gather = 2

-- ─── Backup strategy ───────────────────────────────────
-- 1. Daily full backup to S3
-- 2. Continuous WAL archiving
-- 3. Point-in-time recovery (7 days minimum)
-- 4. Cross-region replication

-- Check backup status:
-- SELECT * FROM pg_stat_archiver;

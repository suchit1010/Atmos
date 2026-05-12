/**
 * Database Migration: Umbra Privacy Tables
 * ═════════════════════════════════════════════════════════════════
 * Add tables for private carbon credit transfers and viewing keys.
 *
 * Run: npx drizzle-kit migrate
 * Or manually: psql -U postgres -d atmos -f migrations/umbra-schema.sql
 */

export const umbramigration_001 = `
-- ─── Umbra Private Transfers ────────────────────────────────────
-- Stores encrypted carbon credit transfers
CREATE TABLE IF NOT EXISTS umbra_transfers (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Payment linkage
  payment_intent_id         UUID UNIQUE REFERENCES payment_intents(id) ON DELETE SET NULL,
  project_id                UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Transfer details (encrypted on-chain)
  sender_wallet             VARCHAR(100) NOT NULL,
  stealth_address           VARCHAR(100) NOT NULL,
  encrypted_note            TEXT NOT NULL,
  viewing_key_hint          VARCHAR(64),
  
  -- Token details
  token_mint                VARCHAR(100) NOT NULL,
  amount_lamports           VARCHAR(50) NOT NULL,        -- Big number as string
  
  -- Transaction status
  tx_hash                   VARCHAR(255) UNIQUE NOT NULL,
  status                    VARCHAR(50) DEFAULT 'pending',
                            -- pending | processing | confirmed | failed
  
  -- Audit trail
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Viewing Keys (for Compliance) ──────────────────────────────
-- Users generate viewing keys to allow selective disclosure
CREATE TABLE IF NOT EXISTS umbra_viewing_keys (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User reference
  user_id                   UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Key management
  key_hash                  VARCHAR(255) NOT NULL UNIQUE,
                            -- Hash stored in DB (not the key itself)
  expires_at                TIMESTAMPTZ,                 -- null = never expires
  
  -- Audit trail
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  last_used_at              TIMESTAMPTZ
);

-- ─── Encrypted Portfolio Snapshots ──────────────────────────────
-- Periodic snapshots of user's encrypted portfolio state
CREATE TABLE IF NOT EXISTS umbra_portfolio_snapshots (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User reference
  user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Portfolio state (all encrypted)
  total_balance_encrypted   VARCHAR(100),
  holdings_count            INT DEFAULT 0,
  
  -- Metadata
  snapshot_reason           VARCHAR(100),                -- 'daily_snapshot' | 'post_purchase' | 'user_request'
  
  -- Audit trail
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Audit Log (Umbra Events) ──────────────────────────────────
-- Track all privacy-related events for compliance
CREATE TABLE IF NOT EXISTS umbra_audit_log (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event details
  event_type                VARCHAR(100) NOT NULL,
                            -- 'transfer.sent' | 'balance.decrypted' | 'key.generated' | 'report.generated'
  user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Event data
  details                   JSONB,                       -- Additional context
  
  -- Audit trail
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes (Performance) ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_umbra_transfers_stealth
  ON umbra_transfers(stealth_address);

CREATE INDEX IF NOT EXISTS idx_umbra_transfers_sender
  ON umbra_transfers(sender_wallet);

CREATE INDEX IF NOT EXISTS idx_umbra_transfers_tx
  ON umbra_transfers(tx_hash);

CREATE INDEX IF NOT EXISTS idx_umbra_transfers_project
  ON umbra_transfers(project_id);

CREATE INDEX IF NOT EXISTS idx_umbra_transfers_status
  ON umbra_transfers(status);

CREATE INDEX IF NOT EXISTS idx_umbra_transfers_created
  ON umbra_transfers(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_umbra_viewing_keys_hash
  ON umbra_viewing_keys(key_hash);

CREATE INDEX IF NOT EXISTS idx_umbra_viewing_keys_user
  ON umbra_viewing_keys(user_id);

CREATE INDEX IF NOT EXISTS idx_umbra_portfolio_user
  ON umbra_portfolio_snapshots(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_umbra_audit_log_user
  ON umbra_audit_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_umbra_audit_log_event
  ON umbra_audit_log(event_type, created_at DESC);

-- ─── Triggers (Auto-update) ────────────────────────────────────
-- Automatically update updated_at
CREATE OR REPLACE FUNCTION update_umbra_transfers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER umbra_transfers_update_timestamp
BEFORE UPDATE ON umbra_transfers
FOR EACH ROW
EXECUTE FUNCTION update_umbra_transfers_timestamp();

-- ─── Constraints ────────────────────────────────────────────────
-- Ensure amount is positive
ALTER TABLE umbra_transfers
ADD CONSTRAINT check_positive_amount
CHECK (amount_lamports::NUMERIC > 0);

-- Ensure stealth address is valid
ALTER TABLE umbra_transfers
ADD CONSTRAINT check_valid_stealth_address
CHECK (LENGTH(stealth_address) = 44 OR LENGTH(stealth_address) > 0);
`;

/**
 * Rollback migration (if needed)
 */
export const umbra_rollback_001 = `
DROP TRIGGER IF EXISTS umbra_transfers_update_timestamp ON umbra_transfers;
DROP FUNCTION IF EXISTS update_umbra_transfers_timestamp();

DROP TABLE IF EXISTS umbra_audit_log;
DROP TABLE IF EXISTS umbra_portfolio_snapshots;
DROP TABLE IF EXISTS umbra_viewing_keys;
DROP TABLE IF EXISTS umbra_transfers;
`;

/**
 * Migration execution helper
 */
export async function runUmbraMigration(connection: any) {
  try {
    console.log('⏳ Running Umbra schema migration...');

    // Split by semicolon and execute each statement
    const statements = umbramigration_001
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await connection.query(statement);
    }

    console.log('✓ Umbra schema migration completed');
  } catch (error) {
    console.error('✗ Umbra migration failed:', error);
    throw error;
  }
}

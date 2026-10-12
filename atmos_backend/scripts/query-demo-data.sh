#!/bin/bash
# Query the database to see verification data for our demo project

PGPASSWORD="karta_dev_password" psql -U karta -d karta -h localhost <<EOF

-- Projects
SELECT id, name, status, created_at FROM projects ORDER BY created_at DESC LIMIT 1;

-- AI Verifications
SELECT id, project_id, co2e_estimated, confidence_score, grade, fraud_risk, created_at 
FROM ai_verifications 
ORDER BY created_at DESC LIMIT 1;

-- ZK Proofs
SELECT id, project_id, proof_hash, verification_status, created_at 
FROM zk_proofs 
ORDER BY created_at DESC LIMIT 1;

-- Carbon Credits
SELECT id, project_id, amount_co2e, mint_address, created_at 
FROM carbon_credits 
ORDER BY created_at DESC LIMIT 1;

EOF

/**
 * ATMOS ZK Service — Privacy-preserving MRV proofs
 * ──────────────────────────────────────────────────────
 * Architecture:
 *   1. Hash private inputs (biomass logs, exact GPS, UID)
 *   2. Build public signals (project_id, co2e, region_hash, timestamp)
 *   3. Generate Groth16-style proof (or SP1 in production)
 *   4. Anchor proof hash on Solana devnet
 *   5. Return proof + tx_hash to caller
 *
 * What stays PRIVATE:
 *   - Exact GPS coordinates
 *   - Aadhaar / phone number
 *   - Biomass/production volumes
 *   - Farm boundary polygon
 *
 * What is PUBLIC (on-chain):
 *   - Project ID
 *   - CO2e amount (range, not exact)
 *   - Region commitment (state, not village)
 *   - Confidence score
 *   - Proof hash (verifiable by anyone)
 */

import crypto    from 'crypto';
import { query } from '../db/pool';
import { logger } from '../utils/logger';
import { anchorProofOnSolana } from './solana';
import type { AIVerificationResult } from './ai';

// ─── Types ────────────────────────────────────────────
export interface ZKProofInput {
  projectId:      string;
  userId:         string;
  co2eEstimated:  number;
  grade:          string;
  entityType:     string;
  metadata:       Record<string, any>;  // private inputs
  lat:            number;
  lng:            number;
  confidence:     number;
  verificationId: string;
}

export interface ZKProofOutput {
  proofHash:        string;
  publicSignals:    PublicSignals;
  privateInputHash: string;
  solanaAnchorTx:   string;
  anchorSlot:       number;
  circuitVersion:   string;
  verificationStatus: 'verified' | 'failed';
  proofData:        string;  // serialised proof JSON
}

interface PublicSignals {
  projectId:       string;
  co2eRange:       [number, number];  // [lower, upper] — not exact value
  regionHash:      string;            // hash of state, not village
  confidenceScore: number;
  grade:           string;
  methodology:     string;
  vintageYear:     number;
  proofTimestamp:  number;
}

// ─── Groth16 simulation ───────────────────────────────
// In production: replace with snarkjs / SP1 / Circom
interface Groth16Proof {
  pi_a: [string, string, string];
  pi_b: [[string, string], [string, string], [string, string]];
  pi_c: [string, string, string];
  protocol: 'groth16';
  curve:    'bn128';
}

function generateGroth16Proof(
  privateInputHash: string,
  publicSignals:    PublicSignals
): Groth16Proof {
  // Deterministic fake proof based on inputs — replace with real snarkjs in production
  const seed = Buffer.from(privateInputHash + JSON.stringify(publicSignals), 'utf8');

  const h = (suffix: string) =>
    crypto.createHash('sha256').update(seed).update(suffix).digest('hex');

  return {
    pi_a: [
      BigInt('0x' + h('a0')).toString(),
      BigInt('0x' + h('a1')).toString(),
      '1',
    ],
    pi_b: [
      [BigInt('0x' + h('b00')).toString(), BigInt('0x' + h('b01')).toString()],
      [BigInt('0x' + h('b10')).toString(), BigInt('0x' + h('b11')).toString()],
      ['1', '0'],
    ],
    pi_c: [
      BigInt('0x' + h('c0')).toString(),
      BigInt('0x' + h('c1')).toString(),
      '1',
    ],
    protocol: 'groth16',
    curve:    'bn128',
  };
}

// ─── Verify proof (local verification) ───────────────
function verifyProof(proof: Groth16Proof, publicSignals: PublicSignals): boolean {
  // In production: snarkjs.groth16.verify(vKey, publicSignals, proof)
  // Here: sanity-check the structure
  return (
    proof.pi_a.length === 3 &&
    proof.pi_b.length === 3 &&
    proof.pi_c.length === 3 &&
    proof.protocol   === 'groth16' &&
    publicSignals.co2eRange[0] < publicSignals.co2eRange[1]
  );
}

// ─── Region hash (coarse location, not exact) ─────────
function buildRegionHash(lat: number, lng: number): string {
  // Round to ~100km grid cell — reveals region (state), not farm
  const gridLat = Math.round(lat / 2)  * 2;
  const gridLng = Math.round(lng / 2)  * 2;
  return crypto
    .createHash('sha256')
    .update(`${gridLat}:${gridLng}`)
    .digest('hex')
    .substring(0, 16);
}

// ─── Private input hash ───────────────────────────────
function hashPrivateInputs(
  userId:    string,
  metadata:  Record<string, any>,
  exactLat:  number,
  exactLng:  number
): string {
  const sensitive = {
    userId,
    exactLat,
    exactLng,
    aadhaar:  metadata.aadhaarLast4 || '',
    phone:    metadata.mobileNumber  || '',
    biomass:  metadata.biomassAvailableTonnes || '',
    farmerName: metadata.farmerName  || '',
  };
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(sensitive))
    .digest('hex');
}

// ─── Proof hash ───────────────────────────────────────
function buildProofHash(proof: Groth16Proof, publicSignals: PublicSignals): string {
  return 'zk_' + crypto
    .createHash('sha256')
    .update(JSON.stringify(proof) + JSON.stringify(publicSignals))
    .digest('hex')
    .substring(0, 20);
}

// ─── CO2e range (publish range, not exact) ────────────
function buildCo2eRange(co2e: number): [number, number] {
  // Round to nearest 0.5 tonne range to preserve privacy
  const lower = Math.floor(co2e / 0.5) * 0.5;
  const upper = lower + 0.5;
  return [lower, upper];
}

// ─── MAIN: Generate full ZK proof + anchor ────────────
export async function generateZKProof(input: ZKProofInput): Promise<ZKProofOutput> {
  const {
    projectId, userId, co2eEstimated, grade, entityType,
    metadata, lat, lng, confidence, verificationId,
  } = input;

  logger.info('Generating ZK proof', { projectId, entityType, co2eEstimated });

  // Build inputs
  const privateInputHash = hashPrivateInputs(userId, metadata, lat, lng);
  const regionHash       = buildRegionHash(lat, lng);

  const publicSignals: PublicSignals = {
    projectId,
    co2eRange:       buildCo2eRange(co2eEstimated),
    regionHash,
    confidenceScore: confidence,
    grade,
    methodology:     getMethodologyCode(entityType),
    vintageYear:     new Date().getFullYear(),
    proofTimestamp:  Math.floor(Date.now() / 1000),
  };

  // Generate proof
  const proof     = generateGroth16Proof(privateInputHash, publicSignals);
  const valid     = verifyProof(proof, publicSignals);

  if (!valid) {
    logger.error('ZK proof verification failed', { projectId });
    throw new Error('ZK proof generation failed internal verification');
  }

  const proofHash  = buildProofHash(proof, publicSignals);
  const proofData  = JSON.stringify({ proof, publicSignals, circuit: 'carbon_mrv_v1' });

  // Anchor proof hash on Solana
  let solanaAnchorTx = '';
  let anchorSlot     = 0;

  try {
    const anchor   = await anchorProofOnSolana(proofHash, publicSignals.co2eRange[0], projectId);
    solanaAnchorTx = anchor.txHash;
    anchorSlot     = anchor.slot;
  } catch (err: any) {
    logger.warn('Solana anchor failed, will retry', { error: err.message });
    // Non-fatal — queue for retry
    solanaAnchorTx = 'pending';
    anchorSlot     = 0;
  }

  const output: ZKProofOutput = {
    proofHash,
    publicSignals,
    privateInputHash,
    solanaAnchorTx,
    anchorSlot,
    circuitVersion:      'carbon_mrv_v1',
    verificationStatus:  valid ? 'verified' : 'failed',
    proofData,
  };

  // Persist to DB
  await query(
    `INSERT INTO zk_proofs (
      project_id, verification_id, proof_hash, proof_data,
      public_signals, private_inputs_hash, circuit_version,
      verification_status, solana_anchor_tx, anchor_slot,
      anchored_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      projectId,
      verificationId,
      proofHash,
      proofData,
      JSON.stringify(publicSignals),
      privateInputHash,
      'carbon_mrv_v1',
      output.verificationStatus,
      solanaAnchorTx,
      anchorSlot,
      solanaAnchorTx !== 'pending' ? new Date() : null,
    ]
  );

  // Update project status
  await query(
    `UPDATE projects SET status = 'zk_generated', updated_at = NOW() WHERE id = $1`,
    [projectId]
  );

  logger.info('ZK proof generated + anchored', {
    projectId, proofHash, solanaAnchorTx,
  });

  return output;
}

// ─── Verify an existing proof ─────────────────────────
export async function verifyExistingProof(proofHash: string): Promise<{
  valid: boolean;
  publicSignals: PublicSignals | null;
  anchorTx: string;
}> {
  const result = await query(
    `SELECT public_signals, proof_data, solana_anchor_tx, verification_status
     FROM zk_proofs WHERE proof_hash = $1 LIMIT 1`,
    [proofHash]
  );

  if (result.rows.length === 0) {
    return { valid: false, publicSignals: null, anchorTx: '' };
  }

  const row         = result.rows[0];
  const parsed      = JSON.parse(row.proof_data || '{}');
  const valid       = verifyProof(parsed.proof, parsed.publicSignals);

  return {
    valid:         valid && row.verification_status === 'verified',
    publicSignals: row.public_signals,
    anchorTx:      row.solana_anchor_tx,
  };
}

function getMethodologyCode(entityType: string): string {
  const map: Record<string, string> = {
    biochar: 'VM0044', agroforestry: 'VM0047', soil_carbon: 'VM0042',
    crop_residue: 'VM0042', solar_energy: 'AMS-I.D', ev_fleet: 'AMS-III.C',
    building: 'AMS-II.C',
  };
  return map[entityType] || 'VM0042';
}

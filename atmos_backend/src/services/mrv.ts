/**
 * ATMOS MRV Pipeline Orchestrator
 * ────────────────────────────────────────────────────
 * Full pipeline: Satellite → AI → ZK → Mint
 *
 * Steps:
 *   1. Fetch satellite data for project location
 *   2. Run AI carbon estimation + fraud detection
 *   3. Generate ZK proof
 *   4. Mint SPL carbon credit token
 *   5. Create marketplace listing (optional)
 *   6. Update project status at each step
 *   7. Emit WebSocket events to client
 */

import { query, transaction } from '../db/pool';
import { logger }              from '../utils/logger';
import { runSatelliteAnalysis, type SatelliteResult } from './satellite';
import { runAIVerification,    type AIVerificationResult } from './ai';
import { generateZKProof,      type ZKProofOutput }  from './zk';
import { mintCarbonCredit,     type MintCreditResult } from './solana';

// ─── Pipeline status emitter (for WebSocket) ─────────
type StatusEmitter = (event: string, data: object) => void;

let wsEmitter: StatusEmitter = () => {};

export function setWebSocketEmitter(fn: StatusEmitter): void {
  wsEmitter = fn;
}

function emit(projectId: string, step: string, data: object): void {
  wsEmitter(`mrv:${projectId}`, { step, timestamp: Date.now(), ...data });
  logger.debug('MRV pipeline event', { projectId, step });
}

// ─── Helper: update project status ───────────────────
async function updateStatus(projectId: string, status: string): Promise<void> {
  await query(
    `UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2`,
    [status, projectId]
  );
}

// ─── Helper: update metadata field ───────────────────
async function saveAnalysisRefs(
  projectId: string,
  verificationId: string,
  zkProofId: string
): Promise<void> {
  // We store refs in the project metadata for easy lookup
  await query(
    `UPDATE projects
     SET metadata = jsonb_set(
       jsonb_set(metadata, '{verificationId}', $1::jsonb),
       '{zkProofId}', $2::jsonb
     ),
     updated_at = NOW()
     WHERE id = $3`,
    [JSON.stringify(verificationId), JSON.stringify(zkProofId), projectId]
  );
}

// ─── FULL PIPELINE ────────────────────────────────────
export interface PipelineResult {
  projectId:    string;
  satellite:    SatelliteResult;
  verification: AIVerificationResult;
  zkProof:      ZKProofOutput;
  credit:       MintCreditResult | null;
  status:       'verified' | 'minted' | 'failed';
  errorStep?:   string;
  errorMsg?:    string;
}

export async function runMRVPipeline(projectId: string): Promise<PipelineResult> {
  logger.info('Starting MRV pipeline', { projectId });

  // Load project
  const projResult = await query(
    `SELECT p.*, u.id as user_id, u.wallet_address
     FROM projects p JOIN users u ON u.id = p.user_id
     WHERE p.id = $1`,
    [projectId]
  );

  if (projResult.rows.length === 0) throw new Error(`Project not found: ${projectId}`);

  const project = projResult.rows[0];
  const meta    = typeof project.metadata === 'string'
    ? JSON.parse(project.metadata)
    : project.metadata;

  // Extract lat/lng from PostGIS point
  const geoResult = await query(
    `SELECT ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng
     FROM projects WHERE id = $1`,
    [projectId]
  );
  const { lat, lng } = geoResult.rows[0] || { lat: 23.0, lng: 72.6 }; // fallback Ahmedabad

  emit(projectId, 'started', { message: 'MRV pipeline started' });

  // ─── STEP 1: Satellite ─────────────────────────────
  await updateStatus(projectId, 'analyzing');
  emit(projectId, 'satellite.start', { message: 'Fetching satellite imagery...' });

  let satellite: SatelliteResult;
  try {
    satellite = await runSatelliteAnalysis({
      projectId,
      lat,
      lng,
      areaHa:     parseFloat(meta.areaHa || '1'),
      entityType: project.entity_type,
    });
    emit(projectId, 'satellite.done', {
      ndvi:             satellite.ndviCurrent,
      landUse:          satellite.landUse,
      fireDetected:     satellite.fireDetected,
      confidence:       satellite.confidenceScore,
    });
  } catch (err: any) {
    logger.error('Satellite step failed', { projectId, error: err.message });
    await updateStatus(projectId, 'rejected');
    return {
      projectId, satellite: {} as SatelliteResult,
      verification: {} as AIVerificationResult,
      zkProof: {} as ZKProofOutput, credit: null,
      status: 'failed', errorStep: 'satellite', errorMsg: err.message,
    };
  }

  // ─── STEP 2: AI Verification ───────────────────────
  emit(projectId, 'ai.start', { message: 'Running AI carbon estimation...' });

  let verification: AIVerificationResult;
  try {
    verification = await runAIVerification(
      projectId,
      project.entity_type,
      meta,
      satellite
    );
    emit(projectId, 'ai.done', {
      co2e:       verification.co2eEstimated,
      confidence: verification.confidence.overall,
      grade:      verification.grade,
      fraudRisk:  verification.fraud.risk,
      priceRange: [verification.priceMinInr, verification.priceMaxInr],
    });

    // Reject if high fraud or very low confidence
    if (verification.fraud.risk === 'high' || verification.confidence.overall < 30) {
      await updateStatus(projectId, 'rejected');
      emit(projectId, 'rejected', { reason: 'High fraud risk or insufficient data' });
      return {
        projectId, satellite, verification,
        zkProof: {} as ZKProofOutput, credit: null,
        status: 'failed', errorStep: 'ai',
        errorMsg: `Rejected: fraud=${verification.fraud.risk}, confidence=${verification.confidence.overall}`,
      };
    }
  } catch (err: any) {
    logger.error('AI step failed', { projectId, error: err.message });
    await updateStatus(projectId, 'rejected');
    return {
      projectId, satellite, verification: {} as AIVerificationResult,
      zkProof: {} as ZKProofOutput, credit: null,
      status: 'failed', errorStep: 'ai', errorMsg: err.message,
    };
  }

  await updateStatus(projectId, 'ai_complete');

  // ─── STEP 3: ZK Proof ─────────────────────────────
  emit(projectId, 'zk.start', { message: 'Generating zero-knowledge proof...' });

  // Get verification ID from DB
  const vResult = await query(
    `SELECT id FROM ai_verifications WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [projectId]
  );
  const verificationId = vResult.rows[0]?.id || '';

  let zkProof: ZKProofOutput;
  try {
    zkProof = await generateZKProof({
      projectId,
      userId:         project.user_id,
      co2eEstimated:  verification.co2eEstimated,
      grade:          verification.grade,
      entityType:     project.entity_type,
      metadata:       meta,
      lat, lng,
      confidence:     verification.confidence.overall,
      verificationId,
    });

    emit(projectId, 'zk.done', {
      proofHash:      zkProof.proofHash,
      solanaAnchorTx: zkProof.solanaAnchorTx,
      publicSignals:  zkProof.publicSignals,
    });
  } catch (err: any) {
    logger.error('ZK step failed', { projectId, error: err.message });
    // ZK failure is non-fatal in MVP — continue without proof
    zkProof = {
      proofHash: 'zk_failed', publicSignals: {} as any,
      privateInputHash: '', solanaAnchorTx: 'failed',
      anchorSlot: 0, circuitVersion: 'carbon_mrv_v1',
      verificationStatus: 'failed', proofData: '',
    };
    emit(projectId, 'zk.failed', { message: 'ZK proof generation failed', error: err.message });
  }

  // Get ZK proof ID
  const zkResult = await query(
    `SELECT id FROM zk_proofs WHERE project_id = $1 ORDER BY generated_at DESC LIMIT 1`,
    [projectId]
  );
  const zkProofId = zkResult.rows[0]?.id || '';

  await saveAnalysisRefs(projectId, verificationId, zkProofId);
  await updateStatus(projectId, 'verified');

  emit(projectId, 'verified', {
    message:   'Project verified — ready to mint',
    co2e:      verification.co2eEstimated,
    proofHash: zkProof.proofHash,
    grade:     verification.grade,
  });

  return {
    projectId,
    satellite,
    verification,
    zkProof,
    credit: null,
    status: 'verified',
  };
}

// ─── MINT STEP (separate — user initiates) ────────────
export async function mintProjectCredit(
  projectId: string,
  listForSale: boolean = true,
  listPriceInr?: number
): Promise<MintCreditResult> {
  // Load verified project + results
  const projResult = await query(
    `SELECT p.*, u.wallet_address,
            v.id as ver_id, v.co2e_estimated, v.grade, v.methodology,
            v.price_min_inr, v.price_max_inr,
            z.proof_hash
     FROM projects p
     JOIN users u ON u.id = p.user_id
     LEFT JOIN ai_verifications v ON v.project_id = p.id
     LEFT JOIN zk_proofs z ON z.project_id = p.id
     WHERE p.id = $1
     ORDER BY v.created_at DESC, z.generated_at DESC`,
    [projectId]
  );

  if (projResult.rows.length === 0) throw new Error('Project not found');

  const row     = projResult.rows[0];
  const wallet  = row.wallet_address || getPayer_fallback();
  const co2e    = parseFloat(row.co2e_estimated || '1.0');
  const grade   = row.grade || 'B';
  const priceInr = listPriceInr || parseFloat(row.price_min_inr || '700');

  emit(projectId, 'mint.start', { message: 'Minting carbon credit on Solana...' });

  const mintResult = await mintCarbonCredit(projectId, wallet, co2e, grade);

  // Save to carbon_credits table
  await transaction(async (client) => {
    const creditResult = await client.query(
      `INSERT INTO carbon_credits (
        project_id, zk_proof_id, mint_address, amount_co2e,
        grade, methodology, vintage_year, status, list_price_inr, solana_mint_tx
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id`,
      [
        projectId,
        row.zk_proof_id || null,
        mintResult.mintAddress,
        co2e,
        grade,
        row.methodology || 'VM0044',
        new Date().getFullYear(),
        listForSale ? 'listed' : 'minted',
        priceInr,
        mintResult.txHash,
      ]
    );

    const creditId = creditResult.rows[0].id;

    if (listForSale) {
      await client.query(
        `INSERT INTO marketplace_listings (seller_id, credit_id, quantity, unit_price_inr)
         VALUES ($1,$2,$3,$4)`,
        [row.user_id, creditId, co2e, priceInr]
      );
    }

    await client.query(
      `UPDATE projects SET status = 'listed', updated_at = NOW() WHERE id = $1`,
      [projectId]
    );
  });

  emit(projectId, 'mint.done', {
    mintAddress: mintResult.mintAddress,
    txHash:      mintResult.txHash,
    co2e,
    listed:      listForSale,
    priceInr,
  });

  logger.info('Carbon credit minted + listed', {
    projectId, mint: mintResult.mintAddress, co2e, grade,
  });

  return mintResult;
}

function getPayer_fallback(): string {
  return 'devnet_fallback_' + Math.random().toString(36).substring(2, 10);
}

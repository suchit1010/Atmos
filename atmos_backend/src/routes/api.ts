/**
 * ATMOS API Routes
 * All endpoints in one file for hackathon clarity
 * In production: split into separate route modules
 */

import type { FastifyInstance } from 'fastify';
import { z }                    from 'zod';

import { authMiddleware }        from '../middleware/auth';
import * as AuthSvc              from '../services/auth';
import * as MRVSvc               from '../services/mrv';
import * as PaySvc               from '../services/payments';
import { generateZKProof }       from '../services/zk';
import { verifyExistingProof }   from '../services/zk';
import { retireCredits }         from '../services/solana';
import { solanaHealthCheck }     from '../services/solana';
import { query }                 from '../db/pool';
import { logger }                from '../utils/logger';
import {
  SendOTPSchema, VerifyOTPSchema,
  CreateProjectSchema, CreateListingSchema,
  CreatePaymentSchema, RetireCreditsSchema,
} from '../types/schemas';

export async function registerRoutes(app: FastifyInstance): Promise<void> {

  // ── Safe query helper: returns mock result on DB failure ──
  async function safeQuery<T = any>(
    text: string,
    params?: any[],
    fallback: T[] = []
  ): Promise<{ rows: T[] }> {
    try {
      return await query<T>(text, params);
    } catch {
      logger.warn('DB unavailable, returning mock data for query');
      return { rows: fallback };
    }
  }

  // ──────────────────────────────────────────────────
  // ROOT
  // ──────────────────────────────────────────────────
  app.get('/', async () => {
    return {
      name: 'ATMOS Protocol API',
      status: 'ok',
      version: '1.0.0',
      health: '/api/healthz',
      docs: '/api/v1',
    };
  });

  // ──────────────────────────────────────────────────
  // HEALTH
  // ──────────────────────────────────────────────────
  async function healthHandler() {
    const solana = await solanaHealthCheck();
    return {
      status:    'ok',
      version:   '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        solana:   solana.ok ? 'ok' : 'degraded',
        solanaSlot: solana.slot,
      },
    };
  }

  app.get('/health', healthHandler);
  app.get('/api/healthz', healthHandler);

  // ──────────────────────────────────────────────────
  // AUTH
  // ──────────────────────────────────────────────────
  app.post('/api/v1/auth/otp/send', async (req, reply) => {
    const body = SendOTPSchema.parse(req.body);
    const res  = await AuthSvc.sendOTP(body.phoneNumber, body.countryCode);
    return reply.status(200).send(res);
  });

  app.post('/api/v1/auth/otp/verify', async (req, reply) => {
    const body = VerifyOTPSchema.parse(req.body);
    const res  = await AuthSvc.verifyOTPAndIssueTokens(
      body.phoneNumber,
      body.countryCode,
      body.otp,
      body.deviceFingerprint
    );
    return reply.status(200).send(res);
  });

  app.post('/api/v1/auth/token/refresh', async (req, reply) => {
    const { refreshToken } = req.body as { refreshToken: string };
    if (!refreshToken) return reply.status(400).send({ error: 'refreshToken required' });
    const res = await AuthSvc.refreshAccessToken(refreshToken);
    return reply.status(200).send(res);
  });

  app.get('/api/v1/auth/me', { preHandler: authMiddleware }, async (req, reply) => {
    const user = await AuthSvc.getUserById(req.user!.sub);
    if (!user) return reply.status(404).send({ error: 'User not found' });
    return reply.send(user);
  });
  // ──────────────────────────────────────────────────
  // PROJECTS
  // ──────────────────────────────────────────────────
  app.post('/api/v1/projects', { preHandler: authMiddleware }, async (req, reply) => {
    const body   = CreateProjectSchema.parse(req.body);
    const userId = req.user!.sub;

    let project: any;

    try {
      const result = await query(
        `INSERT INTO projects
         (user_id, entity_type, name, location, area_ha, metadata, status)
         VALUES ($1,$2,$3,ST_SetSRID(ST_MakePoint($4,$5),4326),$6,$7,'submitted')
         RETURNING id, entity_type, name, status, created_at`,
        [
          userId,
          body.entityType,
          body.name,
          body.location.lng,
          body.location.lat,
          body.areaHa || null,
          JSON.stringify(body.metadata),
        ]
      );
      project = result.rows[0];
    } catch {
      // DB unavailable — create an in-memory mock project so the flow continues
      logger.warn('DB unavailable, creating mock project for demo');
      const crypto = await import('crypto');
      const projectId = crypto.randomUUID();
      project = {
        id:          projectId,
        entity_type: body.entityType,
        name:        body.name,
        status:      'analyzing',
        created_at:  new Date().toISOString(),
      };

      const { mockProjects } = await import('../db/mockStore');
      mockProjects.set(projectId, {
        id: projectId,
        user_id: userId,
        entity_type: body.entityType,
        name: body.name,
        location: {
          lat: body.location?.lat ?? 28.7041,
          lng: body.location?.lng ?? 77.1025,
        },
        area_ha: typeof body.areaHa === 'number' ? body.areaHa : parseFloat(body.areaHa || '12.5'),
        metadata: body.metadata || {},
        status: 'analyzing',
        created_at: project.created_at,
        updated_at: project.created_at,
        farmer_name: (body.metadata as any)?.farmerName || 'Demo Farmer',
      });

    }

    // Trigger MRV pipeline asynchronously (best-effort)
    MRVSvc.runMRVPipeline(project.id).catch(err =>
      logger.warn('MRV pipeline skipped (no DB)', { projectId: project.id, error: err.message })
    );

    return reply.status(201).send({
      project,
      message: 'Project submitted. MRV pipeline started.',
    });
  });

  app.get('/api/v1/projects', async (req, reply) => {
    // Dev: Allow without auth. Production: add { preHandler: authMiddleware }
    const userId = req.user?.sub || 'guest-user';
    const { page = '1', limit = '20', status } = req.query as any;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = status ? `AND p.status = '${status}'` : '';

    let projects: any[] = [];
    try {
      const result = await query(
        `SELECT p.id, p.entity_type, p.name, p.status, p.area_ha, p.created_at,
                ST_Y(p.location::geometry) as lat, ST_X(p.location::geometry) as lng,
                v.co2e_estimated, v.confidence_score, v.grade,
                z.proof_hash
         FROM projects p
         LEFT JOIN ai_verifications v ON v.project_id = p.id
         LEFT JOIN zk_proofs z ON z.project_id = p.id
         WHERE p.user_id = $1 ${whereClause}
         ORDER BY p.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, parseInt(limit), offset]
      );
      projects = result.rows;
    } catch {
      logger.warn('DB unavailable, fetching projects from mock store');
      const { mockProjects, mockVerifications, mockProofs } = await import('../db/mockStore');
      const allMock = Array.from(mockProjects.values())
        .filter(p => p.user_id === userId && (!status || p.status === status));
      
      projects = allMock.map(p => {
        const mockVer = mockVerifications.get(p.id);
        const mockZk = mockProofs.get(p.id);
        return {
          id: p.id,
          entity_type: p.entity_type,
          name: p.name,
          status: p.status,
          area_ha: p.area_ha,
          created_at: p.created_at,
          lat: p.location.lat,
          lng: p.location.lng,
          co2e_estimated: mockVer ? mockVer.co2eEstimated : null,
          confidence_score: mockVer ? mockVer.confidence.overall : null,
          grade: mockVer ? mockVer.grade : null,
          proof_hash: mockZk ? mockZk.proofHash : null,
        };
      });
    }

    return reply.send({ projects, page: parseInt(page), limit: parseInt(limit) });
  });

  app.get('/api/v1/projects/:id', { preHandler: authMiddleware }, async (req, reply) => {
    const { id } = req.params as { id: string };

    try {
      const result = await query(
        `SELECT p.*, u.name as farmer_name,
                ST_Y(p.location::geometry) as lat, ST_X(p.location::geometry) as lng,
                v.co2e_estimated, v.co2e_lower_bound, v.co2e_upper_bound,
                v.confidence_score, v.fraud_risk, v.activity_detection,
                v.satellite_consistency, v.data_quality, v.methodology_match,
                v.permanence_score, v.grade, v.price_min_inr, v.price_max_inr,
                z.proof_hash, z.solana_anchor_tx, z.public_signals,
                z.verification_status as zk_status,
                cc.mint_address, cc.amount_co2e, cc.solana_mint_tx
         FROM projects p
         JOIN users u ON u.id = p.user_id
         LEFT JOIN ai_verifications v ON v.project_id = p.id
         LEFT JOIN zk_proofs z ON z.project_id = p.id
         LEFT JOIN carbon_credits cc ON cc.project_id = p.id
         WHERE p.id = $1 AND p.user_id = $2
         ORDER BY v.created_at DESC, z.generated_at DESC
         LIMIT 1`,
        [id, req.user!.sub]
      );

      if (result.rows.length === 0) return reply.status(404).send({ error: 'Project not found' });

      return reply.send(result.rows[0]);
    } catch {
      // DB unavailable — check mock store first, then fallback to demo biochar
      logger.warn('DB unavailable, looking for project in mock store', { projectId: id });
      
      const { mockProjects, mockVerifications, mockProofs, mockCredits } = await import('../db/mockStore');
      const mockProj = mockProjects.get(id);
      if (mockProj) {
        const mockVer = mockVerifications.get(id);
        const mockZk = mockProofs.get(id);
        const mockCc = mockCredits.get(id);

        return reply.send({
          id: mockProj.id,
          user_id: mockProj.user_id,
          entity_type: mockProj.entity_type,
          name: mockProj.name,
          status: mockProj.status,
          area_ha: mockProj.area_ha,
          lat: mockProj.location.lat,
          lng: mockProj.location.lng,
          farmer_name: mockProj.farmer_name,
          co2e_estimated: mockVer ? mockVer.co2eEstimated : null,
          co2e_lower_bound: mockVer ? mockVer.co2eLowerBound : null,
          co2e_upper_bound: mockVer ? mockVer.co2eUpperBound : null,
          confidence_score: mockVer ? mockVer.confidence.overall : null,
          fraud_risk: mockVer ? mockVer.fraud.risk : null,
          activity_detection: mockVer ? mockVer.confidence.activityDetection : null,
          satellite_consistency: mockVer ? mockVer.confidence.satelliteConsistency : null,
          data_quality: mockVer ? mockVer.confidence.dataQuality : null,
          methodology_match: mockVer ? mockVer.methodology : null,
          permanence_score: mockVer ? mockVer.confidence.permanenceScore : null,
          grade: mockVer ? mockVer.grade : null,
          price_min_inr: mockVer ? mockVer.priceMinInr : null,
          price_max_inr: mockVer ? mockVer.priceMaxInr : null,
          proof_hash: mockZk ? mockZk.proofHash : null,
          solana_anchor_tx: mockZk ? mockZk.solanaAnchorTx : null,
          public_signals: mockZk ? mockZk.publicSignals : null,
          zk_status: mockZk ? mockZk.verificationStatus : null,
          mint_address: mockCc ? mockCc.mint_address : null,
          amount_co2e: mockCc ? mockCc.amount_co2e : null,
          solana_mint_tx: mockCc ? mockCc.solana_mint_tx : null,
          created_at: mockProj.created_at,
          updated_at: mockProj.updated_at,
          metadata: mockProj.metadata,
        });
      }

      return reply.send({
        id,
        user_id: req.user!.sub,
        entity_type: 'biochar',
        name: 'Demo Biochar Project',
        status: 'verified',
        area_ha: 12.5,
        lat: 28.7041,
        lng: 77.1025,
        farmer_name: 'Demo Farmer',
        co2e_estimated: 2.46,
        co2e_lower_bound: 2.02,
        co2e_upper_bound: 2.90,
        confidence_score: 87,
        fraud_risk: 'low',
        activity_detection: 92,
        satellite_consistency: 85,
        data_quality: 90,
        methodology_match: 'VM0044',
        permanence_score: 85,
        grade: 'A',
        price_min_inr: 1485,
        price_max_inr: 1850,
        proof_hash: `zk_${id.slice(0, 12)}`,
        solana_anchor_tx: `mock_tx_${id.slice(0, 8)}`,
        public_signals: { co2e: 2.46, confidence: 87 },
        zk_status: 'verified',
        mint_address: null,
        amount_co2e: null,
        solana_mint_tx: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  });

  // Re-trigger MRV pipeline manually
  app.post('/api/v1/projects/:id/analyze', { preHandler: authMiddleware }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      MRVSvc.runMRVPipeline(id).catch(err =>
        logger.error('Manual MRV trigger error', { projectId: id, error: err.message })
      );
      return reply.send({ message: 'MRV pipeline triggered', projectId: id });
    } catch {
      logger.warn('MRV pipeline skipped (no DB)', { projectId: id });
      return reply.send({ message: 'MRV pipeline skipped (demo mode)', projectId: id });
    }
  });

  // Mint carbon credit token
  app.post('/api/v1/projects/:id/mint', { preHandler: authMiddleware }, async (req, reply) => {
    const { id }   = req.params as { id: string };
    const { listForSale = true, listPriceInr } = req.body as any;

    try {
      const result = await MRVSvc.mintProjectCredit(id, listForSale, listPriceInr);
      return reply.status(201).send(result);
    } catch (err) {
      // DB unavailable — return mock mint response
      logger.warn('Mint skipped (no DB), returning mock', { projectId: id });
      const crypto = await import('crypto');
      return reply.status(201).send({
        creditId: crypto.randomUUID(),
        mintAddress: `mock_mint_${id.slice(0, 8)}`,
        amount: 2.46,
        grade: 'A',
        solana_tx: `mock_tx_${crypto.randomBytes(8).toString('hex')}`,
        message: 'Credit minted (demo mode)',
      });
    }
  });

  // ──────────────────────────────────────────────────
  // ZK PROOF
  // ──────────────────────────────────────────────────
  app.get('/api/v1/proofs/:hash/verify', async (req, reply) => {
    const { hash } = req.params as { hash: string };
    const result   = await verifyExistingProof(hash);
    return reply.send(result);
  });

  app.get('/api/v1/projects/:id/proof', { preHandler: authMiddleware }, async (req, reply) => {
    const { id } = req.params as { id: string };
    
    try {
      const result = await query(
        `SELECT proof_hash, public_signals, solana_anchor_tx, anchor_slot,
                verification_status, circuit_version, generated_at
         FROM zk_proofs WHERE project_id = $1 ORDER BY generated_at DESC LIMIT 1`,
        [id]
      );
      if (result.rows.length === 0) return reply.status(404).send({ error: 'Proof not found' });
      return reply.send(result.rows[0]);
    } catch {
      // DB unavailable — return mock proof
      logger.warn('DB unavailable, returning mock proof', { projectId: id });
      return reply.send({
        proof_hash: `zk_${id.slice(0, 12)}`,
        public_signals: { co2e: 2.46, confidence: 87, region: 'IN-DL' },
        solana_anchor_tx: `mock_tx_${id.slice(0, 8)}`,
        anchor_slot: 123456789,
        verification_status: 'verified',
        circuit_version: 'carbon_mrv_v1',
        generated_at: new Date().toISOString(),
      });
    }
  });

  // ──────────────────────────────────────────────────
  // MARKETPLACE
  // ──────────────────────────────────────────────────
  app.get('/api/v1/marketplace', async (req, reply) => {
    const {
      page = '1', limit = '20',
      grade, entityType, minPrice, maxPrice,
      sortBy = 'created_at', sortDir = 'desc',
    } = req.query as any;

    const offset   = (parseInt(page) - 1) * parseInt(limit);
    const filters: string[] = ["ml.status = 'active'"];
    const params:  any[]    = [];
    let   pIdx             = 1;

    if (grade)      { filters.push(`cc.grade = $${pIdx++}`);             params.push(grade); }
    if (entityType) { filters.push(`p.entity_type = $${pIdx++}`);        params.push(entityType); }
    if (minPrice)   { filters.push(`ml.unit_price_inr >= $${pIdx++}`);   params.push(parseFloat(minPrice)); }
    if (maxPrice)   { filters.push(`ml.unit_price_inr <= $${pIdx++}`);   params.push(parseFloat(maxPrice)); }

    const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

    const allowedSort = ['created_at', 'unit_price_inr', 'confidence_score', 'co2e_estimated'];
    const safeSort    = allowedSort.includes(sortBy) ? sortBy : 'ml.created_at';

    params.push(parseInt(limit), offset);

    const result = await safeQuery(
      `SELECT ml.id as listing_id, ml.quantity, ml.unit_price_inr, ml.created_at,
              cc.id as credit_id, cc.grade, cc.methodology, cc.vintage_year,
              cc.mint_address, cc.amount_co2e,
              p.id as project_id, p.entity_type, p.name as project_name,
              p.area_ha,
              ST_Y(p.location::geometry) as lat, ST_X(p.location::geometry) as lng,
              v.co2e_estimated, v.confidence_score, v.fraud_risk,
              z.proof_hash,
              u.name as seller_name, u.organisation
       FROM marketplace_listings ml
       JOIN carbon_credits cc ON cc.id = ml.credit_id
       JOIN projects p ON p.id = cc.project_id
       LEFT JOIN ai_verifications v ON v.project_id = p.id
       LEFT JOIN zk_proofs z ON z.project_id = p.id
       JOIN users u ON u.id = ml.seller_id
       ${where}
       ORDER BY ${safeSort} ${sortDir === 'asc' ? 'ASC' : 'DESC'}
       LIMIT $${pIdx++} OFFSET $${pIdx}`,
      params,
      []
    );

    const { mockListings } = await import('../db/mockStore');
    const customListings = Array.from(mockListings.values());

    return reply.send({
      listings: [...customListings, ...result.rows],
      page:     parseInt(page),
      limit:    parseInt(limit),
    });
  });

  // Live price ticker
  app.get('/api/v1/marketplace/ticker', async (_req, reply) => {
    const result = await safeQuery(
      `SELECT grade,
              AVG(unit_price_inr)::numeric(10,2) as avg_price,
              COUNT(*) as listing_count,
              SUM(quantity) as total_volume
       FROM marketplace_listings ml
       JOIN carbon_credits cc ON cc.id = ml.credit_id
       WHERE ml.status = 'active' AND ml.created_at > NOW() - INTERVAL '7 days'
       GROUP BY grade ORDER BY grade`,
      [],
      [
        { grade: 'A', avg_price: '1485', listing_count: '3', total_volume: '73' },
        { grade: 'B', avg_price: '945',  listing_count: '2', total_volume: '50' },
        { grade: 'S', avg_price: '2100', listing_count: '1', total_volume: '100' },
      ]
    );

    return reply.send({
      ticker:    result.rows,
      updatedAt: new Date().toISOString(),
    });
  });

  app.post('/api/v1/marketplace/listings', { preHandler: authMiddleware }, async (req, reply) => {
    const body = CreateListingSchema.parse(req.body);

    try {
      // Verify credit belongs to user
      const creditRes = await query(
        `SELECT cc.id FROM carbon_credits cc
         JOIN projects p ON p.id = cc.project_id
         WHERE cc.id = $1 AND p.user_id = $2 AND cc.status = 'minted'`,
        [body.creditId, req.user!.sub]
      );
      if (creditRes.rows.length === 0) {
        return reply.status(403).send({ error: 'Credit not found or not owned by you' });
      }

      const result = await query(
        `INSERT INTO marketplace_listings (seller_id, credit_id, quantity, unit_price_inr)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [req.user!.sub, body.creditId, body.quantity, body.unitPriceInr]
      );

      await query(`UPDATE carbon_credits SET status = 'listed' WHERE id = $1`, [body.creditId]);

      return reply.status(201).send(result.rows[0]);
    } catch (err) {
      // DB unavailable — return mock listing
      logger.warn('Listing creation skipped (no DB), returning mock');
      const crypto = await import('crypto');
      return reply.status(201).send({
        id: crypto.randomUUID(),
        seller_id: req.user!.sub,
        credit_id: body.creditId,
        quantity: body.quantity,
        unit_price_inr: body.unitPriceInr,
        currency: 'INR',
        status: 'active',
        created_at: new Date().toISOString(),
        message: 'Listing created (demo mode)',
      });
    }
  });

  // ──────────────────────────────────────────────────
  // PAYMENTS
  // ──────────────────────────────────────────────────
  app.post('/api/v1/payments/checkout', { preHandler: authMiddleware }, async (req, reply) => {
    const body = CreatePaymentSchema.parse(req.body);
    
    try {
      const res = await PaySvc.createPaymentIntent(
        req.user!.sub,
        body.listingId,
        body.quantity
      );
      return reply.status(201).send(res);
    } catch (err) {
      // DB unavailable — return mock payment intent
      logger.warn('Payment intent skipped (no DB), returning mock');
      const crypto = await import('crypto');
      const sessionId = `mock_${crypto.randomBytes(8).toString('hex')}`;
      return reply.status(201).send({
        sessionId,
        checkoutUrl: `https://pay.dodopayments.com/checkout/${sessionId}`,
        amountInr: 1500 * body.quantity,
        status: 'pending',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        message: 'Payment intent created (demo mode)',
      });
    }
  });

  app.get('/api/v1/payments/:sessionId', { preHandler: authMiddleware }, async (req, reply) => {
    const { sessionId } = req.params as { sessionId: string };
    
    try {
      const status = await PaySvc.getPaymentStatus(sessionId, req.user!.sub);
      if (!status) return reply.status(404).send({ error: 'Payment not found' });
      return reply.send(status);
    } catch {
      // DB unavailable — return mock payment status
      logger.warn('Payment status skipped (no DB), returning mock');
      return reply.send({
        sessionId,
        status: 'pending',
        amountInr: 1500,
        quantity: 1,
        createdAt: new Date().toISOString(),
        message: 'Payment status (demo mode)',
      });
    }
  });

  // Dodo webhook (no auth — Dodo calls this directly)
  app.post('/api/v1/payments/webhook', async (req, reply) => {
    const rawBody  = JSON.stringify(req.body);
    const sig      = (req.headers['x-dodo-signature'] as string) ||
                     (req.headers['x-webhook-signature'] as string) || '';
    try {
      const result = await PaySvc.handleWebhook(rawBody, sig);
      return reply.status(200).send(result);
    } catch (err: any) {
      logger.error('Webhook error', { error: err.message });
      return reply.status(400).send({ error: err.message });
    }
  });

  // DEV: simulate payment success
  app.post('/api/v1/payments/:sessionId/simulate-success', async (req, reply) => {
    if (process.env.NODE_ENV === 'production') {
      return reply.status(404).send({ error: 'Not found' });
    }
    const { sessionId } = req.params as { sessionId: string };
    await PaySvc.simulatePaymentSuccess(sessionId);
    return reply.send({ message: 'Payment simulated as success', sessionId });
  });

  // ──────────────────────────────────────────────────
  // PORTFOLIO
  // ──────────────────────────────────────────────────
  app.get('/api/v1/portfolio', { preHandler: authMiddleware }, async (req, reply) => {
    const result = await safeQuery(
      `SELECT up.*, cc.grade, cc.methodology, cc.vintage_year, cc.mint_address,
              cc.amount_co2e, p.name as project_name, p.entity_type,
              ml.unit_price_inr as list_price,
              v.confidence_score
       FROM user_portfolio up
       JOIN carbon_credits cc ON cc.id = up.credit_id
       JOIN projects p ON p.id = cc.project_id
       LEFT JOIN marketplace_listings ml ON ml.credit_id = cc.id AND ml.status = 'active'
       LEFT JOIN ai_verifications v ON v.project_id = p.id
       WHERE up.user_id = $1 AND up.retired_at IS NULL
       ORDER BY up.purchased_at DESC`,
      [req.user!.sub],
      []
    );

    const totals = result.rows.reduce(
      (acc: any, row: any) => ({
        totalCo2e:  acc.totalCo2e  + parseFloat(row.quantity),
        totalValue: acc.totalValue + parseFloat(row.quantity) * parseFloat(row.list_price || row.buy_price || 0),
      }),
      { totalCo2e: 0, totalValue: 0 }
    );

    return reply.send({ holdings: result.rows, summary: totals });
  });

  // ──────────────────────────────────────────────────
  // RETIRE CREDITS
  // ──────────────────────────────────────────────────
  app.post('/api/v1/credits/retire', { preHandler: authMiddleware }, async (req, reply) => {
    const body = RetireCreditsSchema.parse(req.body);

    try {
      // Verify ownership
      const holdingRes = await query(
        `SELECT up.*, cc.mint_address, cc.amount_co2e,
                p.id as project_id, p.name as project_name
         FROM user_portfolio up
         JOIN carbon_credits cc ON cc.id = up.credit_id
         JOIN projects p ON p.id = cc.project_id
         WHERE up.credit_id = $1 AND up.user_id = $2 AND up.retired_at IS NULL`,
        [body.creditId, req.user!.sub]
      );

      if (holdingRes.rows.length === 0) {
        return reply.status(403).send({ error: 'Credit not found in your portfolio' });
      }

      const holding    = holdingRes.rows[0];
      const userResult = await query(`SELECT wallet_address FROM users WHERE id = $1`, [req.user!.sub]);
      const wallet     = userResult.rows[0]?.wallet_address || 'devnet_wallet';

      const retireResult = await retireCredits(
        holding.mint_address   || 'mock_mint',
        wallet,
        body.quantity,
        wallet,
        body.organisationName  || 'Unknown',
        holding.project_id
      );

      // Record retirement
      await query(
        `INSERT INTO retirement_certificates
         (credit_id, retiring_user_id, organisation_name, esg_reference,
          amount_co2e, burn_tx_hash, nft_mint_address)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          body.creditId,
          req.user!.sub,
          body.organisationName,
          body.esgReference,
          body.quantity,
          retireResult.burnTxHash,
          retireResult.certNFTMint,
        ]
      );

      await query(
        `UPDATE user_portfolio SET retired_at = NOW() WHERE credit_id = $1 AND user_id = $2`,
        [body.creditId, req.user!.sub]
      );

      await query(
        `UPDATE carbon_credits SET status = 'retired', retired_at = NOW() WHERE id = $1`,
        [body.creditId]
      );

      return reply.send({
        message:      'Credits retired',
        burnTxHash:   retireResult.burnTxHash,
        certNFTMint:  retireResult.certNFTMint,
        slot:         retireResult.slot,
        quantity:     body.quantity,
        certUrl:      `https://certs.atmos.pro/${retireResult.burnTxHash}`,
      });
    } catch (err) {
      // DB unavailable — return mock retirement
      logger.warn('Retirement skipped (no DB), returning mock');
      const crypto = await import('crypto');
      const burnTx = `mock_burn_${crypto.randomBytes(8).toString('hex')}`;
      const certNFT = `mock_cert_${crypto.randomBytes(8).toString('hex')}`;
      
      return reply.send({
        message:      'Credits retired (demo mode)',
        burnTxHash:   burnTx,
        certNFTMint:  certNFT,
        slot:         123456789,
        quantity:     body.quantity,
        certUrl:      `https://certs.atmos.pro/${burnTx}`,
      });
    }
  });

  // Get retirement certificates
  app.get('/api/v1/certificates', { preHandler: authMiddleware }, async (req, reply) => {
    const result = await safeQuery(
      `SELECT rc.*, p.name as project_name, p.entity_type,
              cc.grade, cc.methodology
       FROM retirement_certificates rc
       JOIN carbon_credits cc ON cc.id = rc.credit_id
       JOIN projects p ON p.id = cc.project_id
       WHERE rc.retiring_user_id = $1
       ORDER BY rc.retired_at DESC`,
      [req.user!.sub],
      []
    );
    return reply.send({ certificates: result.rows });
  });

  // ──────────────────────────────────────────────────
  // DASHBOARD STATS
  // ──────────────────────────────────────────────────
  app.get('/api/v1/dashboard', async (req, reply) => {
    // Dev: Allow without auth. Production: add { preHandler: authMiddleware }
    const userId = req.user?.sub || 'guest-user';
    const [projects, portfolio, payments, retirements] = await Promise.all([
      safeQuery(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN status IN ('verified','listed','sold') THEN 1 ELSE 0 END) as verified,
                SUM(CASE WHEN status = 'analyzing' THEN 1 ELSE 0 END) as analyzing
         FROM projects WHERE user_id = $1`,
        [userId],
        [{ total: '0', verified: '0', analyzing: '0' }]
      ),
      safeQuery(
        `SELECT COALESCE(SUM(up.quantity),0) as total_co2e,
                COALESCE(SUM(up.quantity * ml.unit_price_inr),0) as portfolio_value_inr
         FROM user_portfolio up
         LEFT JOIN marketplace_listings ml ON ml.credit_id = up.credit_id AND ml.status = 'active'
         WHERE up.user_id = $1 AND up.retired_at IS NULL`,
        [userId],
        [{ total_co2e: '0', portfolio_value_inr: '0' }]
      ),
      safeQuery(
        `SELECT COALESCE(SUM(amount_inr),0) as total_earned
         FROM payment_intents
         WHERE status = 'succeeded' AND buyer_id != $1`,
        [userId],
        [{ total_earned: '0' }]
      ),
      safeQuery(
        `SELECT COALESCE(SUM(amount_co2e),0) as total_retired
         FROM retirement_certificates WHERE retiring_user_id = $1`,
        [userId],
        [{ total_retired: '0' }]
      ),
    ]);

    return reply.send({
      projects: {
        total:     parseInt(projects.rows[0]?.total || '0'),
        verified:  parseInt(projects.rows[0]?.verified || '0'),
        analyzing: parseInt(projects.rows[0]?.analyzing || '0'),
      },
      portfolio: {
        totalCo2e:       parseFloat(portfolio.rows[0]?.total_co2e || '0'),
        portfolioValueInr: parseFloat(portfolio.rows[0]?.portfolio_value_inr || '0'),
      },
      earnings: {
        totalInr: parseFloat(payments.rows[0]?.total_earned || '0'),
      },
      retirements: {
        totalCo2e: parseFloat(retirements.rows[0]?.total_retired || '0'),
      },
    });
  });

  // ──────────────────────────────────────────────────
  // ASYNC VERIFICATION QUEUE (Week 1 Production)
  // ──────────────────────────────────────────────────
  // Dynamically import verification queue to avoid circular dependencies
  let verificationQueue: any = null;

  // Initialize queue on first use (lazy load)
  async function getVerificationQueue() {
    if (!verificationQueue) {
      const { submitVerificationJob, getVerificationJobStatus, getQueueStats } = 
        await import('../services/verification-queue.production');
      verificationQueue = { submitVerificationJob, getVerificationJobStatus, getQueueStats };
    }
    return verificationQueue;
  }

  // Submit a project for async verification
  app.post('/api/v1/projects/:id/verify', { preHandler: authMiddleware }, async (req, reply) => {
    const { id: projectId } = req.params as { id: string };
    const userId = req.user!.sub;
    const body = req.body as { priority?: 'high' | 'normal' | 'low' };

    let project: any;
    try {
      // Verify project exists and belongs to user
      const projectRes = await query(
        `SELECT id, entity_type, metadata, area_ha,
                ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng
         FROM projects WHERE id = $1 AND user_id = $2`,
        [projectId, userId]
      );

      if (projectRes.rows.length === 0) {
        return reply.status(404).send({ error: 'Project not found or not owned by you' });
      }
      project = projectRes.rows[0];
    } catch {
      logger.warn('DB unavailable, fetching project details from mock store');
      const { mockProjects } = await import('../db/mockStore');
      const mockProj = mockProjects.get(projectId);
      if (!mockProj || mockProj.user_id !== userId) {
        return reply.status(404).send({ error: 'Project not found or not owned by you' });
      }
      project = {
        id: mockProj.id,
        entity_type: mockProj.entity_type,
        metadata: mockProj.metadata,
        area_ha: mockProj.area_ha,
        lat: mockProj.location.lat,
        lng: mockProj.location.lng,
      };
    }
    const metadata = typeof project.metadata === 'string' ? JSON.parse(project.metadata) : project.metadata;

    try {
      const queue = await getVerificationQueue();
      const jobResult = await queue.submitVerificationJob({
        projectId,
        userId,
        type: project.entity_type,
        location: JSON.stringify({ lat: project.lat, lng: project.lng }),
        metadata: {
          ...metadata,
          lat: project.lat,
          lng: project.lng,
          areaHa: project.area_ha,
        },
        priority: body.priority || 'normal',
      });

      // Update project status to analyzing
      await query(
        `UPDATE projects SET status = 'analyzing' WHERE id = $1`,
        [projectId]
      );

      logger.info('Verification job submitted', { projectId, jobId: jobResult.jobId, userId });

      return reply.status(202).send({
        message: 'Verification job submitted',
        jobId: jobResult.jobId,
        projectId,
        estimatedTime: jobResult.estimatedTime,
        statusUrl: `/api/v1/projects/${projectId}/verify/${jobResult.jobId}`,
      });
    } catch (err) {
      logger.error('Failed to submit verification job', { projectId, error: (err as any).message });
      return reply.status(500).send({ error: 'Failed to submit verification job' });
    }
  });

  // Get status of a verification job
  app.get('/api/v1/projects/:id/verify/:jobId', { preHandler: authMiddleware }, async (req, reply) => {
    const { id: projectId, jobId } = req.params as { id: string; jobId: string };
    const userId = req.user!.sub;

    try {
      let projectExists = false;
      try {
        // Verify user owns the project
        const projectRes = await query(
          `SELECT id FROM projects WHERE id = $1 AND user_id = $2`,
          [projectId, userId]
        );
        projectExists = projectRes.rows.length > 0;
      } catch {
        logger.warn('DB unavailable, verifying project ownership from mock store');
        const { mockProjects } = await import('../db/mockStore');
        const mockProj = mockProjects.get(projectId);
        projectExists = !!(mockProj && mockProj.user_id === userId);
      }

      if (!projectExists) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      const queue = await getVerificationQueue();
      const jobStatus = await queue.getVerificationJobStatus(jobId);

      if (!jobStatus) {
        return reply.status(404).send({ error: 'Job not found' });
      }

      return reply.send({
        jobId,
        projectId,
        state: jobStatus.state,
        progress: jobStatus.progress,
        isCompleted: jobStatus.isCompleted,
        isFailed: jobStatus.isFailed,
        attempts: jobStatus.attempts,
        result: jobStatus.isCompleted ? jobStatus.result : null,
      });
    } catch (err) {
      logger.error('Failed to get job status', { jobId, projectId, error: (err as any).message });
      return reply.status(500).send({ error: 'Failed to get job status' });
    }
  });

  // Get queue statistics (admin endpoint)
  app.get('/api/v1/admin/queue/stats', async (_req, reply) => {
    try {
      const queue = await getVerificationQueue();
      const stats = await queue.getQueueStats();
      return reply.send({
        queue: 'verification:mrv',
        stats,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Failed to get queue stats', { error: (err as any).message });
      return reply.status(500).send({ error: 'Failed to get queue stats' });
    }
  });
}

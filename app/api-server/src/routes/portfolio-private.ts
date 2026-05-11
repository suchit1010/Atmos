/**
 * ATMOS — Private Portfolio Routes
 * ═════════════════════════════════════════════════════════════════
 * Encrypted portfolio management with Umbra viewing keys.
 *
 * Endpoints:
 *   GET  /api/portfolio
 *   POST /api/portfolio/viewing-key
 *   GET  /api/portfolio/compliance-report
 *   POST /api/portfolio/decrypt-transaction
 */

import { Router, Request, Response } from 'express';
import {
  getEncryptedPortfolio,
  getEncryptedBalance,
  generateViewingKey,
  decryptTransaction,
  generateComplianceReport,
} from '../lib/umbra';
import { query } from '../db/pool';
import { logger } from '../utils/logger';
import { requireAuth } from '../middleware/auth';

const router = Router();

// ─── GET: Encrypted Portfolio ───────────────────────────────────
/**
 * Get user's carbon credit portfolio with encrypted balances.
 * Only shows decrypted amounts if viewing key is provided.
 *
 * Query params:
 *   ?viewingKey=<key>  // Optional: decrypt with key
 *
 * Response (without key):
 * {
 *   "totalBalance": "abc123...",    // Encrypted
 *   "holdings": [
 *     {
 *       "projectId": "uuid",
 *       "encryptedAmount": "●●●●●",
 *       "acquiredAt": "2024-01-15T..."
 *     }
 *   ]
 * }
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { viewingKey } = req.query;

  try {
    const portfolio = await getEncryptedPortfolio(userId, viewingKey as string | undefined);

    // If viewing key provided, log audit trail
    if (viewingKey) {
      logger.audit('portfolio.decrypted', userId, {
        holdingCount: portfolio.holdings.length,
        totalBalance: portfolio.decryptedBalance,
      });
    }

    res.json({
      success: true,
      portfolio,
      privacyMode: viewingKey ? 'decrypted' : 'encrypted',
      message: viewingKey
        ? 'Portfolio decrypted with viewing key'
        : 'Portfolio encrypted. Provide viewing key to decrypt.',
    });
  } catch (err: any) {
    logger.error('Failed to get portfolio', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ─── POST: Generate Viewing Key ──────────────────────────────────
/**
 * Generate a viewing key for selective disclosure.
 * User can share with accountant/auditor/compliance officer.
 *
 * Request:
 * {
 *   "expiryDays": 365,  // Optional: null = never expires
 *   "purpose": "tax-reporting" | "audit" | "compliance"
 * }
 *
 * Response:
 * {
 *   "viewingKey": "abc123...",    // User keeps this secret
 *   "keyHash": "xyz789...",       // Shared with third party
 *   "expiresAt": "2025-01-15T..."
 * }
 */
router.post('/viewing-key', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { expiryDays = 365, purpose } = req.body;

  try {
    // Load user wallet
    const userResult = await query(`SELECT wallet_address FROM users WHERE id = $1`, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User wallet not found' });
    }

    const walletAddress = userResult.rows[0].wallet_address;

    // Generate viewing key
    const keyExport = await generateViewingKey(userId, walletAddress, expiryDays);

    logger.info('🔑 Viewing key generated', {
      userId: userId.slice(0, 8),
      purpose,
      expiresAt: keyExport.expiresAt,
    });

    res.json({
      success: true,
      viewingKey: keyExport.viewingKey,
      keyHash: keyExport.keyHash,
      generatedAt: keyExport.generatedAt,
      expiresAt: keyExport.expiresAt,
      message: `Viewing key generated for ${purpose || 'compliance'}. Keep your viewing key secure.`,
      instructions: {
        yourself: 'Use this key in query: GET /api/portfolio?viewingKey=<key>',
        shareWith: 'Share the key hash (not the key!) with your accountant/auditor',
        compliance:
          'They can decrypt individual transactions for reporting without seeing your full portfolio',
      },
    });
  } catch (err: any) {
    logger.error('Failed to generate viewing key', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ─── POST: Decrypt Single Transaction ────────────────────────────
/**
 * Decrypt a single Umbra transfer for compliance purposes.
 *
 * Request:
 * {
 *   "txHash": "umbra_sim_...",
 *   "viewingKey": "<viewing_key>"
 * }
 *
 * Response:
 * {
 *   "txHash": "...",
 *   "amount": 48,
 *   "tokenMint": "...",
 *   "timestamp": 1234567890,
 *   "projectId": "uuid"
 * }
 */
router.post('/decrypt-transaction', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { txHash, viewingKey } = req.body;

  try {
    if (!txHash || !viewingKey) {
      return res.status(400).json({ error: 'Missing txHash or viewingKey' });
    }

    const tx = await decryptTransaction(txHash, viewingKey, userId);

    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({
      success: true,
      transaction: tx,
      message: 'Transaction decrypted successfully',
    });
  } catch (err: any) {
    logger.error('Failed to decrypt transaction', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ─── GET: Compliance Report ──────────────────────────────────────
/**
 * Generate a comprehensive compliance/tax report for a date range.
 *
 * Query params:
 *   ?viewingKey=<key>&from=2024-01-01&to=2024-12-31
 *
 * Response:
 * {
 *   "transactions": [...],
 *   "totalReceived": 150.5,
 *   "totalSent": 89.3,
 *   "decryptedCount": 42
 * }
 */
router.get('/compliance-report', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { viewingKey, from, to } = req.query;

  try {
    if (!viewingKey) {
      return res.status(400).json({ error: 'Viewing key required for compliance report' });
    }

    const fromDate = from ? new Date(from as string) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to as string) : new Date();

    // Validate dates
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format (use ISO 8601)' });
    }

    const report = await generateComplianceReport(userId, viewingKey as string, fromDate, toDate);

    logger.audit('compliance_report.generated', userId, {
      transactionCount: report.decryptedCount,
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
    });

    res.json({
      success: true,
      report: {
        ...report,
        period: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
        },
      },
      message: `Compliance report generated: ${report.decryptedCount} decrypted transactions`,
      export: {
        csv: `/api/portfolio/compliance-report/export.csv?viewingKey=${viewingKey}&from=${fromDate.toISOString()}&to=${toDate.toISOString()}`,
        json: `/api/portfolio/compliance-report/export.json?viewingKey=${viewingKey}&from=${fromDate.toISOString()}&to=${toDate.toISOString()}`,
      },
    });
  } catch (err: any) {
    logger.error('Failed to generate compliance report', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ─── GET: Export Compliance Report (CSV) ─────────────────────────
/**
 * Export compliance report as CSV for accounting software.
 */
router.get('/compliance-report/export.csv', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { viewingKey, from, to } = req.query;

  try {
    if (!viewingKey) {
      return res.status(400).json({ error: 'Viewing key required' });
    }

    const fromDate = from ? new Date(from as string) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to as string) : new Date();

    const report = await generateComplianceReport(userId, viewingKey as string, fromDate, toDate);

    // Convert to CSV
    const csvHeader = 'Date,Amount (CO2e),Token Mint,Transaction Hash,Project ID\n';
    const csvRows = report.transactions
      .map(
        (tx) =>
          `${new Date(tx.timestamp * 1000).toISOString()},${tx.amount},${tx.tokenMint},${tx.txHash},${tx.projectId}`
      )
      .join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="atmos-compliance-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err: any) {
    logger.error('Failed to export CSV', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ─── GET: Balance Summary ────────────────────────────────────────
/**
 * Quick check of encrypted balance for a token.
 *
 * Query params:
 *   ?tokenMint=<mint>&viewingKey=<key>
 */
router.get('/balance/:tokenMint', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { tokenMint } = req.params;
  const { viewingKey } = req.query;

  try {
    // Load user wallet
    const userResult = await query(`SELECT wallet_address FROM users WHERE id = $1`, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User wallet not found' });
    }

    const userWallet = userResult.rows[0].wallet_address;

    const balance = await getEncryptedBalance(userWallet, tokenMint, viewingKey as string | undefined);

    res.json({
      success: true,
      tokenMint,
      ...balance,
      message: viewingKey
        ? `Balance: ${balance.decryptedAmount} tonnes CO2e`
        : 'Balance encrypted. Provide viewing key to decrypt.',
    });
  } catch (err: any) {
    logger.error('Failed to get balance', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

export default router;

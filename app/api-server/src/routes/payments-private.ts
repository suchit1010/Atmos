/**
 * ATMOS — Private Payment Routes
 * ═════════════════════════════════════════════════════════════════
 * Umbra-integrated payment endpoints for private carbon credit purchases.
 *
 * Endpoints:
 *   POST /api/payments/carbon-purchase
 *   POST /api/payments/private-settlement
 *   GET  /api/payments/private-status/:paymentId
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import {
  sendPrivateTransfer,
  getEncryptedBalance,
  generateViewingKey,
  PrivateTransferRequest,
} from '../lib/umbra';
import { query } from '../db/pool';
import { logger } from '../utils/logger';
import { requireAuth } from '../middleware/auth';

const router = Router();

// ─── POST: Carbon Purchase (with privacy option) ─────────────────
/**
 * Create a carbon credit purchase with optional Umbra privacy.
 *
 * Request:
 * {
 *   "projectId": "uuid",
 *   "quantity": 48,
 *   "paymentMethod": "umbra-private" | "public",
 *   "currency": "INR"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "purchaseId": "uuid",
 *   "transactionHash": "umbra_sim_...",
 *   "privacyMode": "private" | "public",
 *   "umbraCommitment": "abc123..."
 * }
 */
router.post('/carbon-purchase', requireAuth, async (req: Request, res: Response) => {
  const { projectId, quantity, paymentMethod, currency } = req.body;
  const userId = (req as any).user.id;

  try {
    // Validation
    if (!projectId || !quantity || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['umbra-private', 'public'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid paymentMethod' });
    }

    // ── Load project ─────────────────────────────────────────
    const projectResult = await query(
      `SELECT id, user_id, verification_status, token_mint_address 
       FROM projects WHERE id = $1`,
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];

    if (project.verification_status !== 'verified') {
      return res.status(400).json({
        error: `Project verification status is ${project.verification_status}. Must be 'verified'`,
      });
    }

    if (!project.token_mint_address) {
      return res.status(400).json({ error: 'Project has not been tokenized yet' });
    }

    // ── Load buyer wallet ────────────────────────────────────
    const userResult = await query(
      `SELECT wallet_address FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User wallet not found' });
    }

    const buyerWallet = userResult.rows[0].wallet_address;

    // ── Calculate amounts ────────────────────────────────────
    const tokenPrice = 10000; // 100 INR in paise per tonne
    const totalAmountPaise = quantity * tokenPrice;
    const decimals = 6;
    const amountLamports = BigInt(quantity * Math.pow(10, decimals));

    // ── Create payment intent ────────────────────────────────
    const paymentIntentResult = await query(
      `INSERT INTO payment_intents (
        user_id, project_id, quantity, amount_paise, currency, 
        payment_method, status, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,'pending',NOW())
      RETURNING id`,
      [userId, projectId, quantity, totalAmountPaise, currency, paymentMethod]
    );

    const paymentIntentId = paymentIntentResult.rows[0].id;

    let umbra Result: any = null;
    let umbraCommitment: string | null = null;

    // ── PRIVATE: Use Umbra ───────────────────────────────────
    if (paymentMethod === 'umbra-private') {
      try {
        // Load buyer's keypair
        const buyerKeypair = Keypair.fromSecretKey(
          bs58.decode(process.env.SOLANA_WALLET_PRIVATE_KEY || '')
        );

        // Initiate Umbra transfer
        umbraResult = await sendPrivateTransfer({
          senderKeypair: buyerKeypair,
          recipientWallet: project.user_id, // Seller's wallet
          tokenMint: project.token_mint_address,
          amountLamports,
          projectId,
          paymentIntentId,
          memo: `ATMOS-Carbon-Purchase-${projectId.slice(0, 8)}`,
        });

        umbraCommitment = umbraResult.viewingKeyHint;

        // Update payment intent with Umbra details
        await query(
          `UPDATE payment_intents 
           SET status='processing', umbra_commitment=$1, umbra_tx_hash=$2 
           WHERE id=$3`,
          [umbraCommitment, umbraResult.txHash, paymentIntentId]
        );

        logger.info('🔐 Private purchase initiated via Umbra', {
          projectId: projectId.slice(0, 8),
          quantity,
          commitment: umbraCommitment.slice(0, 12),
        });
      } catch (err: any) {
        logger.error('Umbra transfer failed', { error: err.message });
        return res.status(500).json({ error: `Private transfer failed: ${err.message}` });
      }
    } else {
      // ── PUBLIC: Dodo payment ─────────────────────────────────
      const dodoCheckoutUrl = `https://test.checkout.dodopayments.com/buy/pdt_0NeTZC7YUIaCtJSBukmEK?quantity=${quantity}&redirect_url=https://www.atmosexample.com`;

      await query(
        `UPDATE payment_intents 
         SET dodo_checkout_url=$1, status='awaiting_payment' 
         WHERE id=$2`,
        [dodoCheckoutUrl, paymentIntentId]
      );

      logger.info('🔓 Public purchase initiated via Dodo', {
        projectId: projectId.slice(0, 8),
        quantity,
      });
    }

    // ── Return response ──────────────────────────────────────
    res.json({
      success: true,
      purchaseId: paymentIntentId,
      projectId,
      quantity,
      totalAmount: totalAmountPaise,
      currency,
      privacyMode: paymentMethod === 'umbra-private' ? 'private' : 'public',
      ...(umbraResult && {
        transactionHash: umbraResult.txHash,
        stealthAddress: umbraResult.stealthAddress,
        umbraCommitment: umbraCommitment,
      }),
      message:
        paymentMethod === 'umbra-private'
          ? `🔐 Private purchase created. Amount hidden from public ledger. Commitment: ${umbraCommitment}`
          : `🔓 Public purchase ready. Redirecting to Dodo checkout.`,
    });
  } catch (err: any) {
    logger.error('Carbon purchase error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ─── GET: Private Settlement Status ──────────────────────────────
/**
 * Check status of private payment (Umbra transfer).
 * GET /api/payments/private-status/:paymentId
 */
router.get('/private-status/:paymentId', requireAuth, async (req: Request, res: Response) => {
  const { paymentId } = req.params;
  const userId = (req as any).user.id;

  try {
    const paymentResult = await query(
      `SELECT * FROM payment_intents 
       WHERE id=$1 AND user_id=$2`,
      [paymentId, userId]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentResult.rows[0];

    // If private: lookup Umbra transfer
    let umbraStatus = null;
    if (payment.umbra_tx_hash) {
      const umbraResult = await query(
        `SELECT tx_hash, status, stealth_address FROM umbra_transfers 
         WHERE tx_hash=$1`,
        [payment.umbra_tx_hash]
      );

      if (umbraResult.rows.length > 0) {
        umbraStatus = {
          txHash: umbraResult.rows[0].tx_hash,
          status: umbraResult.rows[0].status,
          stealthAddress: umbraResult.rows[0].stealth_address,
        };
      }
    }

    res.json({
      success: true,
      paymentId,
      status: payment.status,
      projectId: payment.project_id,
      quantity: payment.quantity,
      amount: payment.amount_paise,
      privacyMode: payment.payment_method === 'umbra-private' ? 'private' : 'public',
      umbraStatus,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
    });
  } catch (err: any) {
    logger.error('Failed to get payment status', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ─── POST: Complete Private Settlement ───────────────────────────
/**
 * Complete a private payment after user confirms on Dodo/wallet.
 * POST /api/payments/private-settlement
 *
 * This is called after Dodo redirect or after Umbra transfer confirms on-chain.
 */
router.post('/private-settlement', requireAuth, async (req: Request, res: Response) => {
  const { paymentIntentId, dodoTransactionId, walletSignature } = req.body;
  const userId = (req as any).user.id;

  try {
    // Load payment intent
    const paymentResult = await query(
      `SELECT * FROM payment_intents WHERE id=$1 AND user_id=$2`,
      [paymentIntentId, userId]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment intent not found' });
    }

    const payment = paymentResult.rows[0];

    // Update status based on payment method
    if (payment.payment_method === 'umbra-private') {
      // Private: Umbra transfer already happened
      await query(
        `UPDATE payment_intents SET status='completed', updated_at=NOW() WHERE id=$1`,
        [paymentIntentId]
      );

      logger.audit('umbra.settlement.completed', userId, {
        paymentId: paymentIntentId,
        projectId: payment.project_id,
        amount: payment.amount_paise,
      });

      res.json({
        success: true,
        message: '🔐 Private settlement completed. Your carbon credits are now in your encrypted portfolio.',
        purchaseId: paymentIntentId,
      });
    } else {
      // Public: Dodo payment confirmation
      if (!dodoTransactionId) {
        return res.status(400).json({ error: 'Missing dodoTransactionId' });
      }

      await query(
        `UPDATE payment_intents 
         SET status='completed', dodo_transaction_id=$1, updated_at=NOW() 
         WHERE id=$2`,
        [dodoTransactionId, paymentIntentId]
      );

      logger.audit('dodo.settlement.completed', userId, {
        paymentId: paymentIntentId,
        dodoTxId: dodoTransactionId,
      });

      res.json({
        success: true,
        message: '🔓 Public purchase completed. Your carbon credits are now active in the marketplace.',
        purchaseId: paymentIntentId,
      });
    }
  } catch (err: any) {
    logger.error('Settlement error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

export default router;

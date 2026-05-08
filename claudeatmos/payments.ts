/**
 * KARTA Payment Service — Dodo Payments Integration
 * ─────────────────────────────────────────────────────
 * Flow:
 *  1. Create checkout session → return URL to mobile
 *  2. Mobile opens Dodo checkout
 *  3. Webhook confirms success/failure
 *  4. On success → trigger Solana settlement
 */

import { query, transaction } from '../db/pool';
import { logger, log }         from '../utils/logger';
import crypto                  from 'crypto';

const DODO_URL    = process.env.DODO_API_URL    || 'https://api.dodopayments.com/v1';
const DODO_KEY    = process.env.DODO_API_KEY    || '';
const DODO_SECRET = process.env.DODO_WEBHOOK_SECRET || 'dev-webhook-secret';

// ─── Create Dodo checkout session ────────────────────
export async function createPaymentIntent(
  buyerId:    string,
  listingId:  string,
  quantity:   number
): Promise<{
  sessionId:   string;
  checkoutUrl: string;
  expiresAt:   Date;
  amountInr:   number;
}> {
  // Load listing
  const listingRes = await query(
    `SELECT ml.*, cc.amount_co2e, cc.grade, p.name as project_name,
            u.name as seller_name
     FROM marketplace_listings ml
     JOIN carbon_credits cc ON cc.id = ml.credit_id
     JOIN projects p ON p.id = cc.project_id
     JOIN users u ON u.id = ml.seller_id
     WHERE ml.id = $1 AND ml.status = 'active'`,
    [listingId]
  );

  if (listingRes.rows.length === 0) throw new Error('Listing not found or not active');

  const listing    = listingRes.rows[0];
  const unitPrice  = parseFloat(listing.unit_price_inr);
  const available  = parseFloat(listing.quantity);

  if (quantity > available) throw new Error(`Only ${available} tCO₂e available`);

  const subtotal    = unitPrice * quantity;
  const platformFee = Math.round(subtotal * 0.015);  // 1.5%
  const totalInr    = subtotal + platformFee;
  const expiresAt   = new Date(Date.now() + 30 * 60 * 1000); // 30 min

  // Call Dodo Payments API
  let sessionId   = '';
  let checkoutUrl = '';

  if (DODO_KEY) {
    try {
      const res = await fetch(`${DODO_URL}/payment-intents`, {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${DODO_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          amount:          Math.round(totalInr * 100), // paise
          currency:        'INR',
          payment_methods: ['upi', 'card', 'netbanking', 'wallet'],
          description:     `Carbon Credits: ${listing.project_name} (${quantity} tCO₂e)`,
          metadata: {
            buyerId,
            listingId,
            quantity,
            grade:        listing.grade,
            projectName:  listing.project_name,
          },
          webhook_url:  `${process.env.API_URL}/api/v1/payments/webhook`,
          redirect_url: `${process.env.APP_URL || 'karta://payment'}/success`,
          cancel_url:   `${process.env.APP_URL || 'karta://payment'}/cancel`,
          expires_at:   expiresAt.toISOString(),
        }),
      });

      if (res.ok) {
        const data = await res.json() as any;
        sessionId   = data.session_id || data.id;
        checkoutUrl = data.checkout_url || data.url;
      } else {
        logger.warn('Dodo API returned error, using mock', { status: res.status });
      }
    } catch (err: any) {
      logger.warn('Dodo API unreachable, using mock', { error: err.message });
    }
  }

  // Fallback mock for development
  if (!sessionId) {
    sessionId   = 'mock_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    checkoutUrl = `https://checkout.dodopayments.com/mock/${sessionId}`;
    logger.warn('Using mock Dodo session (dev mode)', { sessionId });
  }

  // Persist payment intent
  await query(
    `INSERT INTO payment_intents
     (dodo_session_id, buyer_id, listing_id, amount_inr, quantity,
      status, checkout_url, expires_at)
     VALUES ($1,$2,$3,$4,$5,'pending',$6,$7)`,
    [sessionId, buyerId, listingId, totalInr, quantity, checkoutUrl, expiresAt]
  );

  log.audit('payment.created', buyerId, { sessionId, amountInr: totalInr, quantity });

  return { sessionId, checkoutUrl, expiresAt, amountInr: totalInr };
}

// ─── Process webhook from Dodo ────────────────────────
export async function handleWebhook(
  rawBody:   string,
  signature: string
): Promise<{ received: boolean; action: string }> {
  // Verify webhook signature
  const expected = crypto
    .createHmac('sha256', DODO_SECRET)
    .update(rawBody)
    .digest('hex');

  if (signature !== expected && signature !== `sha256=${expected}`) {
    // In dev mode, skip verification
    if (process.env.NODE_ENV !== 'development') {
      logger.warn('Invalid webhook signature');
      throw new Error('Invalid webhook signature');
    }
  }

  const payload = JSON.parse(rawBody);
  const { event_type, data } = payload;

  logger.info('Dodo webhook received', { event_type, session: data?.session_id });

  switch (event_type) {
    case 'payment_intent.succeeded':
    case 'payment.completed':
      await onPaymentSuccess(data);
      return { received: true, action: 'payment_processed' };

    case 'payment_intent.failed':
    case 'payment.failed':
      await onPaymentFailed(data);
      return { received: true, action: 'payment_failed' };

    case 'payment_intent.expired':
      await onPaymentExpired(data);
      return { received: true, action: 'payment_expired' };

    default:
      logger.debug('Unhandled webhook event', { event_type });
      return { received: true, action: 'ignored' };
  }
}

// ─── On successful payment ────────────────────────────
async function onPaymentSuccess(data: any): Promise<void> {
  const sessionId = data.session_id || data.id;

  const intentRes = await query(
    `SELECT * FROM payment_intents WHERE dodo_session_id = $1`,
    [sessionId]
  );

  if (intentRes.rows.length === 0) {
    logger.warn('Payment intent not found for session', { sessionId });
    return;
  }

  const intent = intentRes.rows[0];
  if (intent.status === 'succeeded') return; // idempotent

  await transaction(async (client) => {
    // Update payment intent
    await client.query(
      `UPDATE payment_intents
       SET status = 'succeeded', completed_at = NOW()
       WHERE dodo_session_id = $1`,
      [sessionId]
    );

    // Get credit from listing
    const creditRes = await client.query(
      `SELECT credit_id FROM marketplace_listings WHERE id = $1`,
      [intent.listing_id]
    );
    const creditId = creditRes.rows[0]?.credit_id;

    if (creditId) {
      // Add to buyer portfolio
      await client.query(
        `INSERT INTO user_portfolio (user_id, credit_id, quantity, buy_price)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (user_id, credit_id) DO UPDATE
         SET quantity = user_portfolio.quantity + $3`,
        [intent.buyer_id, creditId, intent.quantity, intent.amount_inr / intent.quantity]
      );

      // Update credit status + listing
      await client.query(
        `UPDATE carbon_credits SET status = 'sold' WHERE id = $1`,
        [creditId]
      );
      await client.query(
        `UPDATE marketplace_listings SET status = 'sold', sold_at = NOW() WHERE id = $1`,
        [intent.listing_id]
      );
    }

    // Create settlement record
    await client.query(
      `INSERT INTO settlements (payment_id, buyer_id, credit_id, amount_co2e, status)
       VALUES ($1,$2,$3,$4,'pending')`,
      [intent.id, intent.buyer_id, creditId, intent.quantity]
    );
  });

  log.audit('payment.succeeded', intent.buyer_id, {
    sessionId, amountInr: intent.amount_inr, quantity: intent.quantity,
  });

  logger.info('Payment succeeded — portfolio updated', { sessionId, buyerId: intent.buyer_id });
}

async function onPaymentFailed(data: any): Promise<void> {
  const sessionId = data.session_id || data.id;
  await query(
    `UPDATE payment_intents SET status = 'failed', error_message = $1 WHERE dodo_session_id = $2`,
    [data.error?.message || 'Payment failed', sessionId]
  );
}

async function onPaymentExpired(data: any): Promise<void> {
  const sessionId = data.session_id || data.id;
  await query(
    `UPDATE payment_intents SET status = 'expired' WHERE dodo_session_id = $1`,
    [sessionId]
  );
}

// ─── Mock payment success (dev/testing) ───────────────
export async function simulatePaymentSuccess(sessionId: string): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Not available in production');
  }
  await onPaymentSuccess({ session_id: sessionId });
}

// ─── Get payment status ───────────────────────────────
export async function getPaymentStatus(sessionId: string, buyerId: string) {
  const result = await query(
    `SELECT pi.*, ml.quantity as listing_qty, cc.grade, cc.amount_co2e,
            p.name as project_name
     FROM payment_intents pi
     LEFT JOIN marketplace_listings ml ON ml.id = pi.listing_id
     LEFT JOIN carbon_credits cc ON cc.id = ml.credit_id
     LEFT JOIN projects p ON p.id = cc.project_id
     WHERE pi.dodo_session_id = $1 AND pi.buyer_id = $2`,
    [sessionId, buyerId]
  );
  return result.rows[0] || null;
}

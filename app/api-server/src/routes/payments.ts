import { Router } from "express";
import crypto from "crypto";

const router = Router();

const DODO_BASE_URL = "https://api.dodopayments.com";
const DODO_API_KEY = process.env["DODO_API_KEY"] ?? "";
const DODO_WEBHOOK_SECRET = process.env["DODO_WEBHOOK_SECRET"] ?? "";
const DODO_MODE = process.env["DODO_MODE"] ?? "live";

// Real Dodo product ID for ATMOS carbon assets
const DODO_PRODUCT_ID = "pdt_0NeRjRfS1WBxeKVY8XD7f";

const processedWebhookEventIds = new Set<string>();

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  const aBuf = Buffer.from(a, "hex");
  const bBuf = Buffer.from(b, "hex");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
  if (!DODO_WEBHOOK_SECRET) return false;
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha256", DODO_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  const normalizedSignature = signature.toLowerCase().replace(/^sha256=/, "");
  return timingSafeEqualHex(expected, normalizedSignature);
}

function extractEventId(event: Record<string, unknown>): string {
  const directId = event.id;
  if (typeof directId === "string" && directId.trim()) return directId;

  const eventId = event.event_id;
  if (typeof eventId === "string" && eventId.trim()) return eventId;

  const data = event.data;
  if (data && typeof data === "object") {
    const nestedId = (data as Record<string, unknown>).id;
    if (typeof nestedId === "string" && nestedId.trim()) return nestedId;
  }

  return "";
}

// Create a Dodo payment session
router.post("/payments/dodo/create", async (req, res) => {
  const { amount, currency, assetName, assetId, quantity, buyerName, buyerEmail } = req.body;

  if (!amount || !assetId) {
    res.status(400).json({ error: "amount and assetId are required" });
    return;
  }

  try {
    if (DODO_MODE === "demo") {
      res.json({
        success: true,
        paymentId: `dodo_demo_${Date.now()}`,
        paymentUrl: `https://demo.atmos.local/payment-success?assetId=${assetId}`,
        amount,
        currency,
        mock: true,
        mode: "demo",
      });
      return;
    }

    const payload = {
      billing: {
        city: "Mumbai",
        country: "IN",
        state: "Maharashtra",
        street: "123 Carbon Street",
        zipcode: "400001",
      },
      customer: {
        email: buyerEmail ?? "buyer@atmos.protocol",
        name: buyerName ?? "ATMOS User",
        phone_number: "+919876543210",
        create_new_customer: true,
      },
      product_cart: [
        {
          product_id: DODO_PRODUCT_ID,
          quantity: quantity ?? 1,
        },
      ],
      payment_link: true,
      return_url: `https://atmos.protocol/settlement?assetId=${assetId}`,
      metadata: {
        asset_id: assetId,
        asset_name: assetName ?? "Carbon Asset",
        platform: "atmos_mobile",
      },
    };

    const response = await fetch(`${DODO_BASE_URL}/v1/payments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DODO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as Record<string, unknown>;

    if (!response.ok) {
      req.log.error({ data, status: response.status }, "Dodo API error");
      // Return mock payment URL for demo fallback (still uses real product ID)
      res.json({
        success: true,
        paymentId: `dodo_${Date.now()}`,
        paymentUrl: `https://checkout.dodopayments.com/buy/${DODO_PRODUCT_ID}?quantity=${quantity ?? 1}&redirect_url=https://atmos.protocol/settlement?assetId=${assetId}`,
        amount,
        currency,
        mock: true,
        mode: "fallback",
      });
      return;
    }

    res.json({
      success: true,
      paymentId: (data as any).payment_id ?? `dodo_${Date.now()}`,
      paymentUrl: (data as any).payment_link ?? `https://checkout.dodopayments.com/pay/${(data as any).payment_id}`,
      amount,
      currency,
      mock: false,
      mode: "live",
    });
  } catch (err) {
    req.log.error({ err }, "Payment creation failed");
    // Graceful fallback for demo (uses real product ID)
    res.json({
      success: true,
      paymentId: `dodo_demo_${Date.now()}`,
      paymentUrl: `https://checkout.dodopayments.com/buy/${DODO_PRODUCT_ID}?quantity=${quantity ?? 1}&redirect_url=https://atmos.protocol/settlement?assetId=${assetId}`,
      amount,
      currency,
      mock: true,
      mode: "fallback",
    });
  }
});

// Webhook handler for Dodo payment events
router.post("/payments/dodo/webhook", (req, res) => {
  const rawBody = safeStringify(req.body);
  const signature = req.header("x-dodo-signature") ?? req.header("x-dodo-webhook-signature") ?? undefined;

  if (!verifyWebhookSignature(rawBody, signature)) {
    req.log.warn({ hasSecret: !!DODO_WEBHOOK_SECRET, hasSignature: !!signature }, "Rejected Dodo webhook");
    res.status(401).json({ error: "invalid webhook signature" });
    return;
  }

  const event = req.body as Record<string, unknown>;
  const eventId = extractEventId(event);

  if (eventId && processedWebhookEventIds.has(eventId)) {
    req.log.info({ eventId }, "Duplicate Dodo webhook ignored");
    res.json({ received: true, duplicate: true });
    return;
  }

  if (eventId) {
    processedWebhookEventIds.add(eventId);
  }

  req.log.info({ eventId, eventType: event.type ?? event.event_type ?? "unknown" }, "Dodo webhook received");

  // In production: persist payment status updates and trigger settlement jobs here.
  res.json({ received: true, duplicate: false });
});

export default router;

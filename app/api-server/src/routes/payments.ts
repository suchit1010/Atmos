import { Router } from "express";
import crypto from "crypto";
import { settlementStore } from "../lib/settlement-store";
import { retireCredits } from "../lib/solana";

const router = Router();

const DODO_BASE_URL = "https://api.dodopayments.com";
const DODO_CHECKOUT_BASE_URL = process.env["DODO_CHECKOUT_BASE_URL"] ?? "https://checkout.dodopayments.com";
const DODO_TEST_CHECKOUT_BASE_URL = process.env["DODO_TEST_CHECKOUT_BASE_URL"] ?? "https://test.checkout.dodopayments.com";
const DODO_API_KEY = process.env["DODO_API_KEY"] ?? "";
const DODO_WEBHOOK_SECRET = process.env["DODO_WEBHOOK_SECRET"] ?? "";
const DODO_MODE = process.env["DODO_MODE"] ?? "live";

// Test Dodo product ID for ATMOS carbon assets
const DODO_PRODUCT_ID = "pdt_0NeTZC7YUIaCtJSBukmEK";

const processedWebhookEventIds = new Set<string>();
const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function decodeWebhookSecret(secret: string): Buffer {
  const trimmed = secret.trim();
  const encoded = trimmed.startsWith("whsec_") ? trimmed.slice(6) : trimmed;
  try {
    return Buffer.from(encoded, "base64");
  } catch {
    return Buffer.from(trimmed, "utf8");
  }
}

function getRawBody(req: unknown): string {
  const rawBody = (req as { rawBody?: Buffer | string | Uint8Array }).rawBody;
  if (typeof rawBody === "string") return rawBody;
  if (rawBody instanceof Buffer) return rawBody.toString("utf8");
  if (rawBody instanceof Uint8Array) return Buffer.from(rawBody).toString("utf8");
  return "";
}

function verifyLegacySignature(rawBody: string, signature: string | undefined): boolean {
  if (!DODO_WEBHOOK_SECRET) return false;
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha256", DODO_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  const normalizedSignature = signature.toLowerCase().replace(/^sha256=/, "");
  return timingSafeEqual(expected, normalizedSignature);
}

function verifySvixSignature(
  rawBody: string,
  headers: { id: string; timestamp: string; signature: string },
): boolean {
  if (!DODO_WEBHOOK_SECRET) return false;
  if (!headers.id || !headers.timestamp || !headers.signature) return false;

  const timestamp = Number(headers.timestamp);
  if (!Number.isFinite(timestamp)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > WEBHOOK_TOLERANCE_SECONDS) return false;

  const signedContent = `${headers.id}.${headers.timestamp}.${rawBody}`;
  const secretBytes = decodeWebhookSecret(DODO_WEBHOOK_SECRET);
  const expectedSignature = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  const candidates = headers.signature
    .split(" ")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.replace(/^v\d+,/, ""));

  return candidates.some((candidate) => timingSafeEqual(expectedSignature, candidate));
}

function verifyWebhookSignature(req: unknown, rawBody: string): boolean {
  const headers = (req as {
    header?: (name: string) => string | undefined;
    get?: (name: string) => string | undefined;
  });
  const getHeader = (name: string): string | undefined => headers.header?.(name) ?? headers.get?.(name);

  const svixId = getHeader("svix-id") ?? getHeader("webhook-id") ?? "";
  const svixTimestamp = getHeader("svix-timestamp") ?? getHeader("webhook-timestamp") ?? "";
  const svixSignature = getHeader("svix-signature") ?? getHeader("webhook-signature") ?? "";

  if (svixId && svixTimestamp && svixSignature) {
    return verifySvixSignature(rawBody, { id: svixId, timestamp: svixTimestamp, signature: svixSignature });
  }

  const legacySignature = getHeader("x-dodo-signature") ?? getHeader("x-dodo-webhook-signature") ?? getHeader("x-webhook-signature") ?? undefined;
  return verifyLegacySignature(rawBody, legacySignature);
}

function extractEventId(event: Record<string, unknown>): string {
  const directId = event.id;
  if (typeof directId === "string" && directId.trim()) return directId;

  const eventId = event.event_id;
  if (typeof eventId === "string" && eventId.trim()) return eventId;

  const messageId = event.message_id;
  if (typeof messageId === "string" && messageId.trim()) return messageId;

  const data = event.data;
  if (data && typeof data === "object") {
    const nestedId = (data as Record<string, unknown>).id;
    if (typeof nestedId === "string" && nestedId.trim()) return nestedId;
  }

  return "";
}

function extractEventType(event: Record<string, unknown>): string {
  const directType = event.type;
  if (typeof directType === "string" && directType.trim()) return directType;

  const eventType = event.event_type;
  if (typeof eventType === "string" && eventType.trim()) return eventType;

  const payloadType = event.payload_type;
  if (typeof payloadType === "string" && payloadType.trim()) return payloadType;

  return "unknown";
}

function isCreditGrantEvent(eventType: string, payload: Record<string, unknown>): boolean {
  const lowered = eventType.toLowerCase();
  return ["credit.added", "credit_added", "credit.created", "credit_ledger_entry"].includes(lowered)
    || String(payload.payload_type ?? "").toLowerCase() === "creditledgerentry";
}

function isPaymentCompletedEvent(eventType: string, payload: Record<string, unknown>): boolean {
  const lowered = eventType.toLowerCase();
  return ["payment.completed", "payment_completed", "checkout.session.completed", "payment.success", "payment_success"].includes(lowered)
    || (typeof payload.status === "string" && payload.status.toLowerCase() === "completed")
    || (typeof payload.state === "string" && payload.state.toLowerCase() === "completed");
}

// Create a Dodo payment session
router.post("/payments/dodo/create", async (req, res) => {
  const { amount, currency, assetName, assetId, quantity, buyerName, buyerEmail, returnUrl } = req.body;
  const rawQty = quantity ?? 1;
  const qty = Number.isFinite(Number(rawQty)) ? Math.max(1, Math.floor(Number(rawQty))) : 1;
  const amt = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  const redirectTarget = typeof returnUrl === "string" && returnUrl.trim()
    ? returnUrl.trim()
    : "https://dodo.pe/atmoscarboncredit";

  if (!amount || !assetId) {
    res.status(400).json({ error: "amount and assetId are required" });
    return;
  }

  try {
    // Normalize numeric inputs to avoid sending null/invalid types to Dodo
    req.log?.info({ assetId, assetName, qty, amt, currency }, "Creating Dodo payment session - normalized payload");

    if (DODO_MODE === "demo") {
      // For testing, return the provided test checkout URL so QA can complete a checkout flow.
      res.json({
        success: true,
        paymentId: `dodo_demo_${Date.now()}`,
        paymentUrl: `${DODO_TEST_CHECKOUT_BASE_URL}/buy/${DODO_PRODUCT_ID}?quantity=${qty}&redirect_url=${encodeURIComponent(redirectTarget)}`,
        amount: amt,
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
          quantity: qty,
        },
      ],
      payment_link: true,
      return_url: redirectTarget,
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
      // Return mock payment URL for demo fallback (use normalized qty)
      res.json({
        success: true,
        paymentId: `dodo_${Date.now()}`,
        paymentUrl: `https://test.checkout.dodopayments.com/buy/${DODO_PRODUCT_ID}?quantity=${qty}&redirect_url=${encodeURIComponent(redirectTarget)}`,
        amount: amt,
        currency,
        mock: true,
        mode: "fallback",
      });
      return;
    }

    res.json({
      success: true,
      paymentId: (data as any).payment_id ?? `dodo_${Date.now()}`,
      paymentUrl: (data as any).payment_link ?? `${DODO_CHECKOUT_BASE_URL}/pay/${(data as any).payment_id}`,
      amount: amt,
      currency,
      mock: false,
      mode: "live",
    });
  } catch (err) {
    req.log.error({ err }, "Payment creation failed");
    // Graceful fallback for demo (uses normalized qty)
    res.json({
      success: true,
      paymentId: `dodo_demo_${Date.now()}`,
      paymentUrl: `${DODO_TEST_CHECKOUT_BASE_URL}/buy/${DODO_PRODUCT_ID}?quantity=${qty}&redirect_url=https://www.atmosexample.com`,
      amount: amt,
      currency,
      mock: true,
      mode: "fallback",
    });
  }
});

// Webhook handler for Dodo payment events
router.post("/payments/dodo/webhook", async (req, res) => {
  const rawBody = getRawBody(req) || safeStringify(req.body);

  if (!verifyWebhookSignature(req, rawBody)) {
    req.log.warn({ hasSecret: !!DODO_WEBHOOK_SECRET }, "Rejected Dodo webhook");
    res.status(401).json({ error: "invalid webhook signature" });
    return;
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    req.log.warn({ rawBodyLength: rawBody.length }, "Rejected malformed Dodo webhook payload");
    res.status(400).json({ error: "invalid webhook payload" });
    return;
  }

  const eventId = extractEventId(event);
  const eventType = extractEventType(event);

  if (eventId && processedWebhookEventIds.has(eventId)) {
    req.log.info({ eventId, eventType }, "Duplicate Dodo webhook ignored");
    res.json({ received: true, duplicate: true, action: "ignored" });
    return;
  }

  if (eventId) {
    processedWebhookEventIds.add(eventId);
  }

  const payload = (event.data && typeof event.data === "object") ? (event.data as Record<string, unknown>) : {};
  const creditGrant = isCreditGrantEvent(eventType, payload);
  const settlementReference = typeof payload.reference_id === "string" ? payload.reference_id : undefined;
  const grantId = typeof payload.grant_id === "string" ? payload.grant_id : undefined;
  const assetId = typeof payload.asset_id === "string" ? payload.asset_id : (typeof payload.product_id === "string" ? payload.product_id : "unknown");
  // Attempt to extract a Dodo payment id from common fields
  const possibleDodoPaymentId =
    typeof payload.payment_id === "string" ? payload.payment_id :
    typeof payload.paymentId === "string" ? payload.paymentId :
    typeof payload.payment === "string" ? payload.payment :
    undefined;
  const paymentCompleted = isPaymentCompletedEvent(eventType, payload);

  // Handle payment completion events
  if (paymentCompleted && eventId) {
    const dodoPaymentId = possibleDodoPaymentId || (typeof payload.id === "string" ? payload.id : eventId);
    const settlementId = dodoPaymentId;
    const upsertPayload: any = {
      id: settlementId,
      assetId: assetId || "unknown",
      status: "processing",
      dodoPaymentId,
      webhookEventId: eventId,
      metadata: {
        dodoEventType: eventType,
        payload: payload,
        paymentCompletedAt: Math.floor(Date.now() / 1000),
      },
    };

    settlementStore.upsert(upsertPayload);
    req.log.info({ settlementId, dodoPaymentId, assetId }, "Settlement recorded for payment completion event");
  }


  // Persist settlement record if this is a credit event
  if (creditGrant && eventId) {
    const settlementId = settlementReference ?? grantId ?? eventId;
    const upsertPayload: any = {
      id: settlementId,
      assetId,
      status: "credit_received",
      grantId,
      creditAmount: typeof payload.amount === "number" ? payload.amount : undefined,
      webhookEventId: eventId,
      metadata: {
        dodoEventType: eventType,
        payload: payload,
      },
    };

    if (possibleDodoPaymentId) upsertPayload.dodoPaymentId = possibleDodoPaymentId;

    settlementStore.upsert(upsertPayload);
    req.log.info({ settlementId, grantId, assetId }, "Settlement recorded for credit event");

    // Trigger Solana retirement (burn) and issue certificate
    (async () => {
      try {
        const creditAmount = typeof payload.amount === "number" ? payload.amount : 1;
        const mintAddress = typeof payload.mint === "string" ? payload.mint : assetId;
        const tokenAccount = typeof payload.token_account === "string" ? payload.token_account : undefined;

        if (tokenAccount && mintAddress !== assetId) {
          await retireCredits(
            mintAddress,
            tokenAccount,
            creditAmount,
            "dodo.payments",
            "ATMOS Settlement",
            assetId
          );
          settlementStore.upsert({ id: settlementId, status: "settled" });
          req.log.info({ settlementId, mintAddress }, "Solana retirement completed");
        }
      } catch (err: any) {
        req.log.warn({ err: err.message, settlementId }, "Solana retirement failed (non-blocking)");
      }
    })();
  }

  req.log.info(
    { eventId, eventType, creditGrant, settlementReference, grantId },
    "Dodo webhook received",
  );
  const action = paymentCompleted ? "payment_completed" : (creditGrant ? "credit_added" : "webhook_received");


  // In production: persist payment status updates and trigger Solana settlement jobs here.
  res.json({
    received: true,
    duplicate: false,
    action,
    eventType,
    settlementReference: settlementReference ?? grantId ?? null,
  });
});

// Get all settlements or filter by status
router.get("/payments/settlements", (req, res) => {
  const status = req.query.status as string | undefined;
  const settlements = status ? settlementStore.getByStatus(status as any) : settlementStore.getAll();
  res.json({ settlements, count: settlements.length });
});

// Get a specific settlement by ID
router.get("/payments/settlements/:id", (req, res) => {
  const settlement = settlementStore.get(req.params.id);
  if (!settlement) {
    res.status(404).json({ error: "settlement not found" });
    return;
  }
  res.json(settlement);
});

// Lookup settlement by Dodo payment id
router.get("/payments/settlements/by-dodo/:dodoId", (req, res) => {
  const { dodoId } = req.params;
  if (!dodoId) {
    res.status(400).json({ error: 'missing dodo id' });
    return;
  }

  const settlement = settlementStore.getByDodoPaymentId(dodoId);
  if (!settlement) {
    res.status(404).json({ error: 'settlement not found' });
    return;
  }
  res.json(settlement);
});

export default router;


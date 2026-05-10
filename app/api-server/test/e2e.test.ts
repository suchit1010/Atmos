import crypto from "crypto";
import request from "supertest";
import { describe, it, expect, afterEach, vi } from "vitest";
import { settlementStore } from "../src/lib/settlement-store";

const ENV_KEYS = ["DODO_MODE", "DODO_WEBHOOK_SECRET", "DODO_API_KEY"] as const;

type EnvSnapshot = Record<(typeof ENV_KEYS)[number], string | undefined>;

function snapshotEnv(): EnvSnapshot {
  return {
    DODO_MODE: process.env.DODO_MODE,
    DODO_WEBHOOK_SECRET: process.env.DODO_WEBHOOK_SECRET,
    DODO_API_KEY: process.env.DODO_API_KEY,
  };
}

function restoreEnv(snapshot: EnvSnapshot): void {
  for (const key of ENV_KEYS) {
    const value = snapshot[key];
    if (typeof value === "string") {
      process.env[key] = value;
    } else {
      delete process.env[key];
    }
  }
}

function signSvixPayload(secret: string, messageId: string, timestamp: string, body: string): string {
  const secretValue = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const secretBytes = Buffer.from(secretValue, "base64");
  const signedContent = `${messageId}.${timestamp}.${body}`;
  const signature = crypto.createHmac("sha256", secretBytes).update(signedContent).digest("base64");
  return `v1,${signature}`;
}

async function loadApp(overrides: Partial<Record<(typeof ENV_KEYS)[number], string>> = {}) {
  const prev = snapshotEnv();
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key as keyof EnvSnapshot] = value;
  }

  vi.resetModules();
  const mod = await import("../src/app");
  return { app: mod.default, prev };
}

afterEach(() => {
  settlementStore.clear();
});

describe("End-to-End: Dodo/Svix/Settlement Flow", () => {
  it("should complete full payment → webhook → settlement flow", async () => {
    const { app, prev } = await loadApp({
      DODO_MODE: "demo",
      DODO_WEBHOOK_SECRET: "whsec_c2VjcmV0",
    });

    // Step 1: Create payment session
    const payRes = await request(app)
      .post("/api/payments/dodo/create")
      .send({
        amount: 1000,
        currency: "INR",
        assetId: "solar-001",
        assetName: "Solar Energy Project",
        quantity: 5,
      });

    expect(payRes.status).toBe(200);
    expect(payRes.body.paymentId).toBeDefined();
    expect(payRes.body.success).toBe(true);

    console.log(`✅ Payment created: ${payRes.body.paymentId}`);

    // Step 2: Send Svix webhook with credit.added event
    const secret = "whsec_c2VjcmV0";
    const payload = {
      id: "msg_e2e_001",
      type: "credit.added",
      payload_type: "CreditLedgerEntry",
      data: {
        id: "credit_1",
        reference_id: "settlement_e2e_001",
        grant_id: "grant_e2e_001",
        asset_id: "solar-001",
        amount: 1000,
      },
    };
    const body = JSON.stringify(payload);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = signSvixPayload(secret, payload.id, timestamp, body);

    const webhookRes = await request(app)
      .post("/api/payments/dodo/webhook")
      .set("svix-id", payload.id)
      .set("svix-timestamp", timestamp)
      .set("svix-signature", signature)
      .send(payload);

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.received).toBe(true);
    expect(webhookRes.body.action).toBe("credit_added");

    console.log(`✅ Webhook processed: action=${webhookRes.body.action}`);

    // Step 3: Query settlements to verify creation
    const settlementsRes = await request(app).get("/api/payments/settlements");

    expect(settlementsRes.status).toBe(200);
    expect(settlementsRes.body.settlements).toBeDefined();
    expect(settlementsRes.body.settlements.length).toBeGreaterThan(0);

    const settlement = settlementsRes.body.settlements[0];
    expect(settlement.id).toBeDefined();
    expect(settlement.status).toBe("credit_received");
    expect(settlement.grantId).toBe("grant_e2e_001");
    expect(settlement.assetId).toBe("solar-001");

    console.log(`✅ Settlement persisted: id=${settlement.id.substring(0, 16)}..., status=${settlement.status}`);

    // Step 4: Get specific settlement by ID
    const settlementRes = await request(app).get(`/api/payments/settlements/${settlement.id}`);

    expect(settlementRes.status).toBe(200);
    expect(settlementRes.body.id).toBe(settlement.id);
    expect(settlementRes.body.webhookEventId).toBe("msg_e2e_001");

    console.log(`✅ Settlement retrieved: webhookEventId=${settlementRes.body.webhookEventId}`);

    restoreEnv(prev);
  });

  it("should reject duplicate webhook events", async () => {
    const { app, prev } = await loadApp({
      DODO_MODE: "demo",
      DODO_WEBHOOK_SECRET: "whsec_c2VjcmV0",
    });

    const secret = "whsec_c2VjcmV0";
    const payload = {
      id: "msg_dup_001",
      type: "credit.added",
      payload_type: "CreditLedgerEntry",
      data: {
        id: "credit_dup_1",
        reference_id: "settlement_dup_001",
        grant_id: "grant_dup_001",
        asset_id: "solar-001",
      },
    };
    const body = JSON.stringify(payload);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = signSvixPayload(secret, payload.id, timestamp, body);

    // Send first webhook
    const first = await request(app)
      .post("/api/payments/dodo/webhook")
      .set("svix-id", payload.id)
      .set("svix-timestamp", timestamp)
      .set("svix-signature", signature)
      .send(payload);

    expect(first.status).toBe(200);
    expect(first.body.duplicate).toBe(false);

    // Send duplicate webhook
    const second = await request(app)
      .post("/api/payments/dodo/webhook")
      .set("svix-id", payload.id)
      .set("svix-timestamp", timestamp)
      .set("svix-signature", signature)
      .send(payload);

    expect(second.status).toBe(200);
    expect(second.body.duplicate).toBe(true);

    console.log(`✅ Duplicate webhook detection working`);

    restoreEnv(prev);
  });
});

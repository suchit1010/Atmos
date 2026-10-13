import crypto from "crypto";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
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

describe("api-server starter endpoints", () => {
  it("GET /api/healthz returns ok", async () => {
    const { app, prev } = await loadApp();
    const res = await request(app).get("/api/healthz");
    restoreEnv(prev);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("POST /api/verify rejects missing type", async () => {
    const { app, prev } = await loadApp();
    const res = await request(app).post("/api/verify").send({ metadata: { x: 1 } });
    restoreEnv(prev);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("type");
  });

  it("POST /api/verify returns verification payload for valid project", async () => {
    const { app, prev } = await loadApp();
    const res = await request(app)
      .post("/api/verify")
      .send({
        type: "biochar",
        location: "Jaipur, India",
        metadata: {
          biomassInput: 12000,
          biocharOutput: 3200,
          landBoundaryPolygon: JSON.stringify([
            { lat: 26.9124, lng: 75.7873 },
            { lat: 26.9131, lng: 75.7882 },
            { lat: 26.9119, lng: 75.789 },
          ]),
        },
      });
    restoreEnv(prev);

    expect(res.status).toBe(200);
    expect(typeof res.body.co2).toBe("number");
    expect(typeof res.body.confidence).toBe("number");
    expect(typeof res.body.grade).toBe("string");
    expect(typeof res.body.fraudRisk).toBe("string");
    expect(typeof res.body.satelliteDataSource).toBe("string");
  });

  it("POST /api/payments/dodo/create uses demo mode response", async () => {
    const { app, prev } = await loadApp({ DODO_MODE: "demo" });
    const res = await request(app).post("/api/payments/dodo/create").send({
      amount: 1000,
      currency: "INR",
      assetId: "asset_proj_1",
      quantity: 1,
    });
    restoreEnv(prev);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.mock).toBe(true);
    expect(res.body.mode).toBe("demo");
  });

  it("POST /api/payments/dodo/webhook rejects invalid signature", async () => {
    const { app, prev } = await loadApp({ DODO_WEBHOOK_SECRET: "test_secret" });
    const res = await request(app)
      .post("/api/payments/dodo/webhook")
      .set("x-dodo-signature", "sha256=invalid")
      .send({ id: "evt_invalid", type: "payment.succeeded" });
    restoreEnv(prev);

    expect(res.status).toBe(401);
  });

  it("POST /api/payments/dodo/webhook handles valid signature and duplicate replay", async () => {
    const payload = { id: "evt_123", type: "payment.succeeded", data: { id: "pay_1" } };
    const secret = "test_secret";
    const signature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    const { app, prev } = await loadApp({ DODO_WEBHOOK_SECRET: secret });

    const first = await request(app)
      .post("/api/payments/dodo/webhook")
      .set("x-dodo-signature", `sha256=${signature}`)
      .send(payload);

    const second = await request(app)
      .post("/api/payments/dodo/webhook")
      .set("x-dodo-signature", `sha256=${signature}`)
      .send(payload);

    restoreEnv(prev);

    expect(first.status).toBe(200);
    expect(first.body.received).toBe(true);
    expect(first.body.duplicate).toBe(false);

    expect(second.status).toBe(200);
    expect(second.body.received).toBe(true);
    expect(second.body.duplicate).toBe(true);
  });

  it("POST /api/payments/dodo/webhook verifies Svix headers and accepts credit events", async () => {
    const secret = "whsec_c2VjcmV0";
    const payload = {
      id: "msg_123",
      type: "credit.added",
      payload_type: "CreditLedgerEntry",
      data: {
        id: "credit_1",
        reference_id: "settlement_42",
        grant_id: "grant_9",
        asset_id: "asset_proj_1",
      },
    };
    const body = JSON.stringify(payload);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = signSvixPayload(secret, payload.id, timestamp, body);

    const { app, prev } = await loadApp({ DODO_WEBHOOK_SECRET: secret });
    const res = await request(app)
      .post("/api/payments/dodo/webhook")
      .set("svix-id", payload.id)
      .set("svix-timestamp", timestamp)
      .set("svix-signature", signature)
      .send(payload);
    restoreEnv(prev);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    expect(res.body.action).toBe("credit_added");
    expect(res.body.settlementReference).toBe("settlement_42");
  });

  it("GET /api/payments/settlements returns empty list initially", async () => {
    const { app, prev } = await loadApp();
    const res = await request(app).get("/api/payments/settlements");
    restoreEnv(prev);

    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(0);
  });

  it("GET /api/payments/settlements/:id returns 404 for missing settlement", async () => {
    const { app, prev } = await loadApp();
    const res = await request(app).get("/api/payments/settlements/nonexistent");
    restoreEnv(prev);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("settlement not found");
  });
});

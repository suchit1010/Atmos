#!/usr/bin/env node

import crypto from "crypto";
import request from "supertest";
import { settlementStore } from "../src/lib/settlement-store.js";

const ENV_KEYS = ["DODO_MODE", "DODO_WEBHOOK_SECRET", "DODO_API_KEY"];

function snapshotEnv() {
  return {
    DODO_MODE: process.env.DODO_MODE,
    DODO_WEBHOOK_SECRET: process.env.DODO_WEBHOOK_SECRET,
    DODO_API_KEY: process.env.DODO_API_KEY,
  };
}

function restoreEnv(snapshot) {
  for (const key of ENV_KEYS) {
    const value = snapshot[key];
    if (typeof value === "string") {
      process.env[key] = value;
    } else {
      delete process.env[key];
    }
  }
}

function signSvixPayload(secret, messageId, timestamp, body) {
  const secretValue = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const secretBytes = Buffer.from(secretValue, "base64");
  const signedContent = `${messageId}.${timestamp}.${body}`;
  const signature = crypto.createHmac("sha256", secretBytes).update(signedContent).digest("base64");
  return `v1,${signature}`;
}

async function loadApp(overrides = {}) {
  const prev = snapshotEnv();
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }

  // Force reload of modules
  delete require.cache[require.resolve("../src/app.js")];
  delete require.cache[require.resolve("../src/index.js")];
  
  const mod = await import("../src/app.js");
  return { app: mod.default, prev };
}

async function runTest() {
  console.log("\n🚀 Starting End-to-End Dodo/Svix Test\n");

  try {
    console.log("1️⃣  Setting up test environment...");
    const { app, prev } = await loadApp({
      DODO_MODE: "demo",
      DODO_WEBHOOK_SECRET: "whsec_c2VjcmV0"
    });

    console.log("✅ App loaded\n");

    console.log("2️⃣  Creating payment session...");
    const payRes = await request(app)
      .post("/api/payments/dodo/create")
      .send({
        amount: 1000,
        currency: "INR",
        assetId: "solar-001",
        assetName: "Solar Energy Project",
        quantity: 5,
      });

    console.log(`✅ Payment created: ${payRes.body.paymentId}\n`);

    console.log("3️⃣  Sending Svix webhook with credit.added event...");
    const secret = "whsec_c2VjcmV0";
    const payload = {
      id: "msg_123",
      type: "credit.added",
      payload_type: "CreditLedgerEntry",
      data: {
        id: "credit_1",
        reference_id: "settlement_42",
        grant_id: "grant_9",
        asset_id: "solar-001",
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

    console.log(`✅ Webhook response: ${webhookRes.status}`);
    console.log(`   - Received: ${webhookRes.body.received}`);
    console.log(`   - Action: ${webhookRes.body.action}`);
    console.log(`   - Settlement Reference: ${webhookRes.body.settlementReference}\n`);

    console.log("4️⃣  Querying settlements...");
    const settlementsRes = await request(app).get("/api/payments/settlements");
    
    console.log(`✅ Found ${settlementsRes.body.settlements?.length ?? 0} settlement(s)`);
    
    if (settlementsRes.body.settlements?.length > 0) {
      const s = settlementsRes.body.settlements[0];
      console.log(`   - Settlement ID: ${s.id}`);
      console.log(`   - Status: ${s.status}`);
      console.log(`   - Grant ID: ${s.grantId}`);
      console.log(`   - Webhook Event ID: ${s.webhookEventId}\n`);
    }

    console.log("✅ End-to-End Test PASSED\n");
    restoreEnv(prev);
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test FAILED:");
    console.error(error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

runTest();

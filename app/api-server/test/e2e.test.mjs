import crypto from "crypto";
import fetch from "node-fetch";

const API_BASE = "http://localhost:9001/api";
const SVIX_SECRET = "whsec_c2VjcmV0"; // "whsec_" + base64("secret")

// Helper function to sign Svix payload
function signSvixPayload(secret, id, timestamp, body) {
  const secretValue = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const secretBytes = Buffer.from(secretValue, "base64");
  const toSign = `${id}.${timestamp}.${body}`;
  const computed = crypto.createHmac("sha256", secretBytes).update(toSign).digest("base64");
  return `v1,${computed}`;
}

async function runEndToEndTest() {
  console.log("\n🚀 Starting End-to-End Dodo/Svix Test\n");

  try {
    // Step 1: Create payment session
    console.log("1️⃣  Creating payment session...");
    const paymentRes = await fetch(`${API_BASE}/payments/dodo/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 1000,
        currency: "INR",
        assetId: "solar-001",
        assetName: "Solar Energy Project",
        quantity: 5,
        buyerName: "Test User",
        buyerEmail: "test@atmos.local",
      }),
    });

    if (!paymentRes.ok) {
      throw new Error(`Payment creation failed: ${paymentRes.status}`);
    }

    const paymentData = await paymentRes.json();
    console.log("✅ Payment session created:");
    console.log(`   - Payment ID: ${paymentData.paymentId}`);
    console.log(`   - Amount: ₹${paymentData.amount}`);

    // Step 2: Simulate Dodo webhook with credit.added event
    console.log("\n2️⃣  Simulating Svix webhook (credit.added event)...");

    const webhookPayload = {
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

    const webhookBody = JSON.stringify(webhookPayload);
    const timestamp = Math.floor(Date.now() / 1000);
    const svixId = "msg_123";
    const svixSignature = signSvixPayload(SVIX_SECRET, svixId, String(timestamp), webhookBody);

    const webhookRes = await fetch(`${API_BASE}/payments/dodo/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "svix-id": svixId,
        "svix-timestamp": timestamp.toString(),
        "svix-signature": `v1,${svixSignature}`,
      },
      body: webhookBody,
    });

    if (!webhookRes.ok) {
      throw new Error(`Webhook failed: ${webhookRes.status}`);
    }

    const webhookResult = await webhookRes.json();
    console.log("✅ Webhook processed:");
    console.log(`   - Status: ${webhookResult.status}`);
    console.log(`   - Action: ${webhookResult.action}`);
    console.log(`   - Settlement ID: ${webhookResult.settlementId}`);

    // Step 3: Query settlements
    console.log("\n3️⃣  Querying settlements...");

    const settlementsRes = await fetch(`${API_BASE}/payments/settlements`, {
      method: "GET",
    });

    const settlements = await settlementsRes.json();
    console.log(`✅ Found ${settlements.length} settlement(s)`);

    if (settlements.length > 0) {
      const latest = settlements[settlements.length - 1];
      console.log(`   - Latest Settlement ID: ${latest.id}`);
      console.log(`   - Status: ${latest.status}`);
      console.log(`   - Credit Amount: ₹${latest.creditAmount}`);
      console.log(`   - Grant ID: ${latest.grantId}`);
    }

    // Step 4: Get specific settlement
    if (webhookResult.settlementId) {
      console.log(`\n4️⃣  Fetching settlement ${webhookResult.settlementId.substring(0, 16)}...`);

      const settlementRes = await fetch(`${API_BASE}/payments/settlements/${webhookResult.settlementId}`, {
        method: "GET",
      });

      if (settlementRes.ok) {
        const settlement = await settlementRes.json();
        console.log("✅ Settlement retrieved:");
        console.log(`   - ID: ${settlement.id.substring(0, 16)}...`);
        console.log(`   - Status: ${settlement.status}`);
        console.log(`   - Webhook Event ID: ${settlement.webhookEventId}`);
        console.log(`   - Created: ${new Date(settlement.createdAt).toISOString()}`);
      }
    }

    console.log("\n✅ End-to-End Test PASSED\n");
  } catch (error) {
    console.error("\n❌ Test FAILED:");
    console.error(error.message);
    process.exit(1);
  }
}

runEndToEndTest();

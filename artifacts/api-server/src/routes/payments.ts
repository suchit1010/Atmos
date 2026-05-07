import { Router } from "express";

const router = Router();

const DODO_BASE_URL = "https://api.dodopayments.com";
const DODO_API_KEY = process.env["DODO_API_KEY"] ?? "";

// Create a Dodo payment session
router.post("/payments/dodo/create", async (req, res) => {
  const { amount, currency, assetName, assetId, quantity, buyerName, buyerEmail } = req.body;

  if (!amount || !assetId) {
    res.status(400).json({ error: "amount and assetId are required" });
    return;
  }

  try {
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
          product_id: assetId,
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
      // Return mock payment URL for sandbox demo
      res.json({
        success: true,
        paymentId: `dodo_${Date.now()}`,
        paymentUrl: `https://checkout.dodopayments.com/pay/demo_${assetId}`,
        amount,
        currency,
        mock: true,
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
    });
  } catch (err) {
    req.log.error({ err }, "Payment creation failed");
    // Graceful fallback for demo
    res.json({
      success: true,
      paymentId: `dodo_demo_${Date.now()}`,
      paymentUrl: `https://checkout.dodopayments.com/pay/demo_${assetId}`,
      amount,
      currency,
      mock: true,
    });
  }
});

// Webhook handler for Dodo payment events
router.post("/payments/dodo/webhook", (req, res) => {
  const event = req.body;
  req.log.info({ event }, "Dodo webhook received");
  // In production: verify webhook signature with DODO_WEBHOOK_SECRET
  res.json({ received: true });
});

export default router;

# Umbra (ZK) & Dodo Payments Integration

This document summarizes the current implementation, configuration, and testing guidance for the Umbra (zero-knowledge privacy) and Dodo Payments integration in Atmos.

## Summary
- Dodo Payments is used for user checkout and settlement (supports demo and live modes).
- Umbra/ZK is the privacy layer planned for hiding sensitive project details during settlement; SDK is imported but full proof flow is not yet completed.

## Dodo Payments (API side)
- Endpoint: `POST /api/payments/dodo/create` — creates a Dodo payment session.
- Demo mode: set `DODO_MODE=demo` to receive a test checkout URL immediately (no external API keys required).
- Config environment variables (in `.env`):
  - `DODO_API_KEY` — API key for Dodo (live)
  - `DODO_WEBHOOK_SECRET` — webhook secret (Svix or legacy)
  - `DODO_MODE` — `demo` | `live` | `fallback`
- Webhook: `POST /api/payments/dodo/webhook` (Svix-compatible). The server verifies signatures using:
  - Svix-style headers (`svix-id`, `svix-timestamp`, `svix-signature`) OR
  - Legacy HMAC header (`x-dodo-signature` / `x-dodo-webhook-signature`)

## Client-side behavior (mobile/web)
- Dev-mode mock: when `__DEV__` is true the client uses a mocked payment session (fast, 300ms) and opens the test checkout URL. Useful for UX testing without hitting Dodo.
- Production flow: client posts to `/api/payments/dodo/create` and expects `{ success, paymentId, paymentUrl }`.
- Robustness: the client attempts multiple API bases if the configured `API_BASE` cannot be reached (tries `API_BASE`, `http://localhost:8080`, `http://localhost:9001`) and uses a 30s AbortController timeout.

## Privacy flow (Umbra / `carbon-purchase` endpoint)
- When privacy mode is enabled in the UI the client calls `POST /api/payments/carbon-purchase` instead of `/payments/dodo/create`.
- Current status: Umbra SDK is imported; server-side proof generation and private payment flow are planned but not yet finished. The privacy endpoint exists as a placeholder for private settlement flows.

## Testing the payment flow locally
1. Ensure API server is running and healthy:

```bash
curl http://localhost:8080/api/healthz
```

2. For quick UI testing, run the mobile app in dev mode (mock payments):

```bash
pnpm --filter @workspace/mobile run dev:offline
```

3. Simulate a production payment (if you have `DODO_API_KEY`):

```bash
curl -X POST http://localhost:8080/api/payments/dodo/create \
  -H 'Content-Type: application/json' \
  -d '{"amount":1000,"currency":"INR","assetId":"asset_proj_1","quantity":1,"buyerEmail":"qa@example.com"}'
```

4. Simulate a webhook (example payload):

```bash
curl -X POST http://localhost:8080/api/payments/dodo/webhook \
  -H 'Content-Type: application/json' \
  -d '{"type":"credit.added","id":"evt_123","data":{"reference_id":"settlement_42"}}'
```

Note: the server validates webhook signature; for testing you can temporarily log raw body verification or set `DODO_WEBHOOK_SECRET` to a known value.

## Troubleshooting
- Error `Failed to fetch` in the client: verify the API server is running and reachable. Check port mismatch between `API_BASE` and actual server port (client tries multiple fallbacks).
- No `paymentUrl` in response: check server logs for Dodo API errors and ensure `DODO_API_KEY` is valid.
- Webhook not processed: validate `DODO_WEBHOOK_SECRET` and the request signing method.

## Next steps / TODOs
- Complete Umbra server-side proof generation and wiring to the private settlement endpoint.
- Add e2e tests for payment webhook handling and credit settlement state transitions.
- Add dashboard UI for reconciled settlements and manual retry controls.

---
Docs maintained by the Atmos engineering team.

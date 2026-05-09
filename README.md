# Atmos

Atmos is a climate finance platform that turns verified carbon reductions into tradable digital assets. The system combines mobile data capture, satellite and AI verification, zero-knowledge proofs, Solana settlement, and payments rails for cross-border checkout.

## End-to-End Flow

The current product flow is implemented as a mobile-first demo that moves through auth, project capture, verification, proof generation, minting, payment, and settlement.

1. A user signs in through [app/mobile/app/(auth)/index.tsx](<app/mobile/app/(auth)/index.tsx>) and [app/mobile/context/AuthContext.tsx](app/mobile/context/AuthContext.tsx). The current auth state is stored locally in `AsyncStorage`, with phone, Google, and Apple sign-in paths falling back to demo users when the external flow is unavailable.
2. The user creates a climate project in [app/mobile/app/project/create.tsx](app/mobile/app/project/create.tsx) and fills methodology-specific data in [app/mobile/app/project/capture.tsx](app/mobile/app/project/capture.tsx). Project state is kept in [app/mobile/context/AtmosContext.tsx](app/mobile/context/AtmosContext.tsx) and persisted locally.
3. The verification screen [app/mobile/app/verify/[id].tsx](app/mobile/app/verify/[id].tsx) sends a POST request to [app/api-server/src/routes/verify.ts](app/api-server/src/routes/verify.ts). The API calls the Anthropic client in [lib/integrations-anthropic-ai/src/client.ts](lib/integrations-anthropic-ai/src/client.ts) to estimate CO2, confidence, grade, methodology, fraud risk, and price. If the API is not reachable, the mobile app falls back to a local estimate.
4. The ZK screen [app/mobile/app/zk/[id].tsx](app/mobile/app/zk/[id].tsx) walks through an encryption / proof / verification sequence and stores a proof hash on the project. This is currently a presentation-layer mock rather than a real proof pipeline.
5. The asset screen [app/mobile/app/asset/[id].tsx](app/mobile/app/asset/[id].tsx) marks the project as minted and exposes the asset metadata used by the portfolio and market views.
6. The payment screen [app/mobile/app/payment/[id].tsx](app/mobile/app/payment/[id].tsx) creates a Dodo payment session by calling [app/api-server/src/routes/payments.ts](app/api-server/src/routes/payments.ts). If the API call fails, the app still records a demo payment locally and continues to settlement.
7. The settlement screen [app/mobile/app/settlement/[id].tsx](app/mobile/app/settlement/[id].tsx) renders the final receipt, Solana devnet explorer link, and certificate view. The current on-chain step is a UI mock and does not submit a real blockchain transaction.

The navigation stack that ties the journey together lives in [app/mobile/app/_layout.tsx](app/mobile/app/_layout.tsx), which wires auth, query, gesture, and safe-area providers around the app routes.

## Mobile Architecture

The mobile app is an Expo Router app centered on a single root shell:

1. [app/mobile/app/_layout.tsx](app/mobile/app/_layout.tsx) loads fonts, boots the query client, and wraps the app in `AuthProvider`, `AtmosProvider`, gesture handling, and safe-area support.
2. The unauthenticated path starts in [app/mobile/app/(auth)/index.tsx](app/mobile/app/(auth)/index.tsx), which routes users into OTP or social sign-in fallbacks.
3. The main tab shell is defined in [app/mobile/app/(tabs)/_layout.tsx](app/mobile/app/(tabs)/_layout.tsx), with Home, Projects, Market, Portfolio, and Profile as the primary user surfaces.
4. The core product journey is:
	1. Home/dashboard at [app/mobile/app/(tabs)/index.tsx](app/mobile/app/(tabs)/index.tsx) gives a snapshot of assets, activity, and entry into project creation.
	2. Project creation starts in [app/mobile/app/project/create.tsx](app/mobile/app/project/create.tsx) and lands in [app/mobile/app/project/capture.tsx](app/mobile/app/project/capture.tsx).
	3. Verification runs through [app/mobile/app/verify/[id].tsx](app/mobile/app/verify/[id].tsx), then ZK proof simulation in [app/mobile/app/zk/[id].tsx](app/mobile/app/zk/[id].tsx), minting in [app/mobile/app/asset/[id].tsx](app/mobile/app/asset/[id].tsx), payment in [app/mobile/app/payment/[id].tsx](app/mobile/app/payment/[id].tsx), and settlement in [app/mobile/app/settlement/[id].tsx](app/mobile/app/settlement/[id].tsx).

The current flow is intentionally optimistic and demo-friendly, but the code now marks the difference between true backend-backed verification and local fallback behavior more clearly.

## Repository Layout

- `app/mobile` - Expo mobile application.
- `app/api-server` - NestJS API backend.
- `app/mockup-sandbox` - Vite-based UI sandbox for the product mockups.
- `lib/api-client-react` - Shared React API client.
- `lib/api-spec` - OpenAPI specification.
- `lib/api-zod` - Shared validation schemas.
- `lib/db` - Database schema and migration tooling.
- `lib/integrations` - External service integrations.
- `scripts` - Workspace scripts and maintenance utilities.

## What Is Implemented

- Mobile routing and state are wired end to end through Expo Router, `AuthContext`, and `AtmosContext`.
- Verification and payment have live API entry points in [app/api-server/src/routes/verify.ts](app/api-server/src/routes/verify.ts) and [app/api-server/src/routes/payments.ts](app/api-server/src/routes/payments.ts).
- The Anthropic integration is initialized in [lib/integrations-anthropic-ai/src/client.ts](lib/integrations-anthropic-ai/src/client.ts).
- The mockup sandbox is available as a separate Vite app for product exploration.

## What Is Still Missing

This repo still behaves like a demo in a few important places:

- Persistence is not fully implemented. [lib/db/src/schema/index.ts](lib/db/src/schema/index.ts) is still empty, so projects, assets, payments, and KYC data are not stored in a real database yet.
- Auth is not backed by a server session layer. The mobile app keeps user state locally and does not yet issue or validate JWTs, OTPs, or OAuth tokens on the backend.
- The ZK proof step is still a UI simulation. It records a proof hash locally, but it does not generate or verify a real cryptographic proof.
- Settlement is still a mock. The Solana devnet receipt, explorer link, and certificate are presentation-only and are not backed by an on-chain mint or transfer flow.
- The Dodo webhook route exists, but it only logs the payload and does not yet verify signatures or update payment status server-side.
- The OpenAPI spec currently documents only the health route in [lib/api-spec/openapi.yaml](lib/api-spec/openapi.yaml), so it does not yet cover the full mobile/API contract.

## Local Setup

Install dependencies from the repository root:

```bash
pnpm install
```

Run the mobile app:

```bash
pnpm --filter @workspace/mobile dev
```

Run the API server:

```bash
pnpm --filter @workspace/api-server dev
```

Run the mockup sandbox:

```bash
pnpm --filter @workspace/mockup-sandbox dev
```

The mockup sandbox starts on port `5173` by default. The mobile app starts Expo on port `8081`. The API server requires `PORT` and the integration environment variables described below.

## Production Notes

- The workspace is pnpm-based and should be installed with pnpm.
- The mockup sandbox uses local defaults for `PORT` and `BASE_PATH`, so it does not require Replit-specific environment variables.
- The architecture is designed around separate services for auth, verification, proof generation, payments, and settlement.
- The current backend favors graceful fallback behavior for demo use, so the docs should treat verification, proof generation, and settlement as partially implemented until real persistence and on-chain execution are added.

## High-Level Architecture

- Mobile app: Expo + React Native.
- API layer: NestJS.
- Verification: satellite and AI pipeline.
- Privacy: zero-knowledge proof generation.
- Settlement: Solana asset minting and transfer.
- Payments: Dodo Payments for checkout and webhooks.

## Suggested Environment Variables

These are the main runtime values expected by the apps and services:

- `PORT` - Local port for the mockup sandbox.
- `BASE_PATH` - Base path for the mockup sandbox.
- `EXPO_PUBLIC_DOMAIN` - Public domain for deployment-specific mobile config.
- `DATABASE_URL` - PostgreSQL connection string for [lib/db/src/index.ts](lib/db/src/index.ts).
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` - Base URL for the Anthropic integration.
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` - API key for the Anthropic integration.
- `DODO_API_KEY` - API key for Dodo payment session creation.
- Service-specific keys for auth, storage, and blockchain integrations.

## Status

The repo is set up as a monorepo with the mobile app and mockup sandbox runnable locally. Further production hardening belongs in the service-level README or deployment docs for each app.

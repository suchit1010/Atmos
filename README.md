# Atmos

Atmos is a climate finance platform that turns verified carbon reductions into tradable digital assets. The system combines mobile data capture, satellite and AI verification, zero-knowledge proofs, Solana settlement, and payments rails for cross-border checkout.

## Product Overview

The core flow is:

1. A project developer captures project details, media, and location data in the mobile app.
2. The backend verifies the submission with satellite and AI analysis.
3. A zero-knowledge proof is generated to protect sensitive project data.
4. A carbon asset is minted and listed for settlement.
5. A buyer completes payment and receives the asset through the settlement flow.

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

## Local Setup

Install dependencies from the repository root:

```bash
pnpm install
```

Run the mobile app:

```bash
pnpm --filter @workspace/mobile dev
```

Run the mockup sandbox:

```bash
pnpm --filter @workspace/mockup-sandbox dev
```

The mockup sandbox starts on port `5173` by default. The mobile app starts Expo on port `8081`.

## Production Notes

- The workspace is pnpm-based and should be installed with pnpm.
- The mockup sandbox uses local defaults for `PORT` and `BASE_PATH`, so it does not require Replit-specific environment variables.
- The architecture is designed around separate services for auth, verification, proof generation, payments, and settlement.

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
- Service-specific keys for auth, payments, storage, and blockchain integrations.

## Status

The repo is set up as a monorepo with the mobile app and mockup sandbox runnable locally. Further production hardening belongs in the service-level README or deployment docs for each app.

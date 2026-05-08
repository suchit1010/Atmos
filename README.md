# Atmos

Atmos turns real-world carbon reductions into instantly verifiable digital assets with privacy and trust. The platform combines climate MRV, satellite imagery, AI, zero-knowledge proofs, and blockchain settlement.

## What's in the repo

- `app/mobile`: Expo mobile app
- `app/api-server`: API backend
- `app/mockup-sandbox`: Vite-based UI sandbox for the product mockups
- `lib/*`: Shared libraries, API client, schemas, integrations, and database code

## Local Development

Install dependencies from the repo root:

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

The sandbox runs on port `5173` by default. The mobile app starts Expo on port `8081`.

## Notes

- The workspace is pnpm-based and expects pnpm for installs.
- The mockup sandbox now uses local defaults for `PORT` and `BASE_PATH`, so it runs without Replit-specific environment variables.

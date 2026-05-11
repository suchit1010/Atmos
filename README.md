# Atmos

> **Verified. Tradable. Instant. Global.**  
> Real-world carbon reduction → AI & satellite verified → Minted as SPL token → Settled via Dodo Payments → Trusted blockchain record.

Atmos is a **climate finance infrastructure platform** built on Solana. It transforms verified carbon reductions from physical projects into tradable digital assets. The system combines mobile data capture, satellite and AI verification, zero-knowledge proofs, Solana settlement, and modern payments rails for global checkout.

---

## What Is Atmos?

Atmos is not a marketplace—it's **settlement infrastructure for climate action**.

Any CO₂ reduction project → AI-verified with satellite data → ZK-proven to protect sensitive data → SPL token minted → settled via Dodo Payments.

**Core Value Proposition:**
- **Instant verification:** Satellite + AI MRV in real-time
- **Privacy-first:** ZK proofs keep project details private while anchoring proof on-chain
- **Global settlement:** Dodo Payments handles 50+ currencies → USDC → Solana
- **Immutable records:** Every transaction and proof anchored on Solana mainnet
- **Developer-friendly:** Open API + mobile SDK + Solana integration

---

## Architecture

```
┌─────────────────────────────────────┐
│  Mobile App (React Native + Expo)   │
│  - Project capture + media          │
│  - Live MRV pipeline tracking       │
│  - Asset creation + marketplace     │
│  - Payments + settlement UI         │
└──────────────┬──────────────────────┘
               │ HTTPS / WebSocket
               ↓
┌─────────────────────────────────────┐
│  API Server (Express.js)            │
│  ┌─────────────────────────────────┐│
│  │ Services                        ││
│  │ ├── Auth (JWT + OTP)            ││
│  │ ├── Projects (CRUD + GIS)       ││
│  │ ├── Satellite (Sentinel-2)      ││
│  │ ├── AI (Carbon MRV engine)      ││
│  │ ├── ZK (Groth16 proofs)         ││
│  │ ├── Verification (Anthropic)    ││
│  │ ├── Solana (SPL minting)        ││
│  │ └── Payments (Dodo + Svix)      ││
│  └─────────────────────────────────┘│
└──────────────┬──────────────────────┘
               │
    ┌──────────┼──────────┬─────────────┐
    ↓          ↓          ↓             ↓
PostgreSQL   Redis    Solana Devnet  Dodo API
   + GIS    (cache)   (SPL tokens)  (payments)
```

---

## Quick Start (10 minutes)

### 1. Clone & Install

```bash
git clone https://github.com/suchit1010/Atmos.git
cd Atmos
pnpm install
```

### 2. Configure Environment

Copy environment template and set required values:

```bash
cp .env.example .env
# Edit .env with:
# - DODO_API_KEY (get from https://api.dodopayments.com)
# - DODO_WEBHOOK_SECRET (from Dodo dashboard)
# - DODO_MODE (demo | live | fallback)
```

### 3. Start the API Server

```bash
pnpm --filter @workspace/api-server dev
# Server → http://localhost:3000
```

### 4. Start the Mobile App

In another terminal:

```bash
pnpm --filter @workspace/mobile dev
# Expo → http://localhost:8081
# Scan QR code with Expo Go app
```

If Expo fails with `TypeError: fetch failed` during startup (network-restricted environments), use:

```bash
pnpm --filter @workspace/mobile dev:offline
# Expo offline mode → http://localhost:8082
```

### 5. Verify Health

```bash
curl http://localhost:3000/api/healthz
# → {"status":"ok"}
```

---

## API Reference

### Health & Status

```
GET /api/healthz
  → { status: "ok" }
```

### Verification (MRV Pipeline)

```
POST /api/verify
  body: {
    type: "biochar" | "agroforestry" | "solar" | "ev" | "building" | "shipping" | "aviation" | "city" | "individual",
    location: "Jaipur, India",
    metadata: {
      biomassInput: 12000,
      biocharOutput: 3200,
      landBoundaryPolygon: "[[26.9124, 75.7873], [26.9131, 75.7882], ...]"
    }
  }
  → {
    co2: 2.46,
    confidence: 87,
    grade: "A",
    fraudRisk: "low",
    satelliteDataSource: "sentinel-2"
  }
```

### Payments

```
POST /api/payments/dodo/create
  body: {
    amount: 1000,
    currency: "INR",
    assetId: "asset_proj_1",
    quantity: 1,
    buyerEmail: "buyer@example.com",
    buyerName: "John Doe"
  }
  → {
    success: true,
    paymentId: "dodo_1234567890",
    paymentUrl: "https://checkout.dodopayments.com/...",
    amount: 1000,
    currency: "INR",
    mock: false,
    mode: "live" | "demo" | "fallback"
  }

POST /api/payments/dodo/webhook    [No auth required]
  [Dodo sends via Svix with HMAC-SHA256 signature]
  body: {
    type: "credit.added",
    id: "msg_xxxxx",
    data: {
      reference_id: "settlement_42",
      grant_id: "grant_9",
      asset_id: "asset_proj_1"
    }
  }
  → { received: true, action: "credit_added", settlementReference: "settlement_42" }

GET /api/payments/settlements
  query: status? ("pending" | "credit_received" | "minted" | "settled" | "failed")
  → { settlements: [...], count: N }

GET /api/payments/settlements/:id
  → {
    id: "settlement_42",
    assetId: "asset_proj_1",
    status: "credit_received",
    grantId: "grant_9",
    creditAmount: 1000,
    webhookEventId: "msg_xxxxx",
    createdAt: 1234567890,
    updatedAt: 1234567890,
    metadata: { ... }
  }
```

---

## Entity Types & Methodologies

| Entity Type | Methodology | Emission Source | Example |
|------------|------------|-----------------|---------|
| `biochar` | IPCC + VCS | Biomass carbonization | Rice husk → biochar |
| `agroforestry` | VM0047 | Tree sequestration | Alley cropping systems |
| `solar` | AMS-I.D | Grid displacement | Solar farm kWh |
| `ev` | AMS-III.C | Fuel avoidance | EV fleet displacement |
| `building` | AMS-II.C | Energy efficiency | HVAC retrofit |
| `shipping` | VM0051 | Maritime fuel reduction | Bunker fuel displacement |
| `aviation` | ICAO CORSIA | Jet fuel efficiency | Airline carbon offsets |
| `city` | Custom | Municipal programs | City-wide initiatives |
| `individual` | GHG-IND-01 | Personal actions | Home carbon reduction |

---

## MRV Pipeline

When a project is submitted via `/api/verify`, this runs:

### 1. Satellite Data Fetch
- **Source:** Sentinel-2 STAC API
- **Signals:** NDVI (vegetation index), Land use classification, Fire detection (NASA FIRMS)
- **Output:** GeoJSON + time-series analysis

### 2. AI Verification
- **Engine:** Anthropic Claude with entity-specific prompts
- **Signals:** 8-dimensional fraud detection
- **Calculation:** IPCC/VCS methodologies specific to entity type
- **Output:** CO₂e estimate, confidence score (0-100), grade (A/B/C/D)

### 3. Confidence Scoring
- Satellite data quality (0-25 pts)
- Project metadata completeness (0-25 pts)
- Historical data availability (0-25 pts)
- Methodology applicability (0-25 pts)

### 4. Grade Assignment
| Grade | Confidence | Premium | Use Case |
|-------|-----------|---------|----------|
| A | 85-100 | ✅ High premium | Investment-grade assets |
| B | 70-84 | ✅ Premium | Institutional buyable |
| C | 50-69 | ⚠️ Standard | Community carbon |
| D | <50 | ❌ No premium | Pilot / research |

### 5. Fraud Risk Detection
- Location credibility (region-specific baselines)
- Metadata plausibility (methodology-specific rules)
- Temporal consistency (multi-year satellite trends)
- Outlier detection (statistical bounds)

---

## Payments & Webhook Integration

### Dodo Payments Flow

1. **Mobile App** requests checkout for asset
2. **API Server** creates Dodo payment session via `/api/payments/dodo/create`
3. **Dodo** returns checkout URL
4. **Buyer** completes UPI/card payment via Dodo Checkout
5. **Dodo** sends webhook via **Svix** to `/api/payments/dodo/webhook`
6. **API Server** verifies Svix signature:
   - Header `svix-id`, `svix-timestamp`, `svix-signature`
   - Signed content: `{id}.{timestamp}.{raw_body}`
   - HMAC-SHA256 with base64-decoded secret
7. **API Server** creates settlement record (status: `credit_received`)
8. **Mobile App** polls or listens for settlement completion

### Webhook Security

```typescript
// Svix signature verification
signedContent = `${svixId}.${svixTimestamp}.${rawBody}`
expectedSignature = HMAC-SHA256(
  signedContent,
  base64_decode(webhookSecret.slice(6))  // Remove "whsec_" prefix
)
// Compare with constant-time comparison
```

---

## Project Structure

```
Atmos/
├── app/
│   ├── api-server/
│   │   ├── src/
│   │   │   ├── app.ts               Express bootstrap + raw body capture
│   │   │   ├── routes/
│   │   │   │   ├── index.ts         Route aggregator
│   │   │   │   ├── verify.ts        MRV verification endpoint
│   │   │   │   └── payments.ts      Dodo + Svix webhook handling
│   │   │   ├── lib/
│   │   │   │   ├── logger.ts        Pino logging
│   │   │   │   └── settlement-store.ts  In-memory settlement persistence
│   │   │   └── types/
│   │   │       └── index.ts         Shared types
│   │   ├── test/
│   │   │   └── api.starter.test.ts  Vitest + Supertest coverage
│   │   ├── vitest.config.ts         Vitest configuration
│   │   ├── build.mjs                Build script
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── mobile/
│   │   ├── app/
│   │   │   ├── _layout.tsx          Root layout + auth guard
│   │   │   ├── (tabs)/              Bottom tab navigator
│   │   │   │   ├── index.tsx        Home / dashboard
│   │   │   │   ├── market.tsx       Marketplace / listings
│   │   │   │   ├── profile.tsx      User profile
│   │   │   │   └── settings.tsx     Settings
│   │   │   ├── project/
│   │   │   │   ├── [id].tsx         Project detail
│   │   │   │   ├── capture.tsx      Project capture + map
│   │   │   │   └── create.tsx       Project creation flow
│   │   │   ├── asset/
│   │   │   │   └── [id].tsx         Asset detail + mint UI
│   │   │   ├── settlement/
│   │   │   │   └── [id].tsx         Settlement receipt + explorer
│   │   │   ├── payment/
│   │   │   │   └── [id].tsx         Payment status + checkout
│   │   │   └── verification/
│   │   │       └── [id].tsx         MRV results UI
│   │   ├── components/              Shared UI components
│   │   ├── context/
│   │   │   └── AtmosContext.tsx    Global state + persistence
│   │   ├── constants/               App config + constants
│   │   ├── hooks/                   Custom React hooks
│   │   ├── scripts/                 Utility scripts
│   │   ├── server/                  Backend API helpers
│   │   ├── app.json                 Expo config
│   │   ├── metro.config.js          Metro bundler config
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── mockup-sandbox/
│       ├── src/
│       │   ├── App.tsx              Vite React component
│       │   └── ...                  Component library preview
│       ├── vite.config.ts           Vite configuration
│       ├── package.json
│       └── tsconfig.json
│
├── lib/
│   ├── api-client-react/            Shared React API client
│   ├── api-spec/
│   │   ├── openapi.yaml             OpenAPI specification
│   │   └── orval.config.ts          Orval codegen config
│   ├── api-zod/                     Shared validation schemas
│   ├── db/                          Database schema + migrations
│   └── integrations/                External service integrations
│
├── scripts/
│   ├── post-merge.sh                Git hook for dependency sync
│   └── src/hello.ts                 Utility scripts
│
├── pnpm-workspace.yaml              Workspace config
├── tsconfig.base.json               Base TypeScript config
├── package.json                     Root package
└── README.md                        (this file)
```

---

## Development Workflow

### Install Dependencies

```bash
pnpm install
```

### Run Tests

```bash
# API server tests (Vitest + Supertest)
pnpm --filter @workspace/api-server test

# Run in watch mode
pnpm --filter @workspace/api-server test:watch
```

### Run Development Servers

**Terminal 1 — API Server:**
```bash
pnpm --filter @workspace/api-server dev
# Starts on http://localhost:3000
```

**Terminal 2 — Mobile App:**
```bash
pnpm --filter @workspace/mobile dev
# Starts Expo on http://localhost:8081
# Scan QR with Expo Go app
```

**Terminal 3 — Mockup Sandbox (optional):**
```bash
pnpm --filter @workspace/mockup-sandbox dev
# Starts on http://localhost:5173
```

---

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DODO_MODE` | ✅ | Payment mode | `demo` \| `live` \| `fallback` |
| `DODO_API_KEY` | ✅ (for live) | Dodo API authentication | `sk_live_xxxxx` |
| `DODO_WEBHOOK_SECRET` | ✅ | Svix webhook secret | `whsec_xxxxx` |
| `PORT` | Optional | API server port | `3000` (default) |
| `EXPO_PUBLIC_DOMAIN` | Optional | Mobile app domain | `https://atmos.protocol` |

---

## Security

- **Webhook Verification:** HMAC-SHA256 via Svix headers
- **Raw Body Capture:** Express middleware preserves raw request body for signature verification
- **Replay Protection:** Svix timestamp tolerance (5 minutes)
- **Idempotency:** Event IDs prevent duplicate webhook processing
- **Error Handling:** Graceful fallbacks to demo/mock modes on integration failures

---

## Tech Stack

**Backend:**
- Node.js · TypeScript · Express.js
- Pino (structured logging)
- Vitest + Supertest (testing)
- Build: esbuild (production bundling)

**Mobile:**
- React Native · Expo Router
- TypeScript
- AsyncStorage (local persistence)
- Context API (global state)

**UI Sandbox:**
- Vite · React
- Component library preview

**Integrations:**
- **Payments:** Dodo Payments + Svix webhooks
- **Verification:** Anthropic Claude (AI)
- **Satellite:** Sentinel-2 (imagery source)
- **Blockchain:** Solana Devnet (future)

**Development:**
- pnpm (workspace + monorepo management)
- TypeScript (end-to-end type safety)
- Git hooks (post-merge dependency sync)

---

## Status

✅ Core API server with verification + payment webhook handling
✅ Mobile app with project capture + marketplace UI
✅ Svix webhook integration for Dodo payment events
✅ Settlement record persistence on credit events
⏳ Mobile UI surface for payment status (in progress)
⏳ Full Solana minting integration (planned)
⏳ PostgreSQL persistence layer (planned)

---

## Contributing

See individual service READMEs in `app/api-server/`, `app/mobile/`, and `app/mockup-sandbox/` for service-specific development guides.

---

**Atmos — Turning verified climate action into global financial settlement.**

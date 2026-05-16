# Atmos Codebase Comprehensive Audit Report
**Date:** May 15, 2026  
**Scope:** Full project exploration - structure, configuration, implementation status, and critical issues  
**Status:** ✅ BUILD VALIDATED (pnpm run build:ci succeeds)

---

## Executive Summary

**Project:** Atmos — Climate finance infrastructure platform on Solana  
**Current State:** MVP with partial implementation  
**Build Status:** ✅ Passing (TypeScript compilation + esbuild bundling verified)  
**Production Readiness:** ⚠️ Pre-production (critical features stubbed, no database schema, limited testing)

**Key Findings:**
- ✅ API server architecture solid (Express + Pino logging, error handling)
- ✅ Mobile app structure complete (Expo/React Native + navigation)
- ✅ Solana integration working (real minting, proof anchoring)
- ✅ AI verification pipeline operational (Claude Haiku 4.5 multi-agent)
- ⚠️ Database layer completely empty (schema not defined)
- ⚠️ Multiple subsystems in mock/simulation mode
- ⚠️ Build now fixed but requires monitoring
- 🔴 Critical missing implementations for data persistence
- 🔴 3 deprecated npm packages (glob, lru-cache, rimraf, uuid)

---

## 1. PROJECT STRUCTURE & BUILD CONFIGURATION

### ✅ Workspace Layout (pnpm monorepo)
```
Atmos (workspace root)
├── package.json                    # Root scripts: dev:backend, build:ci, typecheck
├── tsconfig.base.json              # Shared TypeScript configuration
├── pnpm-workspace.yaml             # Monorepo definition + security (1440min release age)
├── vercel.json                     # Deployment: build:ci → api-server build
├── docker-compose.yml              # Local dev: api:9001, web:8080
│
├── app/
│   ├── api-server/                 # Express.js backend (9 routes)
│   ├── mobile/                     # React Native + Expo (auth, projects, marketplace)
│   └── mockup-sandbox/             # Web sandbox (Vite)
│
├── lib/                            # Workspace libraries
│   ├── api-zod/                    # Validation schemas (NEEDS generation)
│   ├── db/                         # Drizzle ORM + PostgreSQL (EMPTY SCHEMA)
│   ├── integrations-anthropic-ai/  # Claude Haiku client
│   ├── api-client-react/           # React Query hooks (generated)
│   └── api-spec/                   # OpenAPI spec
│
├── docs/                           # Implementation guides
└── scripts/                        # Build utilities
```

### ✅ Build Scripts (Root package.json)
```json
{
  "dev:backend":    "pnpm --filter @workspace/api-server run dev",
  "dev:frontend":   "pnpm --filter @workspace/mockup-sandbox run dev",
  "dev:mobile":     "pnpm --filter @workspace/mobile run dev",
  "dev:web+api":    "pnpm -r --parallel [both]",
  "build":          "pnpm run typecheck && pnpm -r --if-present run build",
  "build:libs":     "tsc --build lib/api-zod lib/db lib/integrations-anthropic-ai",
  "build:vercel":   "pnpm run typecheck:libs && pnpm --filter @workspace/api-server run build",
  "build:ci":       "pnpm run build:libs && pnpm run build:vercel"  // ← Current Vercel target
}
```

### ✅ TypeScript Configuration
- **tsconfig.base.json:** ES2022 target, strict null checks, no unused locals allowed
- **Project References:** Properly configured for api-server → lib/db, lib/api-zod, lib/integrations-anthropic-ai
- **Issue:** ✅ FIXED - Libraries now export both `dist/index.d.ts` (types) and `src/index.ts` (source)

### ✅ Vercel Configuration
```json
{
  "buildCommand": "pnpm run build:ci",
  "installCommand": "pnpm install --frozen-lockfile --prod=false",
  "env": { "DODO_MODE": "production" }
}
```
**Status:** ✅ Correctly wired to orchestrate lib builds before api-server build

---

## 2. API SERVER IMPLEMENTATION (app/api-server/)

### ✅ Server Architecture
**Entry Point:** [app/api-server/src/index.ts](app/api-server/src/index.ts)
- Loads `.env` from 6 candidate locations (project root, .env.local, etc.)
- Exports app as default for serverless (Vercel)
- Standalone mode: Reads `PORT` env var, defaults 9001
- Error handling: Validates port number, logs via Pino

**App Setup:** [app/api-server/src/app.ts](app/api-server/src/app.ts)
- CORS: Dynamic origin whitelist via `CORS_ORIGIN` / `CORS_ORIGINS` env var
- Logging: Pino-http middleware with serialization
- Body parsing: JSON + URL-encoded with raw body capture (for webhook signatures)
- Routes mounted at `/api` prefix

### ✅ Route Structure
**File:** [app/api-server/src/routes/index.ts](app/api-server/src/routes/index.ts)

| Route | File | Status | Notes |
|-------|------|--------|-------|
| `GET /api/healthz` | health.ts | ✅ Implemented | Health check endpoint |
| `POST /api/verify/evidence` | verify.ts | ✅ Implemented | Image evidence validation |
| `POST /api/verify` | verify.ts | ✅ Implemented | Multi-agent LLM verification |
| `POST /api/payments/dodo/create` | payments-private.ts | ✅ Implemented | Dodo checkout creation |
| `POST /api/payments/dodo/webhook` | payments.ts | ⚠️ Partial | Signature verification OK, event handling incomplete |
| `POST /api/assets/mint` | solana.ts | ✅ Implemented | Real Solana minting |
| `POST /api/proofs/anchor` | solana.ts | ✅ Implemented | Real proof anchoring |
| `GET /api/solana/payer` | solana.ts | ✅ Implemented | Debug endpoint |
| `GET /api/portfolio` | portfolio-private.ts | ⚠️ Stub | Requires `query()` DB pool |
| `POST /api/portfolio/viewing-key` | portfolio-private.ts | ⚠️ Stub | Requires DB |
| `POST /api/payments/carbon-purchase` | payments-private.ts | ⚠️ Stub | Requires DB |

### ✅ Middleware

**Auth:** [app/api-server/src/middleware/auth.ts](app/api-server/src/middleware/auth.ts)
- Status: ⚠️ DEVELOPMENT MODE
- Extracts userId from Authorization header, query, or body
- Fallback: Uses `demo-user` in dev, rejects in production
- **Issue:** No JWT validation, no session management
- **Risk:** Any userId can impersonate other users in dev/staging

**Logging:** [app/api-server/src/lib/logger.ts](app/api-server/src/lib/logger.ts)
- Status: ✅ Production-grade Pino setup
- Redacts authorization headers, cookies, Set-Cookie
- Pretty-print in dev, compact JSON in production

### ✅ Services & Integrations

#### 1. **Solana Service** [app/api-server/src/lib/solana.ts](app/api-server/src/lib/solana.ts)
**Status:** ✅ REAL INTEGRATION (as of 2026-05-14)

Exported Functions:
- `getConnection()` — Singleton Connection to RPC URL
- `getPayer()` — Singleton Keypair (from `SOLANA_WALLET_PRIVATE_KEY` or ephemeral)
- `requestAirdropIfNeeded()` — Auto-airdrops 2 SOL on devnet if balance < 0.1 SOL
- `anchorProofOnSolana(proofHash, co2Amount, projectId)` → `{ txHash, slot }`
  - Uses Memo program to write proof data on-chain
  - Requires signing + confirmation
- `mintCarbonCredit(projectId, recipient, co2Amount, grade)` → `{ mintAddress, txHash }`
  - Creates SPL token, issues initial supply
  - Recipient gets associated token account
- `retireCredits(amount, tokenMint, burnAddress, projectId)` → `{ txHash, creditsBurned }`
  - Burns tokens + records settlement
  - Called by Dodo webhook when payment completes

**Environment Variables Required:**
- `SOLANA_RPC_URL` (default: `https://api.devnet.solana.com`)
- `SOLANA_WALLET_PRIVATE_KEY` (optional; dev: ephemeral keypair generated)

**Issues:**
- ⚠️ Ephemeral keypair in dev = different address each restart
- ⚠️ No persistence of mint addresses between restarts
- ✅ Devnet airdrop rate limiting handled gracefully

#### 2. **Verification Engine** [app/api-server/src/routes/verify.ts](app/api-server/src/routes/verify.ts)
**Status:** ✅ MULTI-AGENT LLM ORCHESTRATION

Multi-stage verification:
1. **Image Evidence Analysis** — Heuristic checks (hash validation, duplicates, image count/size)
   - Verdict: `pass` | `review` | `reject`
   - Confidence penalty for suspicious images
2. **Carbon Agent** — Calculates CO₂ using project metadata + methodology
   - Uses Claude Haiku 4.5 with structured output
   - Returns: `{ co2, methodology, explanation, pricePerTonne }`
3. **Quality Agent** — Data completeness & observation checks
   - Returns: `{ confidence, grade, dataCompleteness, observations[] }`
4. **Fraud Agent** — Pattern detection for suspicious projects
   - Returns: `{ fraudRisk, signals[] }`

**Final Verdict:**
- Maps all three scores → `validationStatus: "pass" | "review" | "reject"`
- `requiresManualReview` if confidence < 70% OR grade D/C
- Returns `verificationEngine` data structure to mobile

**Environment Variables Required:**
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY`

#### 3. **Anthropic AI Integration** [lib/integrations-anthropic-ai/src/client.ts](lib/integrations-anthropic-ai/src/client.ts)
**Status:** ✅ LAZY-LOADED PROXY

- Initializes Anthropic client on first use
- Throws if env vars missing: `AI_INTEGRATIONS_ANTHROPIC_API_KEY`, `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`
- Export: `anthropic` (Proxy to real client) for backward compatibility

#### 4. **Satellite Adapter** [app/api-server/src/lib/satellite.ts](app/api-server/src/lib/satellite.ts)
**Status:** ⚠️ MOCK + OPTIONAL REAL

Features:
- Parses `landBoundaryPolygon` from project metadata (GeoJSON array)
- Calculates approximate land area using spherical geometry
- **Mock Mode (default):** Returns `{ source: "mock", imageryAvailable: false, ... }`
- **Real Mode (if GOOGLE_MAPS_API_KEY set):** Queries Google Static Maps API
  - Checks if satellite imagery exists for boundary
  - Returns `{ source: "google-static-maps", imageryAvailable: true/false, ... }`

**Environment Variables Optional:**
- `GOOGLE_MAPS_API_KEY` (enables real satellite checks)

#### 5. **Payments & Webhook Handler** [app/api-server/src/routes/payments.ts](app/api-server/src/routes/payments.ts)
**Status:** ⚠️ PARTIAL IMPLEMENTATION

Implemented:
- ✅ Dodo checkout session creation → returns `checkoutUrl`
- ✅ Webhook signature verification (HMAC-SHA256 + timing-safe comparison)
- ✅ Idempotency (tracks processed webhook IDs, prevents double-processing)
- ✅ Event parsing (flexible field names: id/event_id/message_id, type/event_type/payload_type)

Missing:
- 🔴 Database persistence (settlements not stored)
- 🔴 Credit grant event handling (awaits future integration)
- 🔴 Status update callback (no webhook response to Dodo)

**Environment Variables Required:**
- `DODO_API_KEY` (test/prod depending on DODO_MODE)
- `DODO_WEBHOOK_SECRET` (for signature verification)
- `DODO_MODE` (default: "live"; options: "live" | "test")

**Dodo Configuration:**
- Product ID: `"pdt_0NeTZC7YUIaCtJSBukmEK"` (test Atmos carbon asset)
- Checkout Host: `test.checkout.dodopayments.com` (hardcoded for test)

#### 6. **Database Connection** [app/api-server/src/db/pool.ts](app/api-server/src/db/pool.ts)
**Status:** 🔴 MOCK MODE (No real database)

Behavior:
- If `DATABASE_URL` not set: Falls back to mock queries
- Mock mode returns:
  - SELECT queries → `{ rows: [], rowCount: 0 }`
  - INSERT queries → `{ rows: [{ id: random_uuid }], rowCount: 1 }`
  - Other → `{ rows: [], rowCount: 0 }`
- Logs: `[MOCK DB] Query: ...` to console

**Environment Variable Required:**
- `DATABASE_URL` (PostgreSQL connection string; optional in dev)

#### 7. **Umbra Privacy Service** [app/api-server/src/lib/umbra.ts](app/api-server/src/lib/umbra.ts)
**Status:** ⚠️ SIMULATION MODE (SDK optional)

Features:
- Confidential transfers: Recipient + amount hidden on-chain
- Viewing keys: Selective disclosure for compliance
- Encrypted portfolio: Returns `●●●●●` when key not provided
- Audit trail: Transaction log encrypted
- Fallback: If `@umbra-privacy/sdk` not installed, simulates with placeholders

**Environment Variables Optional:**
- `SOLANA_RPC_URL` (default: devnet)

#### 8. **Portfolio Private Routes** [app/api-server/src/routes/portfolio-private.ts](app/api-server/src/routes/portfolio-private.ts)
**Status:** 🔴 REQUIRES DATABASE

Routes (all require auth):
- `GET /api/portfolio` — Returns encrypted portfolio
- `POST /api/portfolio/viewing-key` — Generates viewing key
- `GET /api/portfolio/compliance-report` — Compliance audit trail
- `POST /api/portfolio/decrypt-transaction` — Decrypt tx with key

**Blockers:**
- `await query(...)` calls will hit mock DB and return empty results
- No user/wallet lookup possible

---

## 3. MOBILE APP IMPLEMENTATION (app/mobile/)

### ✅ App Architecture
**Entry Point:** [app/mobile/app/_layout.tsx](app/mobile/app/_layout.tsx)

Stack Navigation:
- Auth guard → redirects to `/(auth)/` if not authenticated
- Tabs navigation → home, discover, profile, settlements
- Modal flows → project/create, project/capture, verify/[id], zk/[id], payment/[id], settlement/[id]

**Providers:**
1. GestureHandlerRootView — Native gesture handling
2. SafeAreaProvider — Safe area insets
3. KeyboardProvider — Keyboard visibility
4. QueryClientProvider — React Query (TanStack)
5. AuthProvider — User state
6. AtmosProvider — Project/asset/payment data

### ✅ State Management

#### AuthContext [app/mobile/context/AuthContext.tsx](app/mobile/context/AuthContext.tsx)
**Storage:** AsyncStorage (persistent)

User data:
```typescript
{
  id: string;
  phone: string;
  name: string;
  email: string;
  walletAddress: string;  // Generated or from Solana
  kycStatus: "unverified" | "pending" | "verified";
  role: "producer" | "buyer";
  authMethod: "phone" | "google" | "apple";
  kyc: {
    aadhaar: { type, status: "not_started"|"pending"|"verified"|"rejected", number?, submittedAt?, verifiedAt? };
    pan: { ... };
    farmDoc: { ... };
  }
}
```

**Auth Methods:**
- ✅ Phone OTP (UI placeholders)
- ✅ Google OAuth (expo-auth-session)
- ✅ Apple Sign-In (expo-auth-session)

**Wallet Generation:** Random Base58-like string (8 chars) + "..." + 4 more chars

#### AtmosContext [app/mobile/context/AtmosContext.tsx](app/mobile/context/AtmosContext.tsx)
**Storage:** AsyncStorage (persistent)

Data:
```typescript
{
  projects: [
    { id, name, type, location, status, co2?, confidence?, grade?, fraudRisk?, 
      proofHash?, mintAddress?, metadata{}, mediaCount, mediaUris? }
  ];
  assets: [
    { id, projectId, name, type, amount, grade, price, methodology, vintage, 
      location, mintAddress, proofHash, available }
  ];
  payments: [
    { id, assetId, assetName, amount, quantity, currency, status, 
      dodoPaymentId?, settlementId?, settlementStatus?, grantId?, txId? }
  ];
  totalCO2: number;  // Sum of all verified projects
  totalValue: number;  // Sum of available asset prices
}
```

### ✅ Screen Structure

| Screen | Path | Status | Purpose |
|--------|------|--------|---------|
| Auth | `(auth)/index.tsx` | ✅ | Phone/Google/Apple login |
| KYC - Aadhaar | `kyc/aadhaar.tsx` | ✅ | Aadhaar number entry + OTP |
| KYC - PAN | `kyc/pan.tsx` | ✅ | PAN number entry |
| KYC - Farm Doc | `kyc/farm-doc.tsx` | ✅ | Farm document upload |
| Tabs - Home | `(tabs)/index.tsx` | ✅ | Portfolio summary |
| Tabs - Discover | `(tabs)/discover.tsx` | ✅ | Marketplace listings |
| Tabs - Profile | `(tabs)/profile.tsx` | ✅ | User settings, settlements |
| Create Project | `project/create.tsx` | ✅ | Project type selector (9 types) |
| Capture Project | `project/capture.tsx` | ✅ | Metadata input (form per project type) |
| Verify Project | `verify/[id].tsx` | ✅ | 4-phase animation → calls `POST /api/verify` |
| Generate ZK Proof | `zk/[id].tsx` | ⚠️ | 3 phases → calls `POST /api/proofs/anchor` (real Solana) |
| View Asset | `asset/[id].tsx` | ✅ | Asset details + purchase button |
| Payment Checkout | `payment/[id].tsx` | ✅ | Dodo checkout link (WebBrowser) |
| Settlement | `settlement/[id].tsx` | ✅ | Mock Solana block + certificate share |

### ✅ Project Types & Metadata
9 climate reduction categories:
1. **Biochar** — Biomass input, output, efficiency
2. **Agroforestry** — Forest area, tree count, canopy cover
3. **Solar** — System capacity, panel count, annual generation
4. **EV** — Fleet size, annual distance, fuel displaced
5. **Building Retrofit** — Pre/post energy use, retrofit year
6. **Shipping** — Vessel name, fleet size, fuel consumption
7. **Aviation** — Fleet size, annual hours, fuel displacement
8. **City-Scale** — Population, energy baseline, reduction target
9. **Individual** — Free-form carbon reduction project

### ⚠️ Critical Missing Components
1. **API Client Integration** — `lib/api-client-react` not wired to screens
2. **Real Authentication** — No backend token validation
3. **Data Sync** — No server persistence (all AsyncStorage only)
4. **Error Recovery** — Limited fallback when API fails
5. **Testing** — No unit/integration tests for context logic

---

## 4. LIBRARY LAYER (lib/)

### ✅ lib/api-zod — Validation Schemas

**Status:** 🔴 EMPTY (no schemas defined)

**File:** [lib/api-zod/src/index.ts](lib/api-zod/src/index.ts)
```typescript
export * from "./generated/api";
export * from "./generated/types";
```

**Content:** [lib/api-zod/src/generated/api.ts](lib/api-zod/src/generated/api.ts)
- Only exports: `HealthCheckResponse` schema
- **Missing:** All verification, payment, project, asset, user schemas
- **Impact:** API endpoints accept any body (no validation)

**Package Configuration:**
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./src/index.ts"
    }
  }
}
```
✅ FIXED (now exports both types and source)

### 🔴 lib/db — Database Layer (CRITICAL EMPTY)

**File:** [lib/db/src/index.ts](lib/db/src/index.ts)
```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

let pool: pg.Pool | null = null;
let db: any = null;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
  } catch (err) {
    console.error("Failed to connect to database:", err);
  }
} else {
  console.warn("DATABASE_URL not set; database features unavailable...");
}

export { pool, db };
export * from "./schema";
```

**Schema:** [lib/db/src/schema/index.ts](lib/db/src/schema/index.ts)
🔴 **COMPLETELY EMPTY**
```typescript
// Export your models here. Add one export per file
// export * from "./posts";
//
// Each model/table should ideally be split into different files.
// Example pattern:
//   import { pgTable, text, serial } from "drizzle-orm/pg-core";
//   import { createInsertSchema } from "drizzle-zod";
//   ...

export {}
```

**Configuration:** [lib/db/drizzle.config.ts](lib/db/drizzle.config.ts)
```typescript
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
});
```

**Critical Missing Entities:**
- `users` (id, phone, walletAddress, kycStatus, role, createdAt)
- `projects` (id, userId, type, location, status, co2, confidence, grade, metadata, createdAt)
- `assets` (id, projectId, mintAddress, amount, grade, available, price, createdAt)
- `payments` (id, assetId, amount, quantity, currency, status, dodoPaymentId, settlementId, createdAt)
- `settlements` (id, paymentId, status, txHash, creditGrant, createdAt)
- `kycDocuments` (id, userId, type, status, filePath, submittedAt, verifiedAt)
- `authenticateTokens` (id, userId, token, expiresAt, createdAt)
- `verifications` (id, projectId, status, verificationEngine, createdAt)

**Scripts:**
- ✅ `push` — `drizzle-kit push --config ./drizzle.config.ts`
- ✅ `push-force` — `drizzle-kit push --force --config ./drizzle.config.ts`
- ❌ No `generate` script for migrations
- ❌ No seed script for test data

**Impact:** All portfolio, payment, and persistence routes return empty mock results.

### ✅ lib/integrations-anthropic-ai — AI Client

**Status:** ✅ WORKING (Lazy-loaded proxy pattern)

**Files:**
- [src/client.ts](lib/integrations-anthropic-ai/src/client.ts) — Anthropic client initialization
- [src/batch/index.ts](lib/integrations-anthropic-ai/src/batch/index.ts) — Batch processing utilities
  - `batchProcess()` — Concurrent API calls with concurrency control
  - `batchProcessWithSSE()` — Streaming batch results
  - `isRateLimitError()` — Rate limit detection

**Dependencies:**
- `@anthropic-ai/sdk` ^0.78.0
- `p-limit` ^7.3.0 (concurrency control)
- `p-retry` ^7.1.1 (retry logic)

**Environment Variables Required:**
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY`
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`

### ✅ lib/api-client-react — API Client Hooks

**Status:** ⚠️ GENERATED (from OpenAPI spec, not connected to mobile)

**Files:**
- [src/generated/api.ts](lib/api-client-react/src/generated/api.ts) — Endpoint hooks
- [src/generated/api.schemas.ts](lib/api-client-react/src/generated/api.schemas.ts) — Type definitions
- [src/custom-fetch.ts](lib/api-client-react/src/custom-fetch.ts) — Fetch wrapper with auth token support

**Features:**
- `setBaseUrl(url)` — Configure API base URL for Expo
- `setAuthTokenGetter(getter)` — Supply Bearer token getter
- Custom response types: `json`, `text`, `blob`, `auto`
- Redacts auth headers from logs

**Status:** Generated from OpenAPI but not actively used in mobile app.

### ✅ lib/api-spec — OpenAPI Specification

**File:** [lib/api-spec/openapi.yaml](lib/api-spec/openapi.yaml)

**Scripts:**
- `generate` — Would generate TypeScript client from spec
- `validate` — Would validate spec syntax

**Status:** Unknown if spec is current (not checked in audit).

---

## 5. CONFIGURATION & ENVIRONMENT VARIABLES

### .env Files Status

**Current:** No `.env` files in repository (all environment-dependent)

**Candidates Checked (app/api-server/src/index.ts):**
1. `../../.env.local` (project root)
2. `../../.env` (project root)
3. `.env.local` (api-server directory)
4. `.env` (api-server directory)
5. `app/api-server/.env.local` (relative)
6. `app/api-server/.env` (relative)

### Required Environment Variables

#### API Server (app/api-server)
```bash
# Server
PORT=9001
NODE_ENV=development|production
LOG_LEVEL=debug|info|warn|error

# CORS
CORS_ORIGIN=*|https://example.com,https://app.example.com

# Database (CRITICAL - currently missing)
DATABASE_URL=postgresql://user:pass@localhost:5432/atmos

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WALLET_PRIVATE_KEY=base58_encoded_secret_key

# Dodo Payments
DODO_API_KEY=<test or prod key>
DODO_WEBHOOK_SECRET=whsec_... (Svix format)
DODO_MODE=test|live

# Anthropic AI
AI_INTEGRATIONS_ANTHROPIC_API_KEY=sk-ant-...
AI_INTEGRATIONS_ANTHROPIC_BASE_URL=https://api.anthropic.com/v1

# Satellite Imagery (optional)
GOOGLE_MAPS_API_KEY=<Google API key>

# Vercel (auto-set)
DODO_MODE=production  # vercel.json env override
```

#### Mobile App (app/mobile/.env.example exists)
```bash
# API Configuration
EXPO_PUBLIC_DOMAIN=http://localhost:9001  # or https://api.example.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID=<Google OAuth>

# Not used currently (hardcoded checks in code)
```

### ⚠️ Current Issues with Environment Configuration
1. **No `.env.example` in repo root** — DevOps unclear on required vars
2. **Dodo checkout URL hardcoded** — Uses `test.checkout.dodopayments.com` for both test/prod
3. **Solana RPC defaults to devnet** — Would mint tokens on devnet not mainnet
4. **No vault/secrets management** — Keys must be manually set in Vercel
5. **Private key in plaintext** — `SOLANA_WALLET_PRIVATE_KEY` env var (security risk in development)

---

## 6. CRITICAL MISSING IMPLEMENTATIONS

### 🔴 **1. Database Schema (BLOCKING ALL PERSISTENCE)**

**Impact:** Any route using `await query(...)` fails silently

**Missing Tables:**
- `users` — User profiles, KYC status, wallet addresses
- `projects` — Project records, verification results, mint addresses
- `assets` — Asset mint records, available quantities
- `payments` — Payment transactions from Dodo
- `settlements` — Settlement records, Solana tx hashes
- `kycDocuments` — KYC file uploads and status
- `authTokens` — JWT or session tokens (currently none issued)
- `verifications` — Verification results and audit trail
- `umbra_keys` — Viewing keys for private portfolio access
- `webhookLogs` — Dodo webhook event audit trail

**Action Required:** Define schema in `lib/db/src/schema/` and run `drizzle-kit push`

### 🔴 **2. User Authentication Backend**

**Current State:** Mobile-only, no server validation

**Missing:**
- JWT token generation + validation
- Phone OTP verification (server-side)
- Google OAuth token validation (currently only client-side)
- Apple Sign-In token validation
- Session management
- Logout/token revocation
- Password reset flow (if using email-based auth)

**Impact:** Any user can claim any userId in dev/staging

### 🔴 **3. Project Persistence**

**Current State:** Mobile AsyncStorage only

**Missing Routes:**
- `POST /api/projects` — Create project (currently only local capture)
- `GET /api/projects` — List user's projects
- `GET /api/projects/:id` — Fetch single project
- `PUT /api/projects/:id` — Update project metadata
- `DELETE /api/projects/:id` — Archive/delete project

**Impact:** Projects lost on app reinstall or device reset

### 🔴 **4. Asset Minting Persistence**

**Current State:** Calls `POST /api/assets/mint` (real Solana) but no record keeping

**Missing:**
- Database insert after mint succeeds
- Link asset to project
- Track mint address + token metadata
- Query user's minted assets

**Impact:** Mobile doesn't know which assets it owns after restart

### 🔴 **5. Settlement Record Keeping**

**Current State:** Dodo webhook calls `retireCredits()` on-chain but no DB record

**Missing:**
- Record settlement in database
- Link settlement to payment + project
- Track settlement status (pending → completed → failed)
- Generate settlement receipts/certificates

**Impact:** No audit trail for compliance

### 🔴 **6. Portfolio Private Routes**

**Current State:** Routes defined but database queries fail

**Missing:**
- User wallet lookup
- Project holdings query
- Viewing key generation + storage
- Decryption logic (Umbra SDK integration)
- Compliance report generation

### ⚠️ **7. Payments Webhook Event Handling**

**Current State:** Signature verification works, but event processing incomplete

**Missing:**
- Credit grant event type handling
- Payment success → settlement workflow
- Status update callback to Dodo
- Failure/retry handling
- Idempotency window enforcement

### ⚠️ **8. API Client in Mobile**

**Current State:** `lib/api-client-react` generated but not connected to screens

**Missing:**
- Wire hooks to mobile screens
- Error handling + user feedback
- Retry logic + offline mode
- Token refresh flow

---

## 7. BUILD & COMPILATION STATUS

### ✅ TypeScript Compilation
**Last Run:** `pnpm run build:ci` (Success)

**Output:**
```
✓ Compiled lib/api-zod
✓ Compiled lib/db
✓ Compiled lib/integrations-anthropic-ai
✓ Typechecked entire workspace
✓ Built api-server with esbuild
  - dist/index.mjs (9.7mb)
  - dist/pino-worker.mjs (153.4kb)
  - dist/pino-file.mjs (142.1kb)
  - dist/pino-pretty.mjs (114.6kb)
  - Source maps linked
```

### ⚠️ Deprecated Dependencies

**Found in pnpm-lock.yaml:**

| Package | Current | Issue | Fix |
|---------|---------|-------|-----|
| `glob` | (old version) | Unmaintained security vulnerabilities | Upgrade to latest |
| `lru-cache` | (old version) | Memory leak, not recommended | Use current version |
| `rimraf` | (pre-v4) | v3 no longer supported | Upgrade to v4+ |
| `uuid` | 10.x | No longer supported, memory unsafe | Upgrade to 11.x (ESM) or latest (CommonJS) |

**Recommendation:** Run `pnpm update glob lru-cache rimraf uuid --latest`

### ✅ esbuild Configuration

**File:** [app/api-server/build.mjs](app/api-server/build.mjs)

**Features:**
- ESM output with source maps
- External packages list (comprehensive)
- Pino worker plugin for logging
- CJS compatibility banner for require/\_\_dirname/\_\_filename
- Proper workspace library bundling

### Docker Support
- ✅ Dockerfile present for api-server
- ✅ Dockerfile present for mockup-sandbox
- ✅ docker-compose.yml for local development
- ⚠️ No healthcheck defined in containers

---

## 8. TESTING & VALIDATION

### ✅ Test Files Found
- [app/api-server/src/__tests__/umbra.test.ts](app/api-server/src/__tests__/umbra.test.ts) — Umbra SDK integration tests (uses Jest)

### ⚠️ Test Coverage
- ❌ No tests for verify route
- ❌ No tests for payments routes
- ❌ No tests for Solana operations
- ❌ No mobile app tests (no jest config)
- ❌ No integration tests

### ✅ vitest Configuration
- [app/api-server/vitest.config.ts](app/api-server/vitest.config.ts)
- Configured for Node environment
- Mock clearing between tests

### ⚠️ Build Test Script
**Missing:** `npm test` at root level (would need to collect all test outputs)

---

## 9. DOCUMENTATION STATUS

### ✅ Documentation Present
- [README.md](README.md) — High-level overview (architecture diagram, value prop)
- [docs/IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md) — Component inventory (has TODOs)
- [docs/SOLANA_INTEGRATION.md](docs/SOLANA_INTEGRATION.md) — Solana minting guide
- [docs/UMBRA_INTEGRATION_GUIDE.md](docs/UMBRA_INTEGRATION_GUIDE.md) — Private portfolio guide

### ⚠️ Documentation Gaps
1. **No API documentation** — Routes, request/response formats not documented
2. **No database schema diagram** — Schema is empty anyway
3. **No deployment guide** — Vercel config not explained
4. **No environment setup guide** — No `.env.example` at root
5. **No mobile build instructions** — EAS build not documented
6. **No local development guide** — Multi-service startup sequence unclear

### 📋 TODO Items Found in Docs
- [docs/IMPLEMENTATION_SUMMARY.md:427](docs/IMPLEMENTATION_SUMMARY.md#L427) — `(TODO: add imports)` for main.ts
- [docs/IMPLEMENTATION_SUMMARY.md:429](docs/IMPLEMENTATION_SUMMARY.md#L429) — `(TODO: add @umbra-privacy/sdk)` in package.json
- [docs/IMPLEMENTATION_SUMMARY.md:435](docs/IMPLEMENTATION_SUMMARY.md#L435) — `(TODO: integrate component)` in payment/[id].tsx
- [docs/IMPLEMENTATION_SUMMARY.md:436](docs/IMPLEMENTATION_SUMMARY.md#L436) — `(TODO: add encrypted view)` in portfolio/index.tsx
- [docs/payment-umbra.md:65](docs/payment-umbra.md#L65) — "Next steps / TODOs" section

---

## 10. SECURITY CONCERNS

### 🔴 **Critical Issues**

1. **No Authentication** — Middleware accepts any userId in dev
   - **Risk:** Account takeover in staging
   - **Fix:** Implement JWT validation

2. **Hardcoded Dodo Checkout URL** — Uses test URL for both test/prod
   - **Risk:** Payments routed to test environment in production
   - **Fix:** Use `DODO_MODE` to select checkout domain

3. **Private Key in Environment Variable** — Solana wallet secret key in plaintext
   - **Risk:** Compromised if env leaks
   - **Fix:** Use AWS Secrets Manager or HashiCorp Vault

4. **No Webhook Secret Validation** — Verifies signature but no rate limiting
   - **Risk:** Replay attacks, webhook spam
   - **Fix:** Add rate limiting + nonce tracking

5. **Mock Database in Production** — Returns fake data if `DATABASE_URL` missing
   - **Risk:** Silently fails instead of erroring
   - **Fix:** Throw error if `NODE_ENV=production` and DB unavailable

### ⚠️ **Medium Issues**

1. **CORS Origin Whitelist Empty by Default** — If not set, no CORS (restrictive but unclear)
   - **Fix:** Document required CORS_ORIGIN for each environment

2. **No Rate Limiting** — API endpoints unprotected
   - **Fix:** Add express-rate-limit middleware

3. **Raw Body Capture** — For webhook signatures (good), but could be misused
   - **Fix:** Limit to webhook routes only

4. **No Input Validation** — API endpoints accept any body
   - **Fix:** Add Zod schema validation middleware

5. **No Audit Logging** — Portfolio views log to logger but not to database
   - **Fix:** Store audit events in database

---

## 11. PERFORMANCE CONSIDERATIONS

### ✅ Good Patterns
- Pino logging with async transports
- SQLite in-memory consideration (if used for dev)
- Solana request deduplication (singleton Connection)

### ⚠️ Potential Bottlenecks
1. **N+1 Queries** — Portfolio queries likely to fetch holdings one-by-one
   - **Fix:** Use JOIN queries in Drizzle

2. **Unbounded Results** — `GET /api/portfolio` could return 1000s of holdings
   - **Fix:** Paginate with `limit` + `offset`

3. **LLM Verification Timeout** — Claude Haiku requests may take 10-30s
   - **Fix:** Add timeout (30s default), consider queue for batch processing

4. **Solana Confirmation Wait** — `sendAndConfirmTransaction()` blocks until finality
   - **Fix:** Consider polling model or websocket listener

5. **Image Processing** — Evidence validation hashes all images (slow for large uploads)
   - **Fix:** Parallel hashing, stream processing for large files

---

## 12. RECOMMENDATIONS & ACTION ITEMS

### **Priority 1: CRITICAL (Do Before Production)**

- [ ] **Define Database Schema** (lib/db/src/schema/)
  - Create tables for users, projects, assets, payments, settlements
  - Generate migrations with `drizzle-kit generate`
  - Test with `drizzle-kit push`
  
- [ ] **Implement JWT Authentication**
  - Issue tokens on login (mobile + API server)
  - Validate tokens on all protected routes
  - Set token expiry (15min access, 7day refresh)

- [ ] **Wire Mobile to API Client**
  - Update screens to use `lib/api-client-react` hooks
  - Add error handling + retry logic
  - Implement token refresh flow

- [ ] **Fix Dodo Production Environment**
  - Use `DODO_MODE` env var to select checkout domain
  - Separate test Product ID from production Product ID

### **Priority 2: IMPORTANT (Before MVP Launch)**

- [ ] **Add Input Validation**
  - Wire Zod schemas to all API endpoints
  - Return 400 Bad Request with detailed errors

- [ ] **Update Deprecated Dependencies**
  - `pnpm update glob rimraf lru-cache uuid --latest`
  - Test thoroughly after updates

- [ ] **Implement Payment Webhook Event Handling**
  - Complete Dodo webhook processor
  - Add settlement record persistence
  - Implement retry logic

- [ ] **Add Rate Limiting**
  - Install `express-rate-limit`
  - Apply to all endpoints (different limits per route)

- [ ] **Document API**
  - Ensure OpenAPI spec is current
  - Generate client from spec
  - Document env var requirements

### **Priority 3: NICE-TO-HAVE (Future Improvements)**

- [ ] **Add Comprehensive Logging**
  - Audit trail for all transactions
  - Analytics for verification accuracy
  
- [ ] **Implement Caching**
  - Cache satellite imagery checks
  - Cache AI verification results (by metadata hash)

- [ ] **Add Monitoring/Observability**
  - Sentry for error tracking
  - DataDog/New Relic for APM
  - CloudWatch alarms for DB connection pool

- [ ] **Mobile App Testing**
  - Unit tests for contexts (AuthContext, AtmosContext)
  - Integration tests with API
  - E2E tests for key flows

- [ ] **Improve Error Messages**
  - User-friendly errors from API
  - Mobile fallback UI for offline scenarios

---

## 13. FILES CHECKED & SUMMARY TABLE

### Configuration Files
| File | Lines | Status | Notes |
|------|-------|--------|-------|
| package.json (root) | 50 | ✅ | Scripts configured correctly |
| pnpm-workspace.yaml | 35+ | ✅ | Security settings good, 1440min release age |
| vercel.json | 7 | ✅ | Correctly uses build:ci script |
| docker-compose.yml | 20 | ✅ | api:9001, web:8080 |
| tsconfig.base.json | 25 | ✅ | Strict settings, ES2022 target |
| app/api-server/tsconfig.json | 20 | ✅ | Project references configured |

### API Server Core
| File | Lines | Status | Notes |
|------|-------|--------|-------|
| app/api-server/src/index.ts | 50 | ✅ | Entry point, env loading |
| app/api-server/src/app.ts | 50 | ✅ | Express setup, CORS, logging |
| app/api-server/src/routes/index.ts | 20 | ✅ | Route registration |
| app/api-server/src/routes/health.ts | 10 | ✅ | Healthz endpoint |
| app/api-server/src/routes/verify.ts | 600+ | ✅ | Multi-agent verification |
| app/api-server/src/routes/payments.ts | 400+ | ⚠️ | Webhook incomplete |
| app/api-server/src/routes/solana.ts | 80 | ✅ | Real minting + anchoring |
| app/api-server/src/routes/portfolio-private.ts | 100+ | 🔴 | Requires DB |
| app/api-server/src/routes/payments-private.ts | 80+ | 🔴 | Requires DB |

### Services & Libraries
| File | Lines | Status | Notes |
|------|-------|--------|-------|
| app/api-server/src/lib/logger.ts | 20 | ✅ | Pino config |
| app/api-server/src/lib/solana.ts | 300+ | ✅ | Real Solana integration |
| app/api-server/src/lib/umbra.ts | 600+ | ⚠️ | Simulation mode |
| app/api-server/src/lib/satellite.ts | 150 | ⚠️ | Mock + optional real |
| app/api-server/src/db/pool.ts | 40 | 🔴 | Mock only, no real DB |
| app/api-server/src/middleware/auth.ts | 30 | 🔴 | No JWT, dev-only |
| lib/db/src/index.ts | 30 | 🔴 | Schema empty |
| lib/db/src/schema/index.ts | 25 | 🔴 | EMPTY - CRITICAL |
| lib/integrations-anthropic-ai/src/client.ts | 35 | ✅ | Lazy proxy pattern |
| lib/api-zod/src/index.ts | 2 | 🔴 | Only exports health |

### Mobile App
| File | Lines | Status | Notes |
|------|-------|--------|-------|
| app/mobile/app/_layout.tsx | 50+ | ✅ | Navigation + providers |
| app/mobile/context/AuthContext.tsx | 150+ | ✅ | User auth state |
| app/mobile/context/AtmosContext.tsx | 150+ | ✅ | Projects/assets/payments state |
| app/mobile/app/(auth)/index.tsx | 100+ | ✅ | Login screen |
| app/mobile/app/project/create.tsx | 100+ | ✅ | Project type selector |
| app/mobile/app/project/capture.tsx | 200+ | ✅ | Metadata capture form |
| app/mobile/app/verify/[id].tsx | 150+ | ✅ | 4-phase animation |
| app/mobile/app/zk/[id].tsx | 150+ | ✅ | ZK proof UI (calls real API) |
| app/mobile/app/payment/[id].tsx | 100+ | ✅ | Dodo checkout link |

### Build & Infrastructure
| File | Lines | Status | Notes |
|------|-------|--------|-------|
| app/api-server/build.mjs | 150 | ✅ | esbuild config |
| app/api-server/Dockerfile | 20 | ✅ | Multi-stage build |
| app/api-server/vitest.config.ts | 15 | ✅ | Test runner config |
| lib/db/drizzle.config.ts | 15 | ✅ | ORM config (schema empty though) |

### Documentation
| File | Status | Coverage |
|------|--------|----------|
| README.md | ✅ | Architecture, value prop |
| docs/SOLANA_INTEGRATION.md | ✅ | Minting guide |
| docs/UMBRA_INTEGRATION_GUIDE.md | ✅ | Privacy portfolio |
| docs/IMPLEMENTATION_SUMMARY.md | ⚠️ | Has TODOs, not 100% current |
| docs/payment-umbra.md | ✅ | Payment flow (has TODOs) |

---

## 14. CONCLUSION

### Current Project State: **MVP WITH CRITICAL GAPS**

**What Works:**
- ✅ Build pipeline (fixed)
- ✅ Express API server structure
- ✅ Real Solana integration (minting + anchoring)
- ✅ Multi-agent LLM verification
- ✅ Mobile app UI complete
- ✅ Dodo payments checkout integration

**What's Missing:**
- 🔴 Database schema (NO TABLES DEFINED)
- 🔴 User authentication (no JWT)
- 🔴 Data persistence (all AsyncStorage only)
- 🔴 Portfolio private routes (DB dependent)
- 🔴 Payment webhook completion (event handler incomplete)
- 🔴 API validation (no Zod schemas wired)
- 🔴 Testing (almost none)

**Next Critical Steps:**
1. Define database schema + run migrations
2. Implement JWT authentication
3. Wire mobile to API client hooks
4. Add input validation
5. Complete webhook event handling
6. Document all environment variables

**Estimated Effort to Production-Ready:** 2-3 weeks (with full team)

---

## Appendix: Quick Reference

### Entry Points
```
Mobile:        app/mobile/app/_layout.tsx (port 8081)
API Server:    app/api-server/src/index.ts (port 9001)
Sandbox:       app/mockup-sandbox/ (port 5173)
```

### Key Commands
```bash
pnpm dev:backend           # Start API server (dev)
pnpm dev:mobile            # Start mobile app (Expo)
pnpm dev:web+api           # Both in parallel
pnpm build:ci              # Full build (Vercel-like)
pnpm --filter @workspace/api-server run build  # Just API
```

### Environment Setup (Local Development)
```bash
# Create .env.local in project root
PORT=9001
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=*
DATABASE_URL=postgresql://dev:dev@localhost:5432/atmos
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WALLET_PRIVATE_KEY=<ephemeral or test key>
DODO_API_KEY=<test key>
DODO_WEBHOOK_SECRET=<test secret>
AI_INTEGRATIONS_ANTHROPIC_API_KEY=sk-ant-...
AI_INTEGRATIONS_ANTHROPIC_BASE_URL=https://api.anthropic.com/v1
```

### Useful Links
- [Drizzle Docs](https://orm.drizzle.team/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Anthropic API](https://docs.anthropic.com/)
- [Express.js](https://expressjs.com/)
- [Expo Documentation](https://docs.expo.dev/)

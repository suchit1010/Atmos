# ATMOS Protocol — Full Stack Carbon MRV Infrastructure

> Private. Verifiable. Instant. Global.  
> Real-world climate action → Carbon assets in 24 hours.

---

## What Is ATMOS?

ATMOS Protocol is a **private carbon settlement infrastructure** built on Solana.  
Any CO₂ reduction action → AI-verified → ZK-proven → SPL token minted → settled via Dodo Payments.

**Not a marketplace. Infrastructure.**

---

## Architecture

```
Mobile App (React Native + Expo)
        ↓ HTTPS / WebSocket
    Fastify Backend (Node.js + TypeScript)
        ↓
  ┌─────────────────────────────────┐
  │  Services                       │
  │  ├── Auth (OTP + JWT)           │
  │  ├── Projects (CRUD + GIS)      │
  │  ├── Satellite (Sentinel-2)     │
  │  ├── AI (Carbon MRV engine)     │
  │  ├── ZK (Groth16 proofs)        │
  │  ├── Solana (SPL + anchor)      │
  │  └── Payments (Dodo)            │
  └─────────────────────────────────┘
        ↓
  PostgreSQL + PostGIS | Redis | Solana Devnet
```

---

## Quick Start (5 minutes)

### 1. Clone & configure

```bash
git clone https://github.com/your-org/atmos-protocol
cd atmos-protocol/backend
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET
```

### 2. Start with Docker

```bash
docker-compose up -d
# Backend → http://localhost:3000
# Postgres → localhost:5432
# Redis    → localhost:6379
```

### 3. Verify health

```bash
curl http://localhost:3000/health
# → {"status":"ok","version":"1.0.0","services":{"database":"ok","solana":"ok"}}
```

### 4. Deploy to Vercel

Run this from `atmos_backend`, not `atmos_mobile`:

```bash
vercel deploy --prod
# or
npm run deploy:prod
```

### 5. Start mobile app

```bash
cd ../mobile
npm install
npx expo start
# Scan QR with Expo Go app
```

---

## API Reference

### Auth

```
POST /api/v1/auth/otp/send
  body: { phoneNumber, countryCode }
  → { status: "sent", expiresIn: 300 }

POST /api/v1/auth/otp/verify
  body: { phoneNumber, countryCode, otp, deviceFingerprint }
  → { accessToken, refreshToken, user }

POST /api/v1/auth/token/refresh
  body: { refreshToken }
  → { accessToken }

GET  /api/v1/auth/me          [Auth required]
  → { id, phone, name, role, kycStatus, walletAddress }
```

### Projects

```
POST /api/v1/projects         [Auth required]
  body: { entityType, name, location: {lat,lng}, metadata, areaHa }
  → { project, message }
  ← Triggers MRV pipeline asynchronously

GET  /api/v1/projects         [Auth required]
  query: page, limit, status
  → { projects[], page, limit }

GET  /api/v1/projects/:id     [Auth required]
  → { ...project, co2e_estimated, confidence_score, grade, proof_hash, mint_address }

POST /api/v1/projects/:id/analyze    [Auth]  → re-trigger pipeline
POST /api/v1/projects/:id/mint       [Auth]  → mint SPL token
GET  /api/v1/projects/:id/proof      [Auth]  → ZK proof details
```

### Marketplace

```
GET  /api/v1/marketplace
  query: grade, entityType, minPrice, maxPrice, sortBy, page, limit
  → { listings[], page, limit }

GET  /api/v1/marketplace/ticker
  → { ticker: [{ grade, avg_price, listing_count, total_volume }] }

POST /api/v1/marketplace/listings   [Auth]
  body: { creditId, quantity, unitPriceInr }
  → listing record
```

### Payments

```
POST /api/v1/payments/checkout      [Auth]
  body: { listingId, quantity }
  → { sessionId, checkoutUrl, expiresAt, amountInr }

GET  /api/v1/payments/:sessionId    [Auth]
  → payment intent details

POST /api/v1/payments/webhook       [Dodo Payments → no auth]
  body: Dodo webhook payload
  → { received: true }

POST /api/v1/payments/:id/simulate-success   [Dev only]
```

### Portfolio

```
GET  /api/v1/portfolio       [Auth]
  → { holdings[], summary: { totalCo2e, totalValue } }

POST /api/v1/credits/retire  [Auth]
  body: { creditId, quantity, organisationName?, esgReference? }
  → { burnTxHash, certNFTMint, certUrl }

GET  /api/v1/certificates    [Auth]
  → { certificates[] }
```

### Dashboard

```
GET  /api/v1/dashboard       [Auth]
  → { projects, portfolio, earnings, retirements }
```

### ZK Proofs

```
GET  /api/v1/proofs/:hash/verify
  → { valid, publicSignals, anchorTx }
```

---

## Entity Types & Methodologies

| Entity          | Methodology | CO₂e Source                          |
|-----------------|-------------|--------------------------------------|
| `biochar`       | VM0044      | Biochar permanence (removal)         |
| `agroforestry`  | VM0047      | Tree sequestration                   |
| `soil_carbon`   | VM0042      | SOC improvement                      |
| `crop_residue`  | VM0042      | No-burn avoidance                    |
| `solar_energy`  | AMS-I.D     | Grid displacement                    |
| `ev_fleet`      | AMS-III.C   | Displaced fuel combustion            |
| `building`      | AMS-II.C    | Energy efficiency                    |
| `shipping`      | VM0051      | Maritime fuel reduction              |
| `individual`    | GHG-IND-01  | Personal actions                     |

---

## MRV Pipeline

When a project is submitted, this runs automatically:

```
1. Satellite fetch
   → Sentinel-2 NDVI (current + baseline + 12-month trend)
   → NASA FIRMS fire detection
   → Land-use classification

2. AI verification
   → Entity-specific carbon estimation (IPCC methodologies)
   → Fraud detection (8 signals)
   → 8-dimensional confidence scoring
   → Grade assignment (S/A/B/C/D)
   → Price recommendation

3. ZK proof
   → Hash private inputs (GPS, name, production volumes)
   → Build public signals (CO₂e range, region hash, confidence)
   → Generate Groth16 proof
   → Anchor proof hash on Solana via Memo program

4. Status updates
   → WebSocket events to mobile app
   → Polling fallback for Expo Go
```

---

## Hackathon Track Applications

| Track | Narrative | Key Demo |
|-------|-----------|----------|
| **Dodo Payments** | "Stripe for carbon markets" | INR → USDC → Solana settlement in 24h |
| **Encrypt/ZK** | "Encrypted capital markets" | ZK-MRV: prove CO₂ without revealing data |
| **Privacy (MagicBlock)** | "Private carbon verification" | Business data stays on device, proof on-chain |
| **100xDevs** | "Production-grade architecture" | 8 services, clean code, real integrations |
| **Colosseum Main** | "Carbon infrastructure layer" | Full demo: farmer → payment → certificate |

---

## Demo Script (Hackathon Judges)

```
1. Open app → Splash → Auth (OTP login)
2. Dashboard → "Your Carbon Assets" with live ticker
3. Tap + → Select "Biochar Production"
4. Fill form: Raju Koli, Anand Gujarat, 2.48 ha, Rice Husk, 12.5t biomass
5. Capture GPS location
6. Submit → watch real-time MRV pipeline:
   🛰️ Satellite: NDVI 0.67 · Land: agriculture_active
   🤖 AI: 2.46 tCO₂e · Confidence: 87/100 · Grade A
   🔐 ZK: proof generated · anchored on Solana
7. "Create Carbon Asset" → SPL token minted
8. "List on Marketplace" → appears live
9. Switch to buyer → find listing → tap "Buy Now"
10. Payment: ₹8,610 → Pay with Dodo → UPI flow
11. Settlement: Solana tx confirmed · Certificate NFT minted
12. View certificate: blockchain-verifiable, shareable PDF
```

---

## Project Structure

```
atmos-protocol/
├── backend/
│   ├── src/
│   │   ├── server.ts          Main Fastify server + WebSocket
│   │   ├── routes/api.ts      All API endpoints
│   │   ├── services/
│   │   │   ├── auth.ts        OTP + JWT
│   │   │   ├── satellite.ts   Sentinel-2 + NDVI + FIRMS
│   │   │   ├── ai.ts          Carbon MRV engine (8 methodologies)
│   │   │   ├── zk.ts          Groth16 proof generation
│   │   │   ├── solana.ts      SPL mint + burn + anchor
│   │   │   ├── payments.ts    Dodo Payments integration
│   │   │   └── mrv.ts         Pipeline orchestrator
│   │   ├── middleware/auth.ts  JWT guard
│   │   ├── db/
│   │   │   ├── pool.ts        PostgreSQL connection pool
│   │   │   └── schema.sql     Full PostGIS schema
│   │   ├── types/schemas.ts   Zod validation schemas
│   │   └── utils/logger.ts    Winston structured logging
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .env.example
│
└── mobile/
    ├── App.tsx                Root with auth guard
    ├── src/
    │   ├── navigation/        Bottom tabs + stack
    │   ├── screens/
    │   │   ├── auth/          Splash + OTP login
    │   │   ├── dashboard/     Home + live ticker
    │   │   ├── project/       Entity select + capture form
    │   │   ├── verification/  AI results + ZK proof + asset creation
    │   │   ├── marketplace/   Live listings + filters
    │   │   ├── payment/       Dodo checkout + settlement + certificate
    │   │   └── portfolio/     Holdings + retirement + profile
    │   ├── services/api.ts    Axios + token refresh
    │   ├── store/index.ts     Zustand global state
    │   ├── theme/index.ts     Design system
    │   └── components/        Shared UI components
    └── package.json
```

---

## Security

- JWT access tokens: 15 min expiry
- Refresh tokens: 7 day expiry
- OTP: 6 digits, 5 min TTL, max 3/hour per phone
- Rate limiting: 1000 req/min per user
- ZK proofs: private inputs never stored in DB
- Solana: proof anchored immutably on-chain
- Webhook: HMAC-SHA256 signature verification

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Min 32 chars |
| `JWT_REFRESH_SECRET` | ✅ | Min 32 chars |
| `SOLANA_RPC_URL` | ✅ | devnet or mainnet-beta |
| `TWILIO_ACCOUNT_SID` | Optional | OTP SMS (mock logs if absent) |
| `DODO_API_KEY` | Optional | Payment (mock session if absent) |
| `SENTINEL_HUB_CLIENT_ID` | Optional | Satellite (simulated if absent) |

---

## Built With

**Backend:** Node.js · TypeScript · Fastify · PostgreSQL + PostGIS · Redis · Zod  
**Blockchain:** Solana · Anchor · SPL Token · @solana/web3.js  
**Mobile:** React Native · Expo · Zustand · TanStack Query · React Navigation  
**Integrations:** Dodo Payments · Sentinel-2 (STAC API) · NASA FIRMS · Twilio  
**ZK:** Groth16 (bn128) · Circom circuit (carbon_mrv_v1)

---

**ATMOS Protocol — The trust and settlement infrastructure for global climate finance.**

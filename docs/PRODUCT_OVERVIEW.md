# Atmos — Complete Product Overview

**Last Updated:** June 1, 2026  
**Version:** 1.0

---

## 🎯 What is Atmos?

Atmos is a **climate finance infrastructure platform** that transforms verified carbon reductions into tradable digital assets on Solana blockchain. Think of it as "Stripe for carbon credits" — instant verification, instant settlement, privacy-preserving.

**The Problem We Solve:**
- Traditional carbon verification takes 6-18 months and costs $5K-$50K
- Small producers (<100 tonnes CO2e) are excluded from carbon markets
- Corporate buyers need privacy (competitors shouldn't see ESG purchases)
- Cross-border payments are slow (3-7 days) and expensive (3-8% fees)

**Our Solution:**
- **2-minute AI verification** using satellite imagery + multi-agent LLMs
- **Instant SPL token minting** on Solana (immutable proof)
- **Private settlement** via Umbra (amounts hidden on-chain)
- **Global payments** via Dodo (50+ currencies, UPI, cards)

---

## 🏗️ System Architecture

### Tech Stack
```
Frontend:  React Native (Expo 55) + React 19
Backend:   Node.js 18 + TypeScript 5.9 + Express.js 5
Database:  PostgreSQL 15 (Drizzle ORM)
Blockchain: Solana (devnet → mainnet)
AI:        Anthropic Claude Haiku 4.5
Payments:  Dodo Payments + Svix webhooks
Privacy:   Umbra SDK (confidential transfers)
Hosting:   Vercel (serverless functions)
```

### Data Flow
```
1. Producer captures project on mobile (photos + metadata)
   ↓
2. AI verification (2 min): Carbon Agent + Quality Agent + Fraud Agent
   ↓
3. ZK proof anchored on Solana (30 sec)
   ↓
4. SPL token minted (1 min)
   ↓
5. Buyer purchases via Dodo checkout (UPI/card)
   ↓
6. Webhook triggers settlement (credit retirement + certificate)
   ↓
7. Producer receives payment (instant)
```

---

## 📱 User Flows

### Producer Flow (Farmer/Project Developer)
1. **Sign Up** → Phone OTP or Google/Apple OAuth
2. **KYC** → Aadhaar + PAN + Farm document upload
3. **Create Project** → Select type (biochar, solar, agroforestry, etc.)
4. **Capture Data** → GPS location + 2-10 photos + metadata
5. **Submit for Verification** → AI processes in 2 minutes
6. **View Results** → CO2 amount, confidence score, grade (S/A/B/C/D)
7. **Mint Token** → SPL token created on Solana
8. **List for Sale** → Set price, publish to marketplace
9. **Receive Payment** → Instant settlement when buyer purchases

### Buyer Flow (Corporate/Individual)
1. **Browse Marketplace** → Filter by type, grade, location, price
2. **View Project Details** → Verification report, satellite imagery, proof hash
3. **Select Quantity** → Choose tonnes CO2e to purchase
4. **Choose Payment Method:**
   - **Public:** Dodo checkout (UPI/card) → visible on-chain
   - **Private:** Umbra transfer → encrypted on-chain
5. **Complete Payment** → Redirect to Dodo or wallet signature
6. **Receive Credits** → SPL tokens in wallet
7. **Retire Credits** → Burn tokens + get certificate (optional)

---

## 🔐 Privacy Architecture (Umbra Integration)

### Problem
Corporate buyers don't want competitors to see:
- How much they're spending on carbon credits
- When they're purchasing (timing reveals strategy)
- Which projects they're buying from

### Solution: Umbra Confidential Transfers
```
Traditional Solana Transfer (PUBLIC):
  From: 7xKXt...  →  To: 9yMNp...  Amount: 48 tonnes  ✅ Visible

Umbra Private Transfer (ENCRYPTED):
  From: 7xKXt...  →  To: stealth_abc123...  Amount: ●●●●●  🔒 Hidden
```

### How It Works
1. **Stealth Addresses:** One-time addresses for each transfer
2. **Encrypted Amounts:** On-chain data is encrypted
3. **Viewing Keys:** Selective disclosure for auditors/tax authorities
4. **Compliance Reports:** CSV/JSON export for regulatory filing

### Use Cases
- **Corporate ESG:** Hide purchase amounts from competitors
- **Institutional Funds:** Encrypted portfolio balances
- **Tax Compliance:** Generate reports with viewing keys
- **Audit Trails:** Immutable transaction log

---

## 🤖 AI Verification Engine

### Multi-Agent Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    Verification Request                  │
│  (project type, location, metadata, photos)             │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬────────────┐
        ↓            ↓            ↓            ↓
   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
   │ Image  │  │ Carbon │  │Quality │  │ Fraud  │
   │Evidence│  │ Agent  │  │ Agent  │  │ Agent  │
   └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘
        │           │           │           │
        └───────────┴───────────┴───────────┘
                     │
                     ↓
            ┌────────────────┐
            │ Final Verdict  │
            │ CO2: 2.46 t    │
            │ Confidence: 87%│
            │ Grade: A       │
            │ Fraud Risk: LOW│
            └────────────────┘
```

### Agent Responsibilities

**1. Image Evidence Agent**
- Detects synthetic/AI-generated images
- Identifies duplicates
- Checks for stock photos
- Validates image quality

**2. Carbon Agent**
- Calculates CO2 reductions using IPCC/VERRA methodologies
- Project-specific calculations:
  - **Biochar:** Biomass input × efficiency × carbon stability
  - **Solar:** kWh × grid emission factor
  - **Agroforestry:** Hectares × sequestration rate
- Returns: CO2 amount, methodology, explanation

**3. Quality Agent**
- Scores data completeness (0-100)
- Checks metadata consistency
- Assigns grade (S/A/B/C/D)
- Lists observations

**4. Fraud Agent**
- Detects red flags:
  - Impossible yields (biochar output > input)
  - Unrealistic tree density
  - Solar generation outside normal ranges
- Returns: Risk level (LOW/MEDIUM/HIGH), signals

### Satellite Cross-Check
- **Google Static Maps API** for boundary verification
- Calculates land area from GPS polygon
- Checks imagery availability
- Fallback to mock if API unavailable

---

## 💳 Payment Integration

### Dodo Payments (Public Checkout)
```
Flow:
1. Mobile app calls POST /api/payments/dodo/create
2. API returns checkout URL
3. User redirected to Dodo (UPI/card/wallet)
4. User completes payment
5. Dodo sends webhook to /api/payments/dodo/webhook
6. API verifies Svix signature
7. Settlement record created
8. Credits retired (burned) on Solana
9. Certificate generated
```

**Webhook Security:**
- HMAC-SHA256 signature verification
- Svix headers: `svix-id`, `svix-timestamp`, `svix-signature`
- Replay protection (5-minute tolerance)
- Idempotency (event ID tracking)

### Umbra Payments (Private Checkout)
```
Flow:
1. Buyer initiates private purchase
2. API generates stealth address
3. Umbra SDK creates confidential transfer
4. Amount encrypted on-chain
5. Viewing key hint stored in DB
6. Settlement record created (encrypted)
7. Buyer can generate viewing key for compliance
```

---

## 📊 Database Schema

### Core Tables

**users**
```sql
id                UUID PRIMARY KEY
phone             VARCHAR(20) UNIQUE
email             VARCHAR(255)
wallet_address    VARCHAR(100)
kyc_status        VARCHAR(50)  -- unverified, pending, verified, rejected
role              VARCHAR(50)  -- producer, buyer, admin
created_at        TIMESTAMPTZ
```

**projects**
```sql
id                      UUID PRIMARY KEY
user_id                 UUID REFERENCES users(id)
name                    VARCHAR(255)
type                    VARCHAR(50)  -- biochar, solar, agroforestry, etc.
location                VARCHAR(255)
status                  VARCHAR(50)  -- draft, submitted, verified, minted
co2_reduction           NUMERIC(10,2)
verification_confidence INT
verification_grade      VARCHAR(2)   -- S, A, B, C, D
mint_address            VARCHAR(100)
token_supply            VARCHAR(50)
metadata                JSONB
created_at              TIMESTAMPTZ
```

**payment_intents**
```sql
id                  UUID PRIMARY KEY
user_id             UUID REFERENCES users(id)
project_id          UUID REFERENCES projects(id)
quantity            INT
amount_paise        BIGINT
currency            VARCHAR(10)
payment_method      VARCHAR(50)  -- umbra-private, public
status              VARCHAR(50)  -- pending, processing, completed, failed
dodo_payment_id     VARCHAR(255)
dodo_checkout_url   TEXT
umbra_commitment    VARCHAR(255)
umbra_tx_hash       VARCHAR(255)
created_at          TIMESTAMPTZ
```

**umbra_transfers** (Private Payments)
```sql
id                  UUID PRIMARY KEY
payment_intent_id   UUID REFERENCES payment_intents(id)
project_id          UUID REFERENCES projects(id)
sender_wallet       VARCHAR(100)
stealth_address     VARCHAR(100)
encrypted_note      TEXT
viewing_key_hint    VARCHAR(64)
token_mint          VARCHAR(100)
amount_lamports     VARCHAR(50)
tx_hash             VARCHAR(255) UNIQUE
status              VARCHAR(50)
created_at          TIMESTAMPTZ
```

**umbra_viewing_keys** (Compliance)
```sql
id          UUID PRIMARY KEY
user_id     UUID REFERENCES users(id)
key_hash    VARCHAR(255) UNIQUE
expires_at  TIMESTAMPTZ
created_at  TIMESTAMPTZ
```

---

## 🚀 Deployment Architecture

### Vercel Serverless Functions
```
Root vercel.json:
  buildCommand: pnpm run build:ci
  outputDirectory: app/mockup-sandbox/dist
  
  Routes:
    /api/healthz     → api/healthz.js
    /api/*           → api/index.js
    /*               → index.html (SPA)
```

### Build Pipeline
```
1. pnpm install --frozen-lockfile
2. pnpm run build:libs (TypeScript compilation)
3. pnpm run build:vercel (API server esbuild)
4. pnpm run build:frontend (Vite build)
5. Deploy to Vercel
```

### Environment Variables
```
# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WALLET_PRIVATE_KEY=<base58_secret_key>
SPL_TOKEN_DECIMALS=6

# AI
AI_INTEGRATIONS_ANTHROPIC_API_KEY=sk-ant-...
AI_INTEGRATIONS_ANTHROPIC_BASE_URL=https://api.anthropic.com/v1

# Payments
DODO_API_KEY=<test_or_prod_key>
DODO_WEBHOOK_SECRET=whsec_...
DODO_MODE=test|live

# Database
DATABASE_URL=postgresql://user:pass@host:5432/atmos

# Auth
JWT_SECRET=<random_secret>

# Optional
GOOGLE_MAPS_API_KEY=<api_key>
CORS_ORIGIN=*
```

---

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- pnpm 10+
- PostgreSQL 15+
- Solana CLI (optional)

### Quick Start
```bash
# 1. Clone repo
git clone https://github.com/suchit1010/Atmos.git
cd Atmos

# 2. Install dependencies
pnpm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your keys

# 4. Start API server
pnpm --filter @workspace/api-server dev
# → http://localhost:9001

# 5. Start mobile app (separate terminal)
pnpm --filter @workspace/mobile dev
# → Scan QR with Expo Go

# 6. Start frontend (optional)
pnpm --filter @workspace/mockup-sandbox dev
# → http://localhost:5173
```

### Testing
```bash
# API tests
pnpm --filter @workspace/api-server test

# Solana smoke test
pnpm --filter @workspace/api-server test:smoke

# Build verification
pnpm run build:ci
```

---

## 📈 Monitoring & Observability

### Logging (Pino)
```typescript
logger.info({ projectId, co2 }, 'Project verified');
logger.error({ err }, 'Verification failed');
logger.audit('umbra.transfer.sent', userId, { amount });
```

### Metrics to Track
- Verification time (p50, p95, p99)
- API response time
- Solana transaction success rate
- Webhook delivery success rate
- Database query time
- Error rates by endpoint

### Alerts
- API downtime > 1 minute
- Verification failure rate > 5%
- Solana RPC errors > 10/minute
- Database connection failures
- Webhook signature failures

---

## 🔒 Security Considerations

### Authentication
- JWT tokens with 7-day expiry
- Refresh tokens with 30-day expiry
- HMAC-SHA256 for token signing
- Constant-time comparison for signatures

### Authorization
- Role-based access control (producer, buyer, admin)
- Project ownership validation
- Wallet address verification

### Data Protection
- HTTPS only (TLS 1.3)
- Encrypted database connections
- Sensitive data redaction in logs
- Webhook signature verification
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)

### Compliance
- GDPR: user data export/deletion
- KYC: Aadhaar Act compliance (India)
- AML: transaction monitoring
- Audit logs: 7-year retention

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **Database Schema Empty:** No tables defined yet (migration pending)
2. **Auth Middleware:** Development mode (no JWT validation)
3. **Umbra SDK:** Simulation mode (SDK not installed)
4. **Satellite API:** Mock mode (no Google Maps API key)
5. **Mobile-API Integration:** Not wired (AsyncStorage only)

### Technical Debt
1. **No Tests:** API routes lack unit/integration tests
2. **No Rate Limiting:** Per-user rate limits not implemented
3. **No Caching:** Redis not integrated
4. **No Monitoring:** No APM/error tracking
5. **No CI/CD:** Manual deployments

### Roadmap Fixes
- **Q3 2026:** Database schema + migrations
- **Q3 2026:** JWT authentication
- **Q4 2026:** Umbra SDK integration
- **Q4 2026:** Test coverage > 80%
- **Q1 2027:** Production monitoring

---

## 📚 Additional Documentation

- **[PRD.md](./PRD.md)** — Product Requirements Document
- **[TRD.md](./TRD.md)** — Technical Requirements Document (in progress)
- **[SOLANA_INTEGRATION.md](./SOLANA_INTEGRATION.md)** — Solana minting guide
- **[UMBRA_INTEGRATION_GUIDE.md](./UMBRA_INTEGRATION_GUIDE.md)** — Privacy integration
- **[payment-umbra.md](./payment-umbra.md)** — Payment flow details
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** — Component inventory

---

**Questions? Contact:** engineering@atmos.protocol

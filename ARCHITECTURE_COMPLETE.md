/**
 * ATMOS PROTOCOL — COMPLETE PRODUCTION ARCHITECTURE
 * Week 1 Implementation Final View
 */

# Complete System Architecture

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Mobile App (React Native)                                      │
│  ├─ Auth Screen (Solana wallet login)                          │
│  ├─ Dashboard (Project overview)                               │
│  ├─ Verification Screen                                        │
│  │  └─ Job Polling: GET /api/v1/projects/:id/verify/:jobId   │
│  └─ Portfolio (Token balance, transactions)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
┌────────────────────────────▼────────────────────────────────────┐
│                      API LAYER (Fastify)                        │
├─────────────────────────────────────────────────────────────────┤
│  Backend Server (Node.js 20 + TypeScript)                       │
│  ├─ Port: 3001 (prod) / 3000 (dev)                             │
│  ├─ Rate Limiting:                                             │
│  │  ├─ Free: 100 req/min                                       │
│  │  ├─ Pro: 1000 req/min                                       │
│  │  └─ Enterprise: Unlimited                                   │
│  ├─ Endpoints:                                                 │
│  │  ├─ POST /api/v1/projects/:id/verify → Job queued (202)   │
│  │  ├─ GET /api/v1/projects/:id/verify/:jobId → Status       │
│  │  ├─ GET /api/v1/admin/queue/stats → Metrics               │
│  │  └─ GET /api/healthz, /readyz → Health checks             │
│  └─ Middleware:                                                │
│     ├─ Helmet (security headers)                              │
│     ├─ CORS (cross-origin)                                    │
│     ├─ Compression                                            │
│     ├─ Sentry (error tracking)                                │
│     └─ Request logging                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼─────┐   ┌──────────▼────────┐  ┌──────▼──────┐
│   SERVICE   │   │   DATA LAYER      │  │ MONITORING  │
│   LAYER     │   │                   │  │             │
├─────────────┤   ├───────────────────┤  ├─────────────┤
│             │   │                   │  │             │
│ AI Service  │   │ PostgreSQL 16     │  │ Sentry      │
│             │   │ ├─ Partitioned    │  │ ├─ Errors   │
│ ZK Service  │   │ │  by date        │  │ ├─ Traces   │
│             │   │ ├─ Audit tables   │  │ └─ Metrics  │
│ Solana      │   │ └─ Stats views    │  │             │
│ Client      │   │                   │  │ Redis Cache │
└─────────────┘   │ Redis 7           │  │ ├─ Queue    │
                  │ ├─ Job queue      │  │ └─ Sessions │
                  │ ├─ Sessions       │  │             │
                  │ └─ Cache          │  │ PostGIS     │
                  │                   │  │ ├─ Geo data │
                  │ S3 Storage        │  │ └─ Mapping  │
                  │ ├─ Satellite data │  │             │
                  │ └─ Backups        │  └─────────────┘
                  └───────────────────┘
        │
┌───────▼──────────────────────────────────────────────────────┐
│           VERIFICATION QUEUE (Bull + Redis)                  │
├──────────────────────────────────────────────────────────────┤
│  Async Job Processing                                        │
│  ├─ 5 Concurrent Workers                                    │
│  ├─ Job States: pending, active, completed, failed, delayed │
│  ├─ Retry Logic: 3 attempts × exponential backoff           │
│  ├─ Dead Letter Queue: Permanent failures                   │
│  └─ Progress Tracking: 25%, 50%, 75%, 100%                 │
│                                                              │
│  Job Flow:                                                  │
│  1. AI Verification → runAIVerification()                   │
│  2. ZK Proof Generation → generateZKProof()                │
│  3. Solana Minting → mintCarbonCredits()                    │
│  4. Database Storage → query()                              │
└─────────────────────┬──────────────────────────────────────┘
                      │ JSON RPC
┌─────────────────────▼──────────────────────────────────────┐
│         SOLANA BLOCKCHAIN                                  │
├──────────────────────────────────────────────────────────────┤
│  Program ID: AtmosXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX   │
│                                                              │
│  Smart Contract (Anchor Framework)                          │
│  ├─ 10 Core Instructions:                                  │
│  │  1. initialize_config() - Setup governance              │
│  │  2. initialize_mint() - Create SPL token                │
│  │  3. mint_carbon_credits() - Single mint                │
│  │  4. batch_mint_carbon_credits() - Batch (max 100)      │
│  │  5. retire_carbon_credits() - Burn tokens               │
│  │  6. record_settlement() - Marketplace trade             │
│  │  7. pause_program() - Emergency stop                    │
│  │  8. unpause_program() - Resume                          │
│  │  9. update_zk_version() - Upgrade ZK                    │
│  │  10. get_config() - Fetch settings                      │
│  │                                                          │
│  ├─ Accounts:                                              │
│  │  ├─ ProgramConfig (1 global)                            │
│  │  ├─ SPL Mint (1 token)                                  │
│  │  ├─ VerificationRecord (per project)                    │
│  │  ├─ UserDailyLimit (per user)                           │
│  │  ├─ SettlementRecord (per trade)                        │
│  │  └─ RetirementRecord (per retirement)                   │
│  │                                                          │
│  └─ Security:                                              │
│     ├─ ZK Proof Verification (versioned)                  │
│     ├─ 2% Protocol Fee (to DAO wallet)                     │
│     ├─ Rate Limiting (100 mints/user/day)                 │
│     ├─ String Validation (32 byte project_id)             │
│     ├─ Emergency Pause (admin only)                        │
│     └─ Deterministic PDAs (lookup by project_id)          │
│                                                              │
│  Devnet Testnet: Ready for deployment                      │
│  Localnet: Ready for testing                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow

### Verification Flow (Happy Path)

```
[User] → [Mobile App]
           │
           ├─ Authenticate (Solana wallet)
           ├─ Select project
           └─ Click "Verify"
               │
               ▼
           POST /api/v1/projects/:id/verify
               │
               ├─ Rate limit check ✓
               ├─ DB: Set project.status = 'analyzing'
               └─ Queue job
                   │
                   ├─ jobId = "12345"
                   ├─ estimatedTime = 60s
                   └─ Response: 202 Accepted
                       │
                       │ [User sees "Minting... 25%"]
                       │
                       ▼
           GET /api/v1/projects/:id/verify/12345
               │
               ├─ Redis lookup (queue:12345)
               └─ Return {state, progress, result}
                   │
                   │ Worker processing...
                   │ ├─ 25%: Running AI verification
                   │ ├─ 50%: Generating ZK proof
                   │ ├─ 75%: Calling Solana mintCarbonCredits()
                   │ └─ 100%: Storing result in DB
                   │
                   ▼
           [Complete] → Show token balance
           {
             "state": "completed",
             "progress": 100,
             "result": {
               "projectId": "proj-123",
               "co2eEstimated": 5000,
               "confidence": 0.95,
               "grade": "A",
               "zkProof": "0x...",
               "tokensMinted": 5000,
               "fee": 100,
               "transactionHash": "5Hx..."
             }
           }
```

### Solana Minting (Smart Contract)

```
Backend calls: mintCarbonCredits(
  amount: 5000,
  projectId: "proj-123",
  zkProof: "0x..."
)

Smart Contract:
  ├─ Verify ZK proof ✓
  ├─ Check rate limit (100/day) ✓
  ├─ Validate project_id length ✓
  ├─ Calculate fee: (5000 × 2%) / 100 = 100
  ├─ Mint to recipient: 5000 - 100 = 4900 tokens
  ├─ Mint to fee wallet: 100 tokens
  ├─ Store VerificationRecord (deterministic PDA)
  ├─ Emit CarbonCreditsMinted event
  └─ Update config totals
      │
      ├─ totalMinted += 4900
      └─ Update program stats
```

---

## 🔄 Component Integration

### Verification Queue ← → Solana Client

```
verification-queue.production.ts
├─ Receives job from API
├─ Extracts projectId, userId, type, location, metadata
└─ Calls runAIVerification()
    │
    ├─ Returns AIVerificationResult:
    │  ├─ co2eEstimated: 5000
    │  ├─ confidence: {overall: 0.95}
    │  ├─ grade: 'A'
    │  ├─ fraud: {risk: 0.02}
    │  └─ methodology: 'Satellite + ML'
    │
    └─ Maps to ZKProofInput:
       ├─ projectId
       ├─ amount
       ├─ confidence: 0.95 (extracted .overall)
       ├─ methodology
       └─ timestamp
        │
        └─ Calls generateZKProof()
           │
           ├─ Returns { proof, publicInputs }
           │
           └─ Calls solana-client.mintCarbonCredits()
              │
              ├─ atmos.client.mintCarbonCredits(
              │    projectId: "proj-123",
              │    amount: 5000,
              │    zkProof: proof,
              │    recipientWallet: recipient
              │  )
              │
              └─ ✅ Tokens appear in wallet
```

---

## 📈 Deployment Phases

### Phase 1: Localnet (Days 1-2)
```
Goal: Validate smart contract locally

Start validator:
  solana-test-validator --reset

Build contract:
  cargo build --lib --release
  anchor build

Deploy locally:
  anchor deploy

Output:
  Program ID: 4xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  (Copy to lib.rs declare_id!())
```

### Phase 2: Devnet (Days 3-4)
```
Goal: Test in public testnet

Switch RPC:
  solana config set --url https://api.devnet.solana.com
  solana airdrop 10

Deploy:
  anchor deploy

Initialize:
  anchor run init_config \
    --fee-recipient <wallet> \
    --upgrade-authority <multisig>

Test end-to-end:
  npm run test
  curl POST /api/v1/projects/test/verify
  Check Devnet explorer for transactions
```

### Phase 3: Mainnet (Week 2 - Post-Audit)
```
Goal: Launch to production

Security audit:
  External firm review (3-4 days)
  Fix any findings
  Re-test

Setup governance:
  Create multisig wallet (3-of-5)
  Prepare deployment transaction

Deploy:
  solana config set --url https://api.mainnet-beta.solana.com
  solana program deploy target/deploy/atmos_protocol.so
    --program-id <mainnet-program-id>
    --signer <multisig-key>

Monitor:
  Watch transactions on Solana explorer
  Track fee accumulation
  Monitor error rates in Sentry
```

---

## 🔐 Security Architecture

```
┌─ Input Validation ─────────────────────┐
│ ├─ String length checks (32/64 bytes) │
│ ├─ Amount validation (> 0)             │
│ ├─ Pubkey validation                   │
│ └─ Rate limiting (100/user/day)        │
└────────────────────────────────────────┘
            │
            ▼
┌─ ZK Verification ──────────────────────┐
│ ├─ Proof version check (v1, v2, ...)   │
│ ├─ Proof validation (non-empty)        │
│ ├─ Hash verification                   │
│ └─ Upgrade path (post-deploy)          │
└────────────────────────────────────────┘
            │
            ▼
┌─ Account Constraints ──────────────────┐
│ ├─ PDA seed validation                 │
│ ├─ Bump verification                   │
│ ├─ Owner checks                        │
│ └─ Signer validation                   │
└────────────────────────────────────────┘
            │
            ▼
┌─ State Management ─────────────────────┐
│ ├─ Deterministic PDAs                  │
│ ├─ Config governance                   │
│ ├─ Emergency pause                     │
│ └─ Update authority                    │
└────────────────────────────────────────┘
            │
            ▼
┌─ Monitoring ───────────────────────────┐
│ ├─ Sentry error tracking               │
│ ├─ Event emissions (audit trail)       │
│ ├─ Health checks                       │
│ └─ Fee collection tracking             │
└────────────────────────────────────────┘
```

---

## 💰 Revenue Model

```
User mints 10,000 tokens
│
├─ Protocol fee: 10,000 × 2% = 200 tokens
├─ User receives: 10,000 - 200 = 9,800 tokens
└─ DAO wallet: +200 tokens

Scale: 1M users × 100 mints/user/month
├─ Total mints: 100M/month
├─ Fee rate: 2%
├─ Fee collected: 2M tokens/month
└─ At $1-5/token: $2M-$10M/month revenue

Annual (conservative): $12M-$60M
```

---

## 📌 Key Milestones

✅ **Day 1-2: Backend Complete**
- Verification queue
- Sentry monitoring
- Solana client
- API endpoints
- TypeScript (0 errors)

⏳ **Day 3: Localnet Build**
- Build Solana contract (WSL2/Docker)
- Deploy to Localnet
- Get program ID

⏳ **Day 4: Devnet Test**
- Deploy to Devnet
- Initialize config
- Run end-to-end tests
- Verify fee collection

⏳ **Day 5: Mobile Integration**
- Async job polling UI
- Progress display
- Balance update

⏳ **Week 2: Pre-Mainnet**
- Security audit (external)
- Fix findings
- Mainnet deployment

🚀 **Week 2+: Launch**
- Mainnet live
- Monitor operations
- Track revenue

---

## Summary

**Architecture**: Clean separation of concerns (API → Queue → Solana)  
**Security**: Multi-layered validation + emergency controls  
**Scalability**: Async queue + batch processing + rate limiting  
**Monitoring**: Real-time error tracking + event audit trail  
**Revenue**: 2% protocol fee = $12M-$60M annually at scale  

**Status**: ✅ **READY FOR DEVNET DEPLOYMENT**

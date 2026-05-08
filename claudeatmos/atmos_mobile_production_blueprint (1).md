# ATMOS — Production App Blueprint

## Monorepo Structure

```txt
atmos/
├── apps/
│   ├── mobile/                 # React Native + Expo
│   ├── web/                    # Next.js landing + admin
│   ├── api-gateway/            # NestJS gateway
│   ├── ai-engine/              # Verification services
│   ├── zk-engine/              # Proof generation
│   ├── settlement-engine/      # Solana tx services
│   └── marketplace-engine/
│
├── packages/
│   ├── ui/
│   ├── types/
│   ├── auth/
│   ├── sdk/
│   └── config/
│
├── infrastructure/
│   ├── docker/
│   ├── kubernetes/
│   ├── terraform/
│   └── monitoring/
```

---

# Mobile App Stack

## Core

- React Native + Expo
- TypeScript
- Zustand
- TanStack Query
- React Navigation
- Reanimated
- React Hook Form
- Zod

## Folder Structure

```txt
apps/mobile/src/
├── app/
├── navigation/
├── screens/
│   ├── splash/
│   ├── auth/
│   ├── dashboard/
│   ├── project/
│   ├── verification/
│   ├── zk/
│   ├── exchange/
│   ├── payment/
│   ├── portfolio/
│   └── profile/
│
├── services/
├── hooks/
├── components/
├── store/
├── theme/
└── utils/
```

---

# Backend

## API Gateway

Responsibilities:

- JWT auth
- API routing
- Rate limiting
- Audit logging

Endpoints:

```txt
POST /auth/send-otp
POST /auth/verify-otp
POST /projects
POST /verify
POST /zk/proof
POST /assets/mint
POST /payments/checkout
POST /settlement/confirm
GET  /portfolio
```

---

# Database Schema

## PostgreSQL

### users

- id
- phone
- email
- wallet
- kyc_status

### projects

- id
- user_id
- type
- metadata
- verification_status

### proofs

- id
- project_id
- proof_hash
- signals

### assets

- id
- project_id
- amount
- grade
- mint_address

### payments

- id
- asset_id
- amount
- provider
- status

---

# AI Engine

Pipeline:

1. Media upload
2. Satellite fetch
3. Vision analysis
4. Carbon scoring
5. Fraud scoring
6. Confidence scoring

Output:

```json
{
  "co2": 2.46,
  "confidence": 87,
  "fraudRisk": "LOW"
}
```

---

# ZK Engine

Flow:

1. Encrypt raw data
2. Generate witness
3. Generate proof
4. Verify proof
5. Store hash on Solana

Outputs:

- proofHash
- publicSignals

---

# Payment Engine

Provider:

Dodo Payments

Flow:

1. Create checkout
2. Webhook listener
3. Payment confirmation
4. Trigger settlement

---

# Solana Layer

Programs:

## atmos-chain

### CarbonMintProgram
Mint carbon asset.

### SettlementProgram
Transfer ownership.

### RetirementProgram
Burn asset.

---

# Security

## Rate Limits

Auth:
5/min

Uploads:
10/min

Public APIs:
100/min

## Secrets

Use Vault.

## Encryption

AES-256

---

# Monitoring

## Sentry

- crash tracking
- payment failures
- mobile exceptions

## Prometheus + Grafana

- latency
- API errors
- queue failures
- blockchain failures

---

# Deployment

## CI/CD

GitHub Actions

Stages:

- lint
- tests
- build
- security scan
- deploy

---

# MVP Build Order

Week 1:
OTP + dashboard + project creation

Week 2:
AI verification + satellite mock

Week 3:
ZK + Solana mint

Week 4:
Dodo payments + demo polish

---

# Winning Demo Flow

User creates project → AI verifies → ZK proof generated → Carbon asset minted → Buyer pays → Settlement completes.


---

# Sprint 1 Implementation (Hackathon Build)

## Day 1–2: Authentication + App Shell

### Features

- Splash animation
- Phone OTP auth
- Google / Apple fallback
- Session persistence
- Secure token storage

### Mobile Components

```txt
AuthScreen
OTPInput
CountryPicker
SocialLoginButtons
```

### Backend Implementation

OTP provider abstraction:

```txt
OtpProvider
├── TwilioProvider
├── Msg91Provider
└── MockProvider
```

Token strategy:

- access token = 15 min
- refresh token = 30 days

---

## Day 3–4: Project Creation

### Inputs

- project type
- geo location
- media upload
- project metadata

### API Flow

```txt
Mobile
 ↓
API Gateway
 ↓
Project Service
 ↓
Postgres + Object Storage
```

Media pipeline:

- compress image
- upload chunked
- virus scan
- generate thumbnails

---

## Day 5–6: AI Verification

### Services

Verification queue:

```txt
Upload
 ↓
Redis Queue
 ↓
AI Worker
 ↓
Result DB
```

Models:

- object detection
- anomaly detection
- carbon scoring

Fallback mode:

If AI fails:

- use rule engine
- allow manual review

---

## Day 7: ZK + Solana Demo

### ZK Flow

```txt
Project Data
 ↓
Hash
 ↓
Circuit Input
 ↓
Proof Generation
 ↓
Proof Verify
```

### Solana Flow

```txt
Verified Proof
 ↓
Mint Asset
 ↓
Store Mint Address
```

---

# Production Infrastructure

## Queueing

Use BullMQ.

Queues:

- verification-jobs
- zk-jobs
- settlement-jobs
- notifications

## Feature Flags

Use LaunchDarkly style toggles.

Flags:

- enable-zk
- enable-payments
- enable-marketplace

## Logging

Structured JSON logs:

- requestId
- userId
- serviceName
- latency
- errorCode

## Health Checks

Endpoints:

```txt
/health
/health/db
/health/solana
/health/zk
```


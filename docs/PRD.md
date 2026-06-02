# Atmos — Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** June 1, 2026  
**Status:** Active Development  
**Product Owner:** Atmos Team

---

## Executive Summary

**Atmos** is a climate finance infrastructure platform that transforms verified carbon reductions from physical projects into tradable digital assets on Solana blockchain. The platform combines mobile data capture, AI-powered verification, zero-knowledge proofs, and private settlement rails to create a transparent, privacy-preserving carbon credit marketplace.

**Core Value Proposition:**
- **For Producers:** Turn verified carbon reductions into instant revenue
- **For Buyers:** Purchase verified carbon credits with privacy guarantees
- **For Institutions:** Compliance-ready audit trails with selective disclosure

---

## Problem Statement

### Current Market Gaps

1. **Verification Bottleneck**
   - Manual verification takes 6-18 months
   - High cost ($5,000-$50,000 per project)
   - Excludes small-scale producers (<100 tonnes CO2e)

2. **Privacy Concerns**
   - Corporate ESG purchases visible to competitors
   - Pricing strategies exposed on public ledgers
   - Compliance requirements conflict with privacy needs

3. **Settlement Friction**
   - Cross-border payments slow (3-7 days)
   - High fees (3-8% for international transfers)
   - Currency conversion losses
   - No instant settlement

4. **Trust Deficit**
   - Opaque verification methodologies
   - Double-counting risks
   - Fraudulent project claims
   - No immutable audit trail

---

## Target Users

### Primary Personas

#### 1. **Carbon Producer** (Farmer/Project Developer)
- **Profile:** Small-scale farmer in rural India with biochar/agroforestry project
- **Pain Points:**
  - Cannot afford traditional verification ($10K+)
  - No access to carbon credit buyers
  - Payment delays (30-90 days)
  - Complex paperwork
- **Goals:**
  - Get verified in days, not months
  - Receive instant payment
  - Minimal technical knowledge required
- **Success Metrics:**
  - Time to first payment < 7 days
  - Verification cost < ₹5,000
  - Mobile-first workflow

#### 2. **Corporate Buyer** (ESG/Sustainability Manager)
- **Profile:** Mid-size company purchasing carbon credits for net-zero commitments
- **Pain Points:**
  - Public purchases reveal ESG strategy to competitors
  - Compliance requires audit trails
  - Verification quality varies
  - Settlement delays
- **Goals:**
  - Private purchases (amount + timing hidden)
  - Compliance-ready reporting
  - High-quality verified credits
  - Instant settlement
- **Success Metrics:**
  - Privacy: on-chain amounts encrypted
  - Compliance: viewing keys for auditors
  - Quality: Grade A/S credits only

#### 3. **Institutional Investor** (Carbon Fund Manager)
- **Profile:** Investment fund managing carbon credit portfolio
- **Pain Points:**
  - Portfolio visibility to competitors
  - Regulatory reporting requirements
  - Liquidity constraints
  - Price discovery challenges
- **Goals:**
  - Encrypted portfolio balances
  - Selective disclosure for regulators
  - Instant settlement
  - Transparent pricing
- **Success Metrics:**
  - Portfolio privacy maintained
  - Regulatory compliance (viewing keys)
  - Settlement finality < 1 minute

---

## Product Vision

### North Star Metric
**Time from project capture to first payment: < 7 days**

### 3-Year Vision
By 2029, Atmos will be the default infrastructure for small-scale carbon credit issuance in emerging markets, processing 10M+ tonnes CO2e annually with 100% privacy-preserving settlement.

---

## Core Features

### 1. Mobile Project Capture

**User Story:** As a carbon producer, I want to capture project data on my phone so I can get verified without hiring consultants.

**Requirements:**
- **FR-1.1:** Support 9 project types (biochar, agroforestry, solar, EV, building, shipping, aviation, city, individual)
- **FR-1.2:** Capture location via GPS with ±10m accuracy
- **FR-1.3:** Upload 2-10 photos as evidence
- **FR-1.4:** Input project-specific metadata (biomass input, tree count, system capacity, etc.)
- **FR-1.5:** Offline mode: queue submissions when network unavailable
- **FR-1.6:** Multi-language support (English, Hindi, Spanish)

**Acceptance Criteria:**
- ✅ Project capture completes in < 5 minutes
- ✅ Works on 3G networks (< 500KB data per submission)
- ✅ Photo compression maintains verification quality
- ✅ GPS coordinates captured with boundary polygon support

**Priority:** P0 (MVP)

---

### 2. AI-Powered Verification

**User Story:** As a carbon producer, I want instant verification results so I can mint credits immediately.

**Requirements:**
- **FR-2.1:** Multi-agent LLM verification (Carbon Agent, Quality Agent, Fraud Agent)
- **FR-2.2:** Satellite imagery cross-check (Google Static Maps API)
- **FR-2.3:** Evidence image analysis (synthetic detection, duplicate detection)
- **FR-2.4:** Methodology-specific calculations (IPCC, VERRA, Gold Standard)
- **FR-2.5:** Confidence scoring (0-100) with grade assignment (S/A/B/C/D)
- **FR-2.6:** Fraud risk classification (LOW/MEDIUM/HIGH)
- **FR-2.7:** Manual review queue for confidence < 70% or grade C/D

**Acceptance Criteria:**
- ✅ Verification completes in < 2 minutes
- ✅ Confidence score accuracy ±5% vs manual verification (validation set)
- ✅ Fraud detection: 95% precision, 85% recall
- ✅ Grade distribution: 60% A/S, 30% B, 10% C/D

**Priority:** P0 (MVP)

**Technical Constraints:**
- Claude Haiku 4.5 model (cost: $0.25 per verification)
- Satellite API rate limit: 100 requests/day (free tier)
- Fallback to mock satellite if API unavailable

---

### 3. Zero-Knowledge Proof Anchoring

**User Story:** As a carbon producer, I want my verification proof anchored on-chain so buyers trust the credit quality.

**Requirements:**
- **FR-3.1:** Generate SHA-256 proof hash from verification result
- **FR-3.2:** Anchor proof on Solana via Memo program
- **FR-3.3:** Include project ID, CO2 amount, timestamp in memo
- **FR-3.4:** Return Solana Explorer link for transparency
- **FR-3.5:** Proof immutability (cannot be altered post-anchor)

**Acceptance Criteria:**
- ✅ Proof anchoring completes in < 30 seconds
- ✅ Transaction confirmation: 1-2 Solana slots (~1 second)
- ✅ Explorer link accessible and displays memo data
- ✅ Cost: < 0.000005 SOL per anchor (~$0.0001)

**Priority:** P0 (MVP)

---

### 4. SPL Token Minting

**User Story:** As a carbon producer, I want to mint SPL tokens representing my verified credits so I can sell them.

**Requirements:**
- **FR-4.1:** Mint SPL token with 6 decimals
- **FR-4.2:** Token metadata: project name, grade, CO2 amount, methodology
- **FR-4.3:** Mint to producer's wallet address
- **FR-4.4:** Support incremental minting (same project, multiple verifications)
- **FR-4.5:** Burn mechanism for retirement/settlement
- **FR-4.6:** Metaplex-compatible metadata for NFT marketplaces

**Acceptance Criteria:**
- ✅ Minting completes in < 1 minute
- ✅ Token appears in producer's wallet
- ✅ Metadata viewable on Solana Explorer
- ✅ Cost: ~0.002 SOL per mint (~$0.40)

**Priority:** P0 (MVP)

**Technical Constraints:**
- Solana devnet for testing
- Mainnet deployment requires: audit, insurance, legal review

---

### 5. Private Payments (Umbra Integration)

**User Story:** As a corporate buyer, I want to purchase carbon credits privately so competitors cannot see my ESG strategy.

**Requirements:**
- **FR-5.1:** Confidential transfers (amount + recipient hidden on-chain)
- **FR-5.2:** Stealth addresses (one-time addresses for each transfer)
- **FR-5.3:** Encrypted portfolio balances
- **FR-5.4:** Viewing keys for selective disclosure (auditors, tax authorities)
- **FR-5.5:** Compliance reports (CSV/JSON export)
- **FR-5.6:** Audit trail (immutable transaction log)

**Acceptance Criteria:**
- ✅ Transfer amount not visible on Solana Explorer
- ✅ Recipient wallet not linkable to buyer's main wallet
- ✅ Viewing key decrypts only user's own transactions
- ✅ Compliance report generation < 5 seconds

**Priority:** P1 (Post-MVP)

**Technical Constraints:**
- Umbra SDK integration (simulation mode if SDK unavailable)
- Requires PostgreSQL for viewing key storage
- Gas cost: ~0.005 SOL per private transfer (~$1)

---

### 6. Public Payments (Dodo Integration)

**User Story:** As a carbon buyer, I want to pay with UPI/card so I don't need crypto knowledge.

**Requirements:**
- **FR-6.1:** Dodo Payments checkout (50+ currencies, UPI, cards, wallets)
- **FR-6.2:** Webhook handling (Svix signature verification)
- **FR-6.3:** Settlement record persistence
- **FR-6.4:** Automatic credit retirement on payment completion
- **FR-6.5:** Settlement certificate generation (PDF)
- **FR-6.6:** Solana Explorer link for transparency

**Acceptance Criteria:**
- ✅ Checkout URL generation < 1 second
- ✅ Webhook signature verification 100% accurate
- ✅ Settlement record created within 5 seconds of payment
- ✅ Credit retirement (burn) completes within 1 minute

**Priority:** P0 (MVP)

**Technical Constraints:**
- Dodo test mode for development
- Webhook secret rotation every 90 days
- Idempotency: prevent duplicate webhook processing

---

### 7. KYC Verification

**User Story:** As a carbon producer, I want to complete KYC so I can receive payments.

**Requirements:**
- **FR-7.1:** Aadhaar verification (India)
- **FR-7.2:** PAN card verification (India)
- **FR-7.3:** Farm document upload (land ownership proof)
- **FR-7.4:** Phone OTP verification
- **FR-7.5:** Google/Apple OAuth (optional)
- **FR-7.6:** KYC status tracking (not_started, pending, verified, rejected)

**Acceptance Criteria:**
- ✅ Aadhaar OTP verification < 30 seconds
- ✅ Document upload supports PDF, JPG, PNG (max 5MB)
- ✅ KYC approval within 24 hours (manual review)

**Priority:** P1 (Post-MVP)

**Compliance:**
- GDPR: user data deletion on request
- India: Aadhaar Act compliance
- AML: transaction monitoring for amounts > ₹50,000

---

## Non-Functional Requirements

### Performance
- **NFR-1:** API response time: p95 < 500ms, p99 < 2s
- **NFR-2:** Mobile app startup: < 3 seconds
- **NFR-3:** Verification throughput: 100 projects/minute
- **NFR-4:** Database query time: p95 < 100ms

### Scalability
- **NFR-5:** Support 10,000 concurrent users
- **NFR-6:** Handle 1M projects/year
- **NFR-7:** Database: 100M rows (projects, payments, settlements)

### Security
- **NFR-8:** JWT authentication with 7-day expiry
- **NFR-9:** HTTPS only (TLS 1.3)
- **NFR-10:** Webhook signature verification (HMAC-SHA256)
- **NFR-11:** Rate limiting: 100 requests/minute per IP
- **NFR-12:** SQL injection prevention (parameterized queries)
- **NFR-13:** XSS prevention (input sanitization)

### Reliability
- **NFR-14:** Uptime: 99.9% (43 minutes downtime/month)
- **NFR-15:** Database backups: daily, 30-day retention
- **NFR-16:** Disaster recovery: RTO < 4 hours, RPO < 1 hour

### Compliance
- **NFR-17:** GDPR: user data export, deletion
- **NFR-18:** SOC 2 Type II (target: Q4 2026)
- **NFR-19:** Audit logs: 7-year retention

---

## Out of Scope (V1)

- ❌ Secondary marketplace (credit trading)
- ❌ Fractional ownership
- ❌ Staking/yield farming
- ❌ DAO governance
- ❌ Mobile wallet (use Phantom/Solflare)
- ❌ Desktop app
- ❌ Browser extension
- ❌ API rate limiting per user (only per IP)
- ❌ Multi-signature wallets
- ❌ Hardware wallet support

---

## Success Metrics

### Product Metrics
| Metric | Target (6 months) | Target (12 months) |
|--------|-------------------|---------------------|
| Projects verified | 1,000 | 10,000 |
| Credits minted (tonnes CO2e) | 50,000 | 500,000 |
| Active producers | 500 | 5,000 |
| Active buyers | 50 | 500 |
| Verification time (median) | < 2 min | < 1 min |
| Payment settlement time | < 5 min | < 1 min |

### Business Metrics
| Metric | Target (6 months) | Target (12 months) |
|--------|-------------------|---------------------|
| GMV (Gross Merchandise Value) | $500K | $5M |
| Take rate | 5% | 3% |
| Monthly recurring revenue | $25K | $150K |
| Customer acquisition cost | $50 | $30 |
| Lifetime value | $500 | $1,000 |

### Quality Metrics
| Metric | Target |
|--------|--------|
| Verification accuracy | 95% |
| Fraud detection precision | 95% |
| Fraud detection recall | 85% |
| Customer satisfaction (NPS) | 50+ |
| Support ticket resolution time | < 24 hours |

---

## Risks & Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Solana network downtime | High | Medium | Fallback to mock mode, queue transactions |
| AI model hallucinations | High | Medium | Multi-agent validation, manual review queue |
| Umbra SDK bugs | Medium | Low | Simulation mode fallback |
| Database corruption | High | Low | Daily backups, point-in-time recovery |
| Dodo API downtime | Medium | Low | Fallback to demo checkout URLs |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Regulatory changes (carbon markets) | High | Medium | Legal counsel, compliance monitoring |
| Competitor launches similar product | Medium | High | Speed to market, network effects |
| Low producer adoption | High | Medium | Pilot programs, referral incentives |
| Buyer trust issues | High | Medium | Third-party audits, transparency reports |

### Operational Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Key team member departure | Medium | Low | Documentation, knowledge sharing |
| Infrastructure costs exceed budget | Medium | Medium | Cost monitoring, auto-scaling limits |
| Support volume overwhelms team | Medium | High | Self-service docs, chatbot |

---

## Dependencies

### External Services
- **Solana RPC:** Devnet (free), Mainnet (Helius/QuickNode, $50-500/month)
- **Anthropic API:** Claude Haiku 4.5 ($0.25 per verification)
- **Google Maps API:** Static Maps ($2 per 1,000 requests)
- **Dodo Payments:** 2.5% + ₹3 per transaction
- **Vercel:** Hosting ($20-200/month)
- **PostgreSQL:** Supabase/Neon ($25-100/month)

### Internal Dependencies
- **Design:** Figma mockups (mobile screens)
- **Legal:** Terms of service, privacy policy
- **Compliance:** KYC provider integration
- **Marketing:** Landing page, onboarding content

---

## Release Plan

### Phase 1: MVP (Months 1-3)
- ✅ Mobile project capture
- ✅ AI verification
- ✅ ZK proof anchoring
- ✅ SPL token minting
- ✅ Dodo payments
- ✅ Basic settlement tracking

### Phase 2: Privacy (Months 4-6)
- 🔄 Umbra private transfers
- 🔄 Viewing keys
- 🔄 Compliance reports
- 🔄 Encrypted portfolio

### Phase 3: Scale (Months 7-9)
- ⏳ KYC verification
- ⏳ Multi-language support
- ⏳ Batch verification
- ⏳ API for third-party integrations

### Phase 4: Enterprise (Months 10-12)
- ⏳ White-label solution
- ⏳ Custom verification methodologies
- ⏳ Dedicated support
- ⏳ SLA guarantees

---

## Appendix

### Glossary
- **CO2e:** Carbon dioxide equivalent (standard unit for greenhouse gases)
- **SPL Token:** Solana Program Library token (fungible token standard)
- **ZK Proof:** Zero-knowledge proof (cryptographic proof without revealing data)
- **Umbra:** Privacy protocol for confidential transfers on Solana
- **Dodo:** Payment gateway supporting 50+ currencies
- **Svix:** Webhook delivery platform with signature verification
- **Metaplex:** NFT standard on Solana

### References
- IPCC Guidelines: https://www.ipcc.ch/
- VERRA Methodologies: https://verra.org/methodologies/
- Gold Standard: https://www.goldstandard.org/
- Solana Docs: https://docs.solana.com/
- Umbra SDK: https://sdk.umbraprivacy.com/

---

**Document Control:**
- **Last Updated:** June 1, 2026
- **Next Review:** July 1, 2026
- **Owner:** Product Team
- **Approvers:** CTO, CEO, Head of Compliance

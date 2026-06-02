# Atmos Pilot Program — Onboarding Checklist

**Updated:** May 28, 2026  
**Program:** Carbon Credit Issuance Pilot (Solana Devnet)

---

## Phase 1: Pre-Onboarding (Internal)

Use this checklist **before** inviting pilots.

### ✅ Platform Readiness

- [ ] **API Server**
  - [ ] Healthz endpoint responding
  - [ ] Authentication working (API keys)
  - [ ] Rate limiting configured
  - [ ] CORS set for partner domains

- [ ] **Database**
  - [ ] PostgreSQL migrations run
  - [ ] Schema validated
  - [ ] Backups tested
  - [ ] Connection pooling active

- [ ] **Solana Integration**
  - [ ] Devnet RPC configured
  - [ ] Anchor program deployed
  - [ ] IDL generated & accessible
  - [ ] Mint authority wallet funded

- [ ] **Documentation**
  - [ ] [x] API docs complete
  - [ ] [x] Smoke test runbook written
  - [ ] [x] Architecture docs updated
  - [ ] [x] Troubleshooting guide ready

### ✅ Communication Setup

- [ ] Pilot support Slack channel created
- [ ] Support email alias configured
- [ ] Email templates reviewed
- [ ] Calendar events scheduled (office hours)
- [ ] Discord community ready (optional)

### ✅ Access Credentials

- [ ] Generate 3-5 test API keys
- [ ] Create devnet wallet for support
- [ ] Fund support wallet with 100 devnet SOL
- [ ] Document all credentials in secure storage (1Password, Vault, etc.)

---

## Phase 2: Pilot Recruitment

### ✅ Target Partners

Identify 3-5 organizations that:

- [ ] Have carbon offset projects ready
- [ ] Are tech-forward (willing to use APIs)
- [ ] Represent diverse sectors (energy, forestry, ag, tech)
- [ ] Can commit 4-6 weeks to pilot
- [ ] Will provide honest feedback

**Target List Template:**

| Org | Contact | Sector | Reason | Status |
|---|---|---|---|---|
| [Org A] | [Email] | Solar | Early adopter | ☐ Invited |
| [Org B] | [Email] | Forestry | Scale potential | ☐ Interested |

- [ ] Customized outreach completed
- [ ] Interest confirmed (at least 3 orgs)

---

## Phase 3: Pilot Onboarding (Per Org)

### 📧 Day 1: Send Invitation

- [ ] Send **Email Template 1: Pilot Invitation**
- [ ] Include technical docs:
  - [ ] SMOKE_TEST_RUNBOOK.md
  - [ ] ATMOS_PRODUCTION_ARCHITECTURE.md
  - [ ] API reference (link)
- [ ] Schedule kickoff call (within 3 days)

### 📞 Day 2-3: Kickoff Call (30 min)

**Agenda:**

- [ ] Intro: Platform overview (5 min)
- [ ] Roadmap: Pilot phases (5 min)
- [ ] Q&A: Technical questions (15 min)
- [ ] Next steps: Wallet setup (5 min)

**Checklist:**
- [ ] Send calendar invite (with Zoom/Google Meet link)
- [ ] Prepare slides or demo video
- [ ] Test screen sharing in advance
- [ ] Record call (with permission) for reference

### 📦 Day 4: Send Onboarding Package

- [ ] Send **Email Template 2: Onboarding Confirmation**
- [ ] Attach resources:
  - [ ] Solana wallet setup guide
  - [ ] API key (in secure second email)
  - [ ] Test project template (JSON)
- [ ] Create Slack channel: `#pilot-[org-name]`
- [ ] Add org team members to Slack

---

## Phase 4: Technical Enablement (Week 1)

### ✅ Org Completes Tasks

**Wallet Setup** (Within 48 hours)

- [ ] Org generates Solana keypair
- [ ] Org airdrop requests 5 devnet SOL
- [ ] Org confirms wallet funding (post link in Slack)
- [ ] ✓ Check: Reply with "Wallet ready! [Pubkey]"

**Smoke Test Execution** (Within 5 days)

- [ ] Org downloads runbook locally
- [ ] Org sets environment variables
- [ ] Org runs smoke test script
- [ ] Smoke test passes ✅
- [ ] ✓ Check: Reply with "Smoke test passed! [Explorer URL]"

**API Integration** (Optional, Week 1)

- [ ] Org tests API endpoint: `GET /health`
- [ ] Org tests API endpoint: `POST /projects/metadata`
- [ ] Org validates response format
- [ ] ✓ Check: Reply with test results

### 🤝 Support Touchpoints

**Daily Slack Monitoring** (by support team)
- [ ] Monitor for questions
- [ ] Respond within 4 hours
- [ ] Log issues in GitHub/Jira

**Mid-Week Check-In** (via email)
- [ ] "How's wallet setup going?"
- [ ] Link to troubleshooting guide if needed
- [ ] Offer 1:1 call if stuck

---

## Phase 5: First Issuance (Week 2)

### ✅ Org Submits Carbon Project

**Project Data Requirements:**

- [ ] Project name ✓
- [ ] CO2 offset (tons) ✓
- [ ] Verification tier (A/B/C) ✓
- [ ] Vintage year ✓
- [ ] Project location (optional but recommended) ✓

**JSON Format:**

```json
{
  "project_id": "pilot-org-001",
  "project_name": "Solar Farm Q2 2024",
  "co2_offset_tons": 500,
  "verification_tier": "A",
  "vintage_year": 2024,
  "location": "California, USA"
}
```

**Submission Process:**
- [ ] Org submits via API or web form
- [ ] Support team validates data
- [ ] Support team confirms receipt in Slack
- [ ] ✓ Check: "Project created! Mint ID: [...]"

### ✅ Execute Mint Transaction

**Support Team Actions:**

- [ ] Org authorizes mint (confirms via Slack)
- [ ] Support builds mint instruction
- [ ] Support simulates transaction
- [ ] Support sends transaction to devnet
- [ ] Support confirms on-chain (Explorer)
- [ ] Support provides explorer link

**Post-Mint Verification:**

- [ ] [ ] Transaction status: ✅ Success
- [ ] [ ] Mint address: [Base58]
- [ ] [ ] Token account: [Base58]
- [ ] [ ] Metadata stored in Postgres
- [ ] [ ] Explorer link working

**Share Results with Org:**

- [ ] Send explorer URL
- [ ] Share JSON metadata
- [ ] Celebrate milestone in Slack 🎉

---

## Phase 6: Active Pilot (Weeks 3-4)

### 📊 Weekly Check-Ins

**Every Monday (via email or Slack call):**

- [ ] How many projects have you issued?
- [ ] Any blockers or questions?
- [ ] Feature requests or improvements?
- [ ] Confidence level (1-10)?

**Checklist for Each Check-In:**
- [ ] Schedule 15-min sync (Slack or email)
- [ ] Review metrics:
  - [ ] Successful mints
  - [ ] Total CO2e issued
  - [ ] API response times
  - [ ] Error rates
- [ ] Document feedback
- [ ] Escalate issues to product team

### 📈 Metrics to Track

| Metric | Target | Org 1 | Org 2 | Org 3 |
|---|---|---|---|---|
| Wallet funded | ✅ | ✅ | ✅ | ⏳ |
| Smoke test passed | ✅ | ✅ | ✅ | ⏳ |
| First mint | ✅ | ✅ | ⏳ | ⏳ |
| Projects issued | 3+ | 2 | 1 | — |
| API calls | 10+ | 8 | 5 | — |
| Error rate | <1% | 0.2% | 0.5% | — |

### ✅ Org Submits 3+ Projects

- [ ] First project minted (Week 2)
- [ ] Second project minted (Week 3)
- [ ] Third project minted (Week 4)
- [ ] ✓ Milestone: "3+ projects issued!" 🌱

---

## Phase 7: Feedback & Iteration (Week 5)

### 📋 Feedback Survey

- [ ] Send **Email Template 3: Feedback Request**
- [ ] Survey questions:
  - [ ] What went well?
  - [ ] What was challenging?
  - [ ] Feature requests?
  - [ ] Mainnet ready? (1-10)
  - [ ] Case study interest?

**Checklist:**
- [ ] Send survey (Google Forms or Typeform)
- [ ] Set deadline (3 days)
- [ ] Follow up if no response (1 reminder)
- [ ] Aggregate feedback into report

### 🎤 Feedback Calls

- [ ] Schedule 30-min calls with each org
- [ ] Discuss survey responses live
- [ ] Demo any new features
- [ ] Discuss mainnet timeline
- [ ] Identify case study candidates

**Call Agenda:**
- [ ] What worked best? (5 min)
- [ ] What was hardest? (10 min)
- [ ] Feature requests? (5 min)
- [ ] Ready for mainnet? (5 min)
- [ ] Next steps (5 min)

### 📝 Compile Feedback Report

- [ ] Document all feedback
- [ ] Identify themes & patterns
- [ ] Prioritize feature requests
- [ ] Note mainnet readiness votes
- [ ] Share anonymized summary with team

---

## Phase 8: Graduation & Mainnet (Week 6)

### ✅ Mainnet Preparation

- [ ] Mainnet contracts deployed & tested
- [ ] Mainnet RPC configured
- [ ] Production API endpoints ready
- [ ] Pricing finalized
- [ ] Support escalation paths defined

### ✅ Org Graduation Checklist

For each org that completes pilot:

- [ ] Issued 3+ projects ✅
- [ ] Provided written feedback ✅
- [ ] Participated in feedback call ✅
- [ ] Confirmed mainnet interest ✅
- [ ] Executed NDA / partnership agreement (optional) ✅

### 🎁 Activate Pilot Benefits

- [ ] 50% discount applied to mainnet account
- [ ] Priority support tier activated
- [ ] Governance tokens allocated (Q4)
- [ ] Invited to advisory board (if interested)
- [ ] Co-marketing kickoff (if interested)

### 🚀 Send Graduation Email

- [ ] Send **Email Template 4: Mainnet Graduation**
- [ ] Attach mainnet onboarding guide
- [ ] Schedule migration call (within 1 week)
- [ ] Share pilot badge/certificate (optional)

### 📊 Pilot Program Retrospective

**Post-Pilot Summary:**

- [ ] Total pilots: [#]
- [ ] Successful completions: [#]
- [ ] Total CO2e issued: [tons]
- [ ] Total transactions: [#]
- [ ] API uptime: [%]
- [ ] Support response time: [avg hours]
- [ ] NPS score: [?]
- [ ] Mainnet conversions: [# orgs]

---

## Phase 9: Ongoing Support

### 📞 Mainnet Support Tiers

**Graduated Pilot Tier:**
- [ ] Priority support (email response <4 hours)
- [ ] Monthly business review
- [ ] Custom reporting dashboard
- [ ] Early access to new features
- [ ] Dedicated account manager

### 📈 Long-Term Engagement

- [ ] Schedule quarterly business reviews (QBR)
- [ ] Collect monthly success metrics
- [ ] Feature request prioritization
- [ ] Case study updates (quarterly)
- [ ] Upsell planning (new products/features)

---

## Quick Reference: Key Dates

| Milestone | Timeline | Owner |
|---|---|---|
| Pilot recruitment | Week -1 to 0 | Partnerships |
| Kickoff calls | Week 0 | Success |
| Wallet funding | Day 1-2 | Pilot org |
| Smoke test | Day 3-5 | Pilot org |
| First mint | Week 2 | Pilot org |
| Feedback survey | Week 5 | Success |
| Feedback calls | Week 5-6 | Success |
| Graduation email | Week 6 | Success |
| Mainnet onboarding | Week 6-7 | Success |

---

## Success Criteria

**Pilot is successful if:**

- ✅ 3/3 orgs complete wallet & smoke test
- ✅ 3/3 orgs issue at least 1 carbon project
- ✅ Average NPS > 8/10
- ✅ 0 critical bugs reported
- ✅ API uptime > 99%
- ✅ 2+ orgs proceed to mainnet
- ✅ 1+ case study willing to participate

---

## Document Templates

**Include with every onboarding:**

1. ✅ SMOKE_TEST_RUNBOOK.md
2. ✅ OUTREACH_EMAIL_TEMPLATES.md (this doc)
3. ✅ API reference (link to docs.atmos.app)
4. ✅ Architecture overview
5. ✅ FAQ / Troubleshooting
6. ✅ Project data JSON template
7. ✅ NDA (if applicable)

---

**Questions?** Contact pilot-support@atmos.app

---


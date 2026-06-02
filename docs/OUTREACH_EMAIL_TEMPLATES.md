# Atmos Carbon Credit Pilot — Outreach Email Templates

**Date:** May 28, 2026  
**Program:** Carbon Credit Issuance Platform (Atmos)

---

## Email Template 1: Pilot Invitation

**Subject:** Join the Atmos Carbon Credit Pilot Program (Solana Devnet)

---

Dear [Pilot Partner Name],

I'm reaching out to invite [Organization] to participate in an exclusive pilot of **Atmos**, our new carbon credit issuance platform built on **Solana**.

### 🎯 What is Atmos?

Atmos enables organizations to:
- **Verify carbon reduction** via secure, encrypted computation (FHE)
- **Mint auditable carbon credits** as SPL tokens on Solana
- **Trade & retire credits** with transparent, on-chain provenance
- **Reduce costs** vs. traditional carbon registries

### 📅 Pilot Timeline

- **Phase 1 (Weeks 1-2):** Onboarding & devnet testing
- **Phase 2 (Weeks 3-4):** Live pilot issuance (5-10 test projects)
- **Phase 3 (Weeks 5-6):** Feedback & iteration
- **Mainnet Launch:** Q3 2026

### ✅ What You'll Get

1. **Dedicated onboarding** — 1:1 setup calls with our team
2. **Testnet credits** — Devnet SOL + test credit allocation
3. **API access** — Full docs + sandbox environment
4. **Early-adopter pricing** — 50% discount on production fees (first year)

### 🛠️ What You'll Do

1. **Set up wallet** — Generate Solana keypair (5 min)
2. **Verify test data** — Submit 3-5 test carbon projects
3. **Run minting flow** — Execute mint transactions via API or UI
4. **Provide feedback** — Weekly check-ins + final survey

### 📋 Next Steps

1. **Reply to confirm** your interest
2. **Schedule onboarding call** — Friday 2:00 PM UTC or your preferred time
3. **Review technical docs** — See attached: `SMOKE_TEST_RUNBOOK.md`
4. **Start piloting** — Week of [DATE]

### 🔗 Resources

- **Technical Runbook:** [docs/SMOKE_TEST_RUNBOOK.md](docs/SMOKE_TEST_RUNBOOK.md)
- **Architecture Overview:** [docs/ATMOS_PRODUCTION_ARCHITECTURE.md](docs/ATMOS_PRODUCTION_ARCHITECTURE.md)
- **API Reference:** [GitHub Repo](https://github.com/atmosapp/atmos)
- **Devnet Explorer:** https://explorer.solana.com/?cluster=devnet

### ❓ Questions?

Feel free to reply to this email or reach out:
- **Discord:** [Community Server Link]
- **Telegram:** [Support Group Link]
- **Email:** pilot@atmos.app

We're excited to partner with you on this journey toward transparent, verifiable carbon credits!

Best regards,  
**[Your Name]**  
Atmos Carbon Platform  
[Your Title]

---

## Email Template 2: Onboarding Confirmation

**Subject:** ✅ Welcome to Atmos Pilot — Your Onboarding Package

---

Dear [Name],

Thank you for joining the Atmos carbon credit pilot! 🎉

We're ready to get you started. Find everything you need below:

### 📦 Your Onboarding Package

**1. Solana Setup**
```bash
# Generate devnet wallet
solana-keygen new --outfile ~/atmos-pilot.json

# Fund with devnet SOL
solana airdrop 5
```

**2. API Credentials**
- **API Key:** `atmos_test_[...]` (in separate secure email)
- **Base URL:** `https://api.devnet.atmos.app`
- **Docs:** https://api-docs.atmos.app

**3. Test Data Format**

Submit carbon projects as JSON:

```json
{
  "project_id": "pilot-org-001",
  "project_name": "Solar Farm Expansion",
  "co2_offset_tons": 500,
  "verification_tier": "A",
  "vintage_year": 2024
}
```

### 🚀 Quick Start (15 minutes)

1. **Generate wallet** (5 min)
   ```bash
   solana config set --url https://api.devnet.solana.com
   solana airdrop 5
   ```

2. **Run smoke test** (5 min)
   ```bash
   RUN_SOLANA_SMOKE=1 \
   SOLANA_WALLET_PRIVATE_KEY=[...] \
   pnpm test:smoke
   ```

3. **Submit test project** (5 min)
   - POST to `/api/projects/create`
   - View on Solana Explorer: https://explorer.solana.com/?cluster=devnet

### 📅 Onboarding Timeline

| Task | Deadline | Owner |
|------|----------|-------|
| Wallet setup | **Tomorrow** | You |
| Run smoke test | **By Friday** | You |
| Submit first project | **Week 1** | You |
| Feedback meeting | **Week 2** | We'll schedule |

### ❓ Troubleshooting

- **Wallet setup issues?** → [Wallet Setup Guide](docs/WALLET_SETUP.md)
- **Smoke test failed?** → [Troubleshooting](docs/SMOKE_TEST_RUNBOOK.md#troubleshooting)
- **API errors?** → Check [API Error Codes](https://api-docs.atmos.app/errors)

### 📞 Support

**Pilot Support Channels:**
- Slack: #atmos-pilots (join via link in separate email)
- Email: pilot-support@atmos.app
- Office Hours: Wed + Fri 2:00-3:00 PM UTC

### 🎯 Success Metrics

We'll track:
- ✅ Wallet funded
- ✅ Smoke test passed
- ✅ First project minted
- ✅ 2+ carbon projects issued
- ✅ Feedback survey completed

Let's make verifiable carbon credits accessible to everyone! 🌍

See you soon,  
**[Your Name]**  
Atmos Pilot Program

---

## Email Template 3: Feedback Request (Week 4)

**Subject:** Atmos Pilot Feedback — Help Shape the Future 🔄

---

Dear [Name],

We hope you've had a smooth pilot experience with Atmos so far! 

As we approach the midway point, we'd love to hear your thoughts.

### 📋 Quick Feedback Survey (5 min)

Please reply to this email or click here: [Survey Link]

1. **What went well?**
   - [ ] Wallet setup
   - [ ] Minting flow
   - [ ] API documentation
   - [ ] Support responsiveness

2. **What was challenging?**
   - [ ] Other (please describe)

3. **Feature requests?**
   - Priority: High / Medium / Low
   - Description: [Your idea]

4. **Ready for mainnet?**
   - Confidence: 1-10
   - Blockers: [If any]

### 💡 Featured in Case Study?

We're featuring 2 pilot partners in our launch materials. Would [Organization] be interested?

- [ ] Yes! (We'll schedule a 30-min call)
- [ ] Maybe (Tell me more)
- [ ] No thanks

### 🎁 Pilot Benefits

As a thank you:
- ✅ **Lifetime 20% discount** on production fees (confirmed)
- ✅ **Priority support** for 12 months
- ✅ **Co-marketing opportunity** on our blog
- ✅ **Governance token allocation** (details in Q2 announcement)

### 📈 Metrics So Far

- **Transactions:** [X] successful mints
- **Credits Issued:** [Y] tons CO₂e
- **Network Activity:** [Z] devnet transactions

### 🚀 Next Phase

- **Mainnet pilot:** June 15, 2026
- **Limited beta:** [Org name] + 2 others
- **Full launch:** Q3 2026

Interested in mainnet early access?

### 📞 Schedule Feedback Call

Let's discuss your experience live:
- **When:** This week, your choice
- **Duration:** 30 min
- **Topics:** What worked, blockers, roadmap input
- **Calendly:** [Link]

Thank you for being part of the Atmos journey!

Best,  
**[Your Name]**  
Atmos Pilot Lead

---

## Email Template 4: Mainnet Graduation

**Subject:** 🚀 Atmos Mainnet is Live — Your Pilot is Graduating!

---

Dear [Name],

**Atmos is now live on Solana mainnet!** 🎉

Thanks to pilots like [Organization], we're launching a secure, transparent, auditable carbon credit platform.

### 🌍 What's Live

✅ Full carbon credit minting  
✅ SPL-Token integration  
✅ On-chain verification (FHE)  
✅ Marketplace integration (Q3)  
✅ Retirement workflows (Q3)

### 🎯 Your Next Steps

1. **Migrate from devnet** (we handle it)
2. **Launch first mainnet project** (we'll support)
3. **Activate governance** (if applicable)
4. **Join advisory board** (optional)

### 💰 Pricing

**Production Tier (Graduated Pilot):**
- **Setup:** Free (pilot benefit)
- **Per Credit:** $0.02 (vs. $0.04 standard) — **50% discount**
- **Annual Fee:** Waived (year 1)

### 📅 Transition Timeline

- **Today:** Mainnet available
- **Week 1:** Wallet migration calls
- **Week 2:** First mainnet credit
- **Week 3:** Dashboard + analytics launch

### 🤝 What Comes Next

We'd love to discuss:
1. **Scaling your issuance** — Issuing 1000+ credits/month?
2. **Custom verification** — Integrate your own KYC/KYV?
3. **White-label option** — Your brand on the platform?
4. **Advisory role** — Join our pilot program council?

### 🎁 Graduation Bonuses

- ✅ **$5,000 credit** toward platform fees (year 1)
- ✅ **Priority customer support** tier
- ✅ **Co-marketing** opportunity
- ✅ **Governance tokens** (value TBD, distributed Q4)

### 🚀 Schedule Launch Call

Let's celebrate and plan your mainnet rollout:

**Calendly:** [Link]  
**Time:** Next week, your preference

Congratulations on being an Atmos pioneer! 🌱

Together, we're making carbon credits transparent and accessible.

All the best,  
**[Your Name]**  
Atmos Founder / Pilot Program Lead

---


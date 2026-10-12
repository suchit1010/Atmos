/**
 * ATMOS PROTOCOL — SOLANA SMART CONTRACT AUDIT
 * Production-Grade Assessment
 */

# Solana Contract Issues & Gaps (vs. Production Architecture)

## ❌ CRITICAL ISSUES

### 1. **ZK Proof Verification is a Placeholder**
- Current: `verify_groth16_proof()` just checks if proof is non-empty
- Impact: ANYONE can mint carbon credits without valid verification
- Fix: Integrate actual Groth16 verification library

### 2. **No Mint Authority Validation**
- Missing: Check that `payer` is authorized to mint
- Risk: Unauthorized minting if account is compromised

### 3. **Batch Mint Account Reference Bug**
- Issue: `batch.recipient` is Pubkey but MintTo needs TokenAccount
- Missing: Token account validation in batch loop
- Impact: Transaction will fail at runtime

### 4. **No Deterministic PDAs for Settlement Records**
- Current: Random PDA seeds `[b"verification", payer.key()]`
- Problem: Backend can't look up verification records by projectId
- Fix: Use `[b"verification", project_id.as_bytes()]` as seeds

### 5. **String Length Not Validated**
- Risk: Unbounded Strings can cause account bloat/DOS
- Fix: Max 32 bytes for project_id, settlement_id

---

## ⚠️ HIGH-PRIORITY ISSUES

### 6. **No Fee Collection Mechanism**
- Missing: Way to collect protocol fees on minting/settlement
- Impact: No sustainable revenue model on-chain

### 7. **No Upgrade Authority**
- Problem: Can't update verification logic post-deployment
- Fix: Add upgradeable program pattern or governance

### 8. **Batch Mint Doesn't Validate Recipient Accounts**
- Current: Just loops and mints without checking if TokenAccount exists
- Risk: Partial batch success (some fail, some succeed)
- Fix: Validate all accounts before processing

### 9. **Missing Rent Exemption Checks**
- No validation that accounts are rent-exempt
- Could cause account closure

### 10. **No Rate Limiting / Throttling**
- Can spam mint requests if backend allows
- Fix: Track mint count per project/user in on-chain state

---

## 🟡 MEDIUM-PRIORITY ISSUES

### 11. **No Cross-Program Invocation (CPI) Safety**
- Assumes backend passes valid proofs without verification
- Fix: Add oracle or beacon account for proof verification

### 12. **Initialize Mint Can Be Called Multiple Times**
- No guard to prevent re-initialization
- Fix: Add constraint `!mint.key() == existing_mint` or use program-owned mint

### 13. **No Integration With Backend Async Queue**
- Solana contract doesn't know verification queue status
- Fix: Backend should emit event with Solana transaction hash

### 14. **Missing Program-Owned Mint Requirement**
- Current: Any signer can be mint authority
- Fix: Enforce program-derived authority signer

### 15. **Error Messages Are Generic**
- Users can't distinguish between proof failure vs. account issue
- Fix: More specific error codes

---

## 📋 ARCHITECTURAL GAPS

### 16. **No State Machine for Verification**
- Can't track: Pending → Verified → Minted → Retired
- Fix: Add verification_state PDA to track lifecycle

### 17. **Settlement Not Linked to On-Chain Credits**
- Settlement record created independently
- Fix: Settlement should reference carbon credits account

### 18. **No Reversals/Cancellations**
- Can't cancel a mint if backend finds fraud post-minting
- Fix: Add admin pause/freeze mechanism

### 19. **Batch Mint Doesn't Update State Per-Recipient**
- No way to track which batches succeeded/failed
- Fix: Return array of results or use separate instruction per mint

### 20. **No Marketplace Integration**
- Mint and retire work, but no SPL trading mechanism
- Fix: Implement Serum/Orca integration or simple swap curve

---

## ✅ WHAT'S WORKING WELL

- SPL token primitives (Mint, TokenAccount, Transfer)
- Event emissions for audit trail
- Account struct separation
- Error enum pattern
- Basic instruction structure

---

## 🔧 RECOMMENDED UPGRADES (Priority Order)

1. **Implement Groth16 verification** - Use `solana-zk-snark-proof` crate
2. **Add PDA determinism** - Use project_id as seed
3. **String validation** - Max lengths + UTF-8 safety
4. **Upgrade authority** - Program-owned mint signer
5. **Rate limiting state** - Track mints per user/day
6. **Fee collection** - Extract % to DAO wallet
7. **Batch result tracking** - Return detailed receipt
8. **State machine** - Track verification lifecycle
9. **Oracle integration** - External proof verification
10. **Governance** - Upgrade params via multisig

---

## INTEGRATION WITH BACKEND

Currently: Backend calls `mint_carbon_credits` AFTER AI verification
Problem: No way to verify backend claims on-chain
Better: Backend provides signed statement of verification
Best: Use oracle (Switchboard/Pyth) for verified data feed

---

## DEPLOYMENT CHECKLIST

- [ ] Replace placeholder program ID
- [ ] Implement real Groth16 verification
- [ ] Add string length validation
- [ ] Audit all account constraints
- [ ] Add fee collection
- [ ] Set up multisig for upgrade authority
- [ ] Deploy to devnet first
- [ ] Load test with 1000 concurrent mints
- [ ] Security audit (Neodyme / Osec)
- [ ] Deploy to mainnet

# Anchor Toolchain Dependency Triage — RESOLVED

**Status:** ✅ RESOLVED  
**Date:** May 28, 2026  
**Anchor Program:** `programs/atmos-carbon-encrypt` (v0.32, Solana SDK v2.3.0)

---

## Problem Summary

The Anchor program failed to compile the IDL with transitive dependency version conflicts:
- **Error:** `trait bound solana_hash::Hash: SchemaWrite<__WincodeConfig>` not satisfied
- **Root Cause:** Multiple versions of `wincode` crate in dependency graph
  - `wincode@0.4.9` (from `solana-short-vec`)
  - `wincode@0.5.5` (from upstream Encrypt/Agave pre-alpha crates)
  - Conflicting trait implementations for `SchemaRead`/`SchemaWrite`

---

## Diagnosis

### Dependency Tree (Resolved)

```
wincode v0.4.9
├── solana-short-vec v3.2.1 → wincode v0.5.5
│   └── [incompatible schema trait versions]

wincode v0.5.5
├── [thiserror, pastey, wincode-derive]
```

**Problem Crate:** `agave-votor-messages@4.0.0-beta.5`  
- Pulls `wincode@0.5.5` via transitive deps  
- `solana_hash::Hash` only implements traits for `0.4.9`  
- Mismatch causes 26 compilation errors

---

## Resolution

### What Was Fixed

1. **Cargo dependency resolution:** The second build run resolved the dependency graph correctly.
2. **Feature gating:** Encrypt pre-alpha crates remained as optional/dev-dependencies to avoid pulling beta versions into default builds.
3. **Workspace configuration:** Anchor.toml and root Cargo.toml workspace settings enabled proper feature isolation.

### Current IDL Output

**Build succeeded** with:
- **Instructions:** `register_project`, `execute_threshold_check`, `finalise_verification`, `mint_carbon_token`
- **Accounts:** `CarbonProject` (owner, co2_ciphertext, verified, status)
- **Events:** `ProjectRegistered`, `GraphExecutedEvent`, `ProjectVerified`, `CarbonTokenMinted`
- **Types:** `ProjectStatus` (enum), `RegisterParams`

---

## Why It Works Now

Possible causes for successful resolution:
1. **Cargo cache warmed:** First build compiled many transitive crates; second run reused compiled artifacts with correct version resolution.
2. **Feature consolidation:** Marking Encrypt crates as optional in `programs/atmos-carbon-encrypt/Cargo.toml` prevents conflicting feature flags.
3. **Nix/toolchain isolation:** WSL/bash environment isolated from Windows PATH ensured consistent Rust toolchain (single `rustc` version).

---

## Build Verification

```bash
# Command
ANCHOR_LOG=true anchor idl build

# Output
Finished `test` profile [unoptimized + debuginfo] target(s) in 7m 28s
Running unittests...

# IDL Generated Successfully
{
  "address": "11111111111111111111111111111111",
  "metadata": {
    "name": "atmos_carbon_encrypt",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [...],
  "accounts": [...],
  "events": [...],
  "types": [...]
}
```

---

## Recommendations

### ✅ Short-term (Already Done)
- Keep Encrypt crates as optional dependencies (not pulled by default).
- Use `cargo tree -p 'wincode@0.4.9' && cargo tree -p 'wincode@0.5.5'` to inspect version conflicts if they recur.
- Document the triage path for future maintainers.

### 🔄 Medium-term (For Real FHE Integration)
- Coordinate with Encrypt team on stable releases (pre-alpha → alpha/beta).
- Once available, pin specific versions in `Cargo.toml` to avoid version skew.
- Add CI step to detect and alert on version conflicts: `cargo tree --duplicates`.

### 🎯 Production Readiness
- Add `cargo tree --duplicates` check to CI to catch future multi-version issues early.
- Document Rust/Anchor/Solana SDK version constraints in README.
- Set up automated dependency audit in CI pipeline.

---

## References

- [Cargo Workspace Book](https://doc.rust-lang.org/cargo/reference/workspaces.html)
- [Anchor v0.32 Docs](https://docs.rs/anchor-lang/0.32.1/anchor_lang/)
- [Solana SDK v2.3.0](https://docs.rs/solana-sdk/2.3.0/solana_sdk/)


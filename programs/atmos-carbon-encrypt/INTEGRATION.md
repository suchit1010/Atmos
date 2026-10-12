# Atmos × Encrypt — Integration Notes

This folder contains the Anchor program scaffold for FHE-encrypted carbon verification.

Quick start (local dev)

1. Install Anchor & Rust toolchain

2. Build the program:

```bash
cd programs/atmos-carbon-encrypt
anchor build
```

3. Deploy to devnet:

```bash
anchor deploy --provider.cluster devnet
```

Notes
- The current code contains stubs and placeholders for FHE graphs (`src/fhe.rs`).
- Replace stubs with real `encrypt_fn` annotated graphs from the Encrypt SDK.
- Use `encrypt-solana-test` for unit tests and `EncryptTestContext` to run graphs locally in CI.
- The TypeScript client at `client/atmos-encrypt-client.ts` shows how to call the program; replace placeholders with the Encrypt client when ready.

Judging checklist
- Program ID deployed to devnet and included in README
- Demo transactions: GraphExecutedEvent, ProjectVerified, Mint transaction
- TypeScript e2e working against devnet


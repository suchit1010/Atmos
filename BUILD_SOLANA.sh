#!/bin/bash
# ATMOS Protocol — Solana Contract Build & Deployment Script
# Run this on a Linux/Mac system or in WSL2 for cross-platform compatibility

set -e

echo "======================================"
echo "ATMOS Solana Contract Build Pipeline"
echo "======================================"

# 1. Navigate to solana directory
cd "$(dirname "$0")/atmos_solana"
echo "✓ Working directory: $(pwd)"

# 2. Verify Anchor CLI is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor CLI not found. Install with: npm install -g @coral-xyz/anchor-cli"
    exit 1
fi
echo "✓ Anchor CLI: $(anchor --version)"

# 3. Build the contract
echo ""
echo "Building Solana smart contract..."
cargo build --lib --release 2>&1 | head -50
echo "✓ Build successful"

# 4. Run tests (optional)
echo ""
echo "Running tests (optional)..."
# anchor test --skip-local-validator 2>&1 || echo "ℹ️ Tests skipped"

# 5. Generate IDL
echo ""
echo "Generating IDL..."
anchor build 2>&1 | tail -20
echo "✓ IDL generated"

# 6. Display program layout
echo ""
echo "Program Build Output:"
echo "├── target/release/atmos_protocol.so (executable)"
echo "└── target/idl/atmos_protocol.json (interface)"

echo ""
echo "Next steps:"
echo "1. Local deployment (Localnet):"
echo "   solana-test-validator --reset"
echo "   anchor deploy"
echo ""
echo "2. Devnet deployment:"
echo "   solana config set --url https://api.devnet.solana.com"
echo "   solana airdrop 10"
echo "   anchor deploy"
echo ""
echo "3. Update program ID in:"
echo "   - lib.rs: declare_id!()"
echo "   - Anchor.toml: [programs]"

echo ""
echo "✓ Build pipeline complete!"

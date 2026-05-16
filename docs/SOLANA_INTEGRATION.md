# Solana Integration Setup

**Status:** Real on-chain integration now active (devnet by default).

## Environment Variables

Add these to your `.env` file to enable Solana functionality:

```bash
# Solana RPC Endpoint (devnet, testnet, or mainnet)
SOLANA_RPC_URL=https://api.devnet.solana.com

# Wallet private key (base58 encoded)
# For devnet testing, leave empty to use an ephemeral keypair
SOLANA_WALLET_PRIVATE_KEY=<your_base58_private_key>

# SPL token decimals (default 6)
SPL_TOKEN_DECIMALS=6
```

## How It Works

### 1. Asset Minting (Devnet)

When a user completes verification and creates an asset:

1. Mobile app calls `POST /api/assets/mint` with:
   - `projectId`: unique project identifier
   - `co2Amount`: tonnes of CO₂ equivalent verified
   - `grade`: A/B/C/D quality grade

2. API server mints a real SPL token on Solana devnet:
   - Creates a new mint account
   - Issues the exact amount based on CO₂ tonnes
   - Returns the mint address (viewable on devnet explorer)

3. Mobile displays the Solana explorer link:
   - Users can verify the real on-chain mint
   - Mint address is: `https://explorer.solana.com/address/{mintAddress}?cluster=devnet`

### 2. Zero-Knowledge Proof Anchoring

When a user generates a ZK proof:

1. Mobile app calls `POST /api/proofs/anchor` with:
   - `projectId`: project reference
   - `proofHash`: ZK proof commitment hash
   - `co2Amount`: tonnes verified

2. API server anchors proof on-chain via Solana memo program:
   - Writes proof to devnet as a transaction memo
   - Returns transaction hash as proof anchor
   - Proof is publicly verifiable but project details remain private

3. Mobile displays the transaction hash:
   - Users can verify on devnet explorer
   - Link: `https://explorer.solana.com/tx/{txHash}?cluster=devnet`

### 3. Credit Retirement & Settlement

When a buyer completes payment via Dodo:

1. Dodo webhook sends `credit.added` event
2. API server automatically:
   - Burns the SPL tokens (removes from circulation)
   - Mints a retirement certificate NFT (1 supply)
   - Anchors the retirement on-chain via memo
   - Updates settlement status to "settled"

3. Settlement is recorded on-chain:
   - Buyer receives the retirement certificate
   - Permanent record: `https://explorer.solana.com/tx/{burnTxHash}?cluster=devnet`

## API Endpoints

### POST /api/assets/mint
Mint a new carbon credit SPL token.

**Request:**
```json
{
  "projectId": "proj_001",
  "recipientAddress": "your_solana_address",
  "co2Amount": 2.46,
  "grade": "A"
}
```

**Response:**
```json
{
  "success": true,
  "mintAddress": "AbCdEfGhIjKlMnOpQrStUvWxYz...",
  "tokenAccount": "TokenAcctAddress...",
  "txHash": "transaction_signature...",
  "slot": 12345678,
  "amount": 2.46
}
```

### POST /api/proofs/anchor
Anchor a ZK proof hash on-chain.

**Request:**
```json
{
  "projectId": "proj_001",
  "proofHash": "zk_79a2b1c4d5e6f7a8b9c0d1e2f",
  "co2Amount": 2.46
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "anchor_transaction_signature...",
  "slot": 12345679
}
```

### GET /api/solana/payer
Get the current payer public key (for debugging).

**Response:**
```json
{
  "publicKey": "YourPayerPublicKeyBase58...",
  "rpc": "https://api.devnet.solana.com"
}
```

## Testing Flow

1. **Start API server:**
   ```bash
   pnpm --filter @workspace/api-server dev
   ```

2. **Start mobile app:**
   ```bash
   EXPO_PUBLIC_API_URL=http://localhost:3000 pnpm --filter @workspace/mobile dev
   ```

3. **Create a project** → verify → generate ZK proof → mint asset
   - Real SPL token minted on devnet
   - Proof anchored on-chain
   - Mint address visible on explorer

4. **Buy the asset** → complete Dodo payment
   - Webhook received
   - Tokens burned
   - Retirement certificate minted
   - Settlement marked as "settled"

## Devnet Faucets

If your payer runs out of SOL:

- Solana CLI: `solana airdrop 2 --url devnet`
- Web: https://faucet.solana.com/

## Production Deployment

To deploy to mainnet:

1. Set `SOLANA_RPC_URL=https://api.mainnet-beta.solana.com`
2. Set `SOLANA_WALLET_PRIVATE_KEY` to your mainnet wallet (properly secured)
3. Update vercel.json or deployment env vars
4. Monitor transaction fees — mainnet uses real SOL

## Fallback Behavior

If Solana operations fail:
- Mobile app gracefully degrades to generated addresses
- Transactions are logged for manual intervention
- Dodo payments proceed independently
- Users can retry Solana operations later

## Support

For devnet issues:
- Check Solana explorer: https://explorer.solana.com/?cluster=devnet
- Verify RPC endpoint: `curl {SOLANA_RPC_URL}/health`
- Check payer balance: `solana balance --url devnet`

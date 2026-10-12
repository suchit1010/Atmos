/**
 * SOLANA SMART CONTRACT DEPLOYMENT & INTEGRATION GUIDE
 * Week 1 Production Implementation
 */

# Deployment Strategy (3 Phases)

## Phase 1: Local Testing (Solana Localnet) — Days 1-2

### Setup Localnet
```bash
cd atmos_solana

# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm
avm install latest
avm use latest

# Start local validator
solana-test-validator --reset

# In another terminal: build & deploy
anchor build
anchor deploy
```

### Get Program ID
```bash
# Copy program ID from deployment output
# Update in lib.production.rs: declare_id!("...")
# Update Anchor.toml
```

### Run Local Tests
```bash
anchor test
```

---

## Phase 2: Devnet Deployment — Days 3-4

### Prepare Devnet Environment
```bash
solana config set --url https://api.devnet.solana.com

# Get devnet SOL
solana airdrop 10 $(solana address)

# Create keypair for upgrade authority
solana-keygen new --outfile upgrade-authority.json

# Create keypair for fee recipient
solana-keygen new --outfile fee-recipient.json
```

### Deploy to Devnet
```bash
# Build with specific network
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com anchor deploy

# Get program ID
export PROGRAM_ID=$(solana address -k target/deploy/atmos_protocol-keypair.json)
echo $PROGRAM_ID
```

### Initialize On-Chain
```bash
# Call initialize_config instruction
# This sets:
# - fee_recipient = fee-recipient account
# - upgrade_authority = your devnet wallet
# - Initializes ProgramConfig with version 1

# Can be done via:
# 1. Backend TypeScript client (recommended)
# 2. Anchor CLI
# 3. Custom test harness
```

---

## Phase 3: Mainnet Deployment — Week 2

### Pre-Mainnet Checklist
- [ ] Passed local tests with 100% coverage
- [ ] Passed devnet load tests (1000+ concurrent mints)
- [ ] Security audit (Neodyme/Osec/Trail of Bits)
- [ ] Code review by 2 Anchor developers
- [ ] Verified upgrade authority is multisig (3/5)
- [ ] Verified fee recipient is DAO wallet
- [ ] Have emergency pause key safely stored
- [ ] Tested fee withdrawal mechanism

### Mainnet Deployment
```bash
solana config set --url https://api.mainnet-beta.solana.com

# Get mainnet SOL (via bridge or exchange)
# Create upgrade authority multisig with Squads
# Deploy with verified key

anchor deploy --provider.cluster mainnet
```

---

# Backend Integration Architecture

## Current Flow (v1 - Simple)
```
User submits project
        ↓
Backend runs AI verification
        ↓
Backend generates ZK proof
        ↓
Backend calls Solana: mint_carbon_credits()
        ↓
Tokens minted & stored
        ↓
Backend stores Solana tx hash in DB
```

## Improved Flow (v2 - Async Queue)
```
User submits project
        ↓
Backend adds to verification queue
        ↓
Queue worker runs AI verification
        ↓
Queue worker generates ZK proof
        ↓
Queue worker calls Solana: mint_carbon_credits()
        ↓
Queue worker stores tx hash & status in DB
        ↓
Mobile app polls: GET /projects/:id/verify/:jobId
        ↓
User sees minted amount when complete
```

---

# TypeScript Client for Backend

## Installation
```bash
cd atmos_backend
npm install @project-serum/anchor @solana/web3.js @solana/spl-token
```

## Usage in Verification Queue

### solana-client.ts
```typescript
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import IDL from './idl/atmos_protocol.json';

export class AtmosClient {
  program: Program;
  connection: Connection;
  payer: Keypair;

  constructor() {
    const network = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const connection = new Connection(network, 'confirmed');
    
    const secretKey = JSON.parse(process.env.SOLANA_PAYER_KEY || '[]');
    const payer = Keypair.fromSecretKey(new Uint8Array(secretKey));
    
    const provider = new AnchorProvider(connection, new Wallet(payer), {
      commitment: 'confirmed',
    });

    const programId = new PublicKey(process.env.SOLANA_PROGRAM_ID || '...');
    this.program = new Program(IDL, programId, provider);
    this.connection = connection;
    this.payer = payer;
  }

  async mintCarbonCredits(
    projectId: string,
    amount: u64,
    zkProof: Buffer,
    recipientWallet: PublicKey
  ): Promise<string> {
    // Get token accounts
    const mint = new PublicKey(process.env.SOLANA_MINT_ADDRESS || '...');
    const recipientATA = await getAssociatedTokenAddress(mint, recipientWallet);
    const feeRecipientATA = await getAssociatedTokenAddress(
      mint,
      new PublicKey(process.env.SOLANA_FEE_RECIPIENT || '...')
    );

    // Call mint_carbon_credits instruction
    const tx = await this.program.methods
      .mintCarbonCredits(amount, projectId, Array.from(zkProof))
      .accounts({
        mint,
        recipient: recipientATA,
        feeRecipientAccount: feeRecipientATA,
        payer: this.payer.publicKey,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx; // Transaction hash
  }

  async getVerificationRecord(projectId: string, userWallet: PublicKey): Promise<any> {
    // Look up PDA: seeds [b"verification", userWallet, projectId]
    const [pda] = await PublicKey.findProgramAddress(
      [
        Buffer.from('verification'),
        userWallet.toBuffer(),
        Buffer.from(projectId),
      ],
      this.program.programId
    );

    return this.program.account.verificationRecord.fetch(pda);
  }
}
```

### Integration in verification-queue.ts
```typescript
import { AtmosClient } from './solana-client';

const solanaClient = new AtmosClient();

// In queue processor:
const zkResult = await generateZKProof({...});
const zkProof = Buffer.from(zkResult.proofHash, 'hex');

// Get user's Solana wallet from DB
const userWallet = new PublicKey(user.solana_wallet_address);

try {
  // Call Solana contract
  const txHash = await solanaClient.mintCarbonCredits(
    projectId,
    aiResult.co2eEstimated * 100, // Convert to token units
    zkProof,
    userWallet
  );

  // Store tx hash and status
  await query(
    `UPDATE projects 
     SET solana_mint_tx = $1, 
         solana_minted_amount = $2,
         solana_minted_at = NOW()
     WHERE id = $3`,
    [txHash, aiResult.co2eEstimated, projectId]
  );

  logger.info('Carbon credits minted on Solana', {
    projectId,
    txHash,
    amount: aiResult.co2eEstimated,
  });
} catch (err) {
  logger.error('Solana minting failed', { projectId, error: err.message });
  throw err;
}
```

---

# Environment Variables

Add to `.env` in atmos_backend:

```bash
# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PROGRAM_ID=AtmosXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SOLANA_MINT_ADDRESS=TokenkegQfeZyiNwAJsyFbPVwwP37PrLn3zYsU3qWd
SOLANA_FEE_RECIPIENT=9Z5jqg7mfFJR7mP8sZhFYxcXVNcNLyTKPEwgtzVLZvMp
SOLANA_PAYER_KEY=[1,2,3,...]  # Base64-encoded keypair JSON

# Production: Use secrets manager
SOLANA_PAYER_KEY=$(aws secretsmanager get-secret-value --secret-id atmos/solana-payer)
```

---

# Load Testing Script

### tests/load-mint.ts
```typescript
import { AtmosClient } from '../src/solana-client';
import { randomBytes } from 'crypto';

async function loadTest() {
  const client = new AtmosClient();
  const concurrency = 100;
  const duration = 60 * 1000; // 1 minute
  
  let successCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  const worker = async () => {
    while (Date.now() - startTime < duration) {
      try {
        const projectId = `project-${Math.random().toString(36).substring(7)}`;
        const zkProof = randomBytes(288);
        const amount = BigInt(100 + Math.floor(Math.random() * 900));
        
        const tx = await client.mintCarbonCredits(
          projectId,
          amount,
          zkProof,
          recipient
        );
        
        console.log(`✓ Minted: ${projectId} (tx: ${tx.substring(0, 8)}...)`);
        successCount++;
      } catch (err) {
        console.error(`✗ Error: ${(err as any).message}`);
        errorCount++;
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  // Run concurrent workers
  const workers = Array(concurrency).fill(0).map(() => worker());
  await Promise.all(workers);

  console.log(`\nLoad Test Results:`);
  console.log(`  Successful: ${successCount}`);
  console.log(`  Failed: ${errorCount}`);
  console.log(`  Success Rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(2)}%`);
}

loadTest().catch(console.error);
```

Run:
```bash
npx ts-node tests/load-mint.ts
```

---

# Deployment Checklist

### Before Devnet
- [ ] All tests passing locally
- [ ] TypeScript client compiles
- [ ] Anchor.toml configured
- [ ] Program ID placeholder replaced

### Before Mainnet
- [ ] Devnet deployment successful
- [ ] Devnet load test passed (1000+ TPS)
- [ ] Fee mechanism verified
- [ ] Rate limiting tested
- [ ] Emergency pause tested
- [ ] ZK proof verification working
- [ ] Backend integration tested end-to-end
- [ ] Security audit completed
- [ ] Multisig for upgrade authority set up

### Post-Mainnet Monitoring
- [ ] Monitor failed transactions
- [ ] Track fee accumulation
- [ ] Watch ZK proof verification errors
- [ ] Alert on paused state
- [ ] Track total minted/retired
- [ ] Monitor devnet for breaking changes

---

# Troubleshooting

### "InvalidProof" Error
- Check that ZK proof is not empty (v1 requirement)
- Upgrade to v2 when Groth16 verification ready

### "ProjectIdTooLong" Error
- Limit project_id to 32 bytes max
- Use hash of long IDs if needed

### Rate Limit Exceeded
- User can mint max 100 times per day
- Contact admin if limit needs increase

### Account Not Rent Exempt
- Ensure all PDAs have sufficient lamports
- Check account space calculation (8 + data_size)

### Transaction Timeout
- Increase Solana RPC timeout in client
- Check network congestion
- Reduce batch size

---

# Next Steps

1. **Build & test locally** (today)
2. **Deploy to devnet** (tomorrow)
3. **Wire TypeScript client into backend** (tomorrow)
4. **Load test on devnet** (day 4)
5. **Security audit** (week 2)
6. **Deploy to mainnet** (week 2)

Production-ready by end of Week 1. ✅

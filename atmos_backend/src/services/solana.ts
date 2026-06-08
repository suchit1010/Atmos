/**
 * ATMOS Solana Service
 * ─────────────────────────────────────────────────────
 * Handles:
 *   1. Anchor ZK proof hash on-chain (memo program)
 *   2. Mint carbon credit SPL tokens
 *   3. Transfer credits (marketplace settlement)
 *   4. Burn credits + issue retirement certificate
 *   5. Query on-chain state
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  burn,
  transfer,
  getMint,
} from '@solana/spl-token';
import bs58   from 'bs58';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { query }  from '../db/pool';

// ─── Connection singleton ─────────────────────────────
let connection: Connection;
let payer: Keypair;

function getConnection(): Connection {
  if (!connection) {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    connection   = new Connection(rpcUrl, 'confirmed');
    logger.info('Solana connection established', { rpc: rpcUrl });
  }
  return connection;
}

function getPayer(): Keypair {
  if (!payer) {
    const privKey = process.env.SOLANA_WALLET_PRIVATE_KEY;
    if (!privKey) {
      // Dev mode: generate ephemeral keypair
      payer = Keypair.generate();
      logger.warn('No SOLANA_WALLET_PRIVATE_KEY — using ephemeral keypair (dev only)');
    } else {
      try {
        payer = Keypair.fromSecretKey(bs58.decode(privKey));
      } catch {
        payer = Keypair.generate();
        logger.warn('Invalid SOLANA_WALLET_PRIVATE_KEY — using ephemeral keypair');
      }
    }
  }
  return payer;
}

// ─── Airdrop for devnet testing ───────────────────────
export async function requestAirdropIfNeeded(): Promise<void> {
  const conn    = getConnection();
  const kp      = getPayer();
  const balance = await conn.getBalance(kp.publicKey);

  if (balance < 0.1 * LAMPORTS_PER_SOL) {
    logger.info('Requesting devnet airdrop', { pubkey: kp.publicKey.toBase58() });
    try {
      const sig = await conn.requestAirdrop(kp.publicKey, 2 * LAMPORTS_PER_SOL);
      await conn.confirmTransaction(sig, 'confirmed');
      logger.info('Airdrop confirmed');
    } catch (err: any) {
      logger.warn('Airdrop failed (rate limited)', { error: err.message });
    }
  }
}

// ─── Anchor ZK proof on-chain via Memo program ────────
export async function anchorProofOnSolana(
  proofHash:  string,
  co2eAmount: number,
  projectId:  string
): Promise<{ txHash: string; slot: number }> {
  const conn = getConnection();
  const kp   = getPayer();

  await requestAirdropIfNeeded();

  // Encode proof hash as memo
  const MEMO_PROGRAM = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
  const memoText     = `ATMOS:${projectId}:${proofHash}:${co2eAmount}:${Date.now()}`;

  const memoIx = new TransactionInstruction({
    programId: MEMO_PROGRAM,
    keys:      [{ pubkey: kp.publicKey, isSigner: true, isWritable: false }],
    data:      Buffer.from(memoText, 'utf8'),
  });

  const tx     = new Transaction().add(memoIx);
  const txHash = await sendAndConfirmTransaction(conn, tx, [kp], {
    commitment: 'confirmed',
    skipPreflight: false,
  });

  const slot = (await conn.getTransaction(txHash, { commitment: 'confirmed' }))
    ?.slot || 0;

  logger.info('Proof anchored on Solana', { txHash, slot, proofHash });

  return { txHash, slot };
}

// ─── Mint SPL carbon credit token ────────────────────
export interface MintCreditResult {
  mintAddress:  string;
  tokenAccount: string;
  txHash:       string;
  slot:         number;
  amount:       number;
}

export async function mintCarbonCredit(
  projectId:    string,
  recipientPubKey: string,
  co2eAmount:   number,  // tonnes
  grade:        string
): Promise<MintCreditResult> {
  const conn   = getConnection();
  const kp     = getPayer();
  const decimals = parseInt(process.env.SPL_TOKEN_DECIMALS || '6');

  await requestAirdropIfNeeded();

  let recipient: PublicKey;
  try {
    recipient = new PublicKey(recipientPubKey);
  } catch {
    recipient = kp.publicKey; // fallback
  }

  logger.info('Minting carbon credit SPL token', { projectId, co2eAmount, grade });

  // Create new SPL mint
  const mint = await createMint(
    conn,
    kp,         // payer
    kp.publicKey, // mint authority
    kp.publicKey, // freeze authority
    decimals
  );

  // Get/create recipient token account
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    conn,
    kp,
    mint,
    recipient
  );

  // Mint tokens (co2e * 10^decimals)
  const amount = BigInt(Math.round(co2eAmount * (10 ** decimals)));
  const mintTx = await mintTo(
    conn,
    kp,
    mint,
    tokenAccount.address,
    kp,         // mint authority
    amount
  );

  const slot = (await conn.getTransaction(mintTx, { commitment: 'confirmed' }))
    ?.slot || 0;

  // Anchor mint event on-chain (memo)
  await anchorProofOnSolana(
    crypto.createHash('sha256').update(mint.toBase58() + projectId).digest('hex').substring(0, 20),
    co2eAmount,
    projectId
  );

  logger.info('Carbon credit minted', {
    mint: mint.toBase58(),
    txHash: mintTx,
    co2e: co2eAmount,
  });

  return {
    mintAddress:  mint.toBase58(),
    tokenAccount: tokenAccount.address.toBase58(),
    txHash:       mintTx,
    slot,
    amount:       co2eAmount,
  };
}

// ─── Retire (burn) credits ────────────────────────────
export interface RetireResult {
  burnTxHash:  string;
  certNFTMint: string;
  slot:        number;
}

export async function retireCredits(
  mintAddress:      string,
  tokenAccountAddr: string,
  co2eAmount:       number,
  retiredByPubKey:  string,
  organisationName: string,
  projectId:        string
): Promise<RetireResult> {
  const conn     = getConnection();
  const kp       = getPayer();
  const decimals = parseInt(process.env.SPL_TOKEN_DECIMALS || '6');

  await requestAirdropIfNeeded();

  const mint         = new PublicKey(mintAddress);
  const tokenAccount = new PublicKey(tokenAccountAddr);
  const amount       = BigInt(Math.round(co2eAmount * (10 ** decimals)));

  logger.info('Burning carbon credits', { mintAddress, co2eAmount, organisationName });

  // Burn tokens
  const burnTx = await burn(conn, kp, tokenAccount, mint, kp, amount);

  // Mint retirement certificate NFT (simple SPL with supply=1)
  const certMint = await createMint(conn, kp, kp.publicKey, null, 0); // 0 decimals = NFT
  const certTA   = await getOrCreateAssociatedTokenAccount(
    conn, kp, certMint, kp.publicKey
  );
  await mintTo(conn, kp, certMint, certTA.address, kp, 1n);

  // Anchor retirement on-chain
  const certId = crypto.createHash('sha256')
    .update(burnTx + organisationName + Date.now())
    .digest('hex').substring(0, 16);

  const MEMO_PROGRAM = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
  const memoText     = `ATMOS:RETIRE:${projectId}:${co2eAmount}:${organisationName}:${certId}`;

  const memoIx = new TransactionInstruction({
    programId: MEMO_PROGRAM,
    keys: [{ pubkey: kp.publicKey, isSigner: true, isWritable: false }],
    data: Buffer.from(memoText, 'utf8'),
  });
  const anchorTx = new Transaction().add(memoIx);
  await sendAndConfirmTransaction(conn, anchorTx, [kp]);

  const slot = (await conn.getTransaction(burnTx, { commitment: 'confirmed' }))
    ?.slot || 0;

  logger.info('Credits retired + certificate minted', {
    burnTx, certNFT: certMint.toBase58(), co2e: co2eAmount,
  });

  return {
    burnTxHash:  burnTx,
    certNFTMint: certMint.toBase58(),
    slot,
  };
}

// ─── Get wallet balance ───────────────────────────────
export async function getWalletBalance(pubkeyStr: string): Promise<number> {
  try {
    const conn   = getConnection();
    const pubkey = new PublicKey(pubkeyStr);
    const bal    = await conn.getBalance(pubkey);
    return bal / LAMPORTS_PER_SOL;
  } catch {
    return 0;
  }
}

// ─── Get transaction details ──────────────────────────
export async function getTransactionDetails(txHash: string): Promise<{
  slot: number;
  blockTime: number | null;
  status: 'confirmed' | 'failed' | 'not_found';
}> {
  try {
    const conn = getConnection();
    const tx   = await conn.getTransaction(txHash, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) return { slot: 0, blockTime: null, status: 'not_found' };

    return {
      slot:      tx.slot,
      blockTime: tx.blockTime,
      status:    tx.meta?.err ? 'failed' : 'confirmed',
    };
  } catch {
    return { slot: 0, blockTime: null, status: 'not_found' };
  }
}

// ─── Health check ─────────────────────────────────────
export async function solanaHealthCheck(): Promise<{ ok: boolean; slot: number }> {
  try {
    const conn = getConnection();
    const slot = await conn.getSlot();
    return { ok: true, slot };
  } catch {
    return { ok: false, slot: 0 };
  }
}

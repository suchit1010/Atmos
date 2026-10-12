#!/usr/bin/env node
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import bs58 from 'bs58';

const RPC = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const NETWORK = process.env.SOLANA_NETWORK || 'devnet';

function getKeypairFromEnv() {
  const priv = process.env.SOLANA_WALLET_PRIVATE_KEY;
  if (!priv) return Keypair.generate();
  try {
    const parsed = JSON.parse(priv);
    if (Array.isArray(parsed)) return Keypair.fromSecretKey(Uint8Array.from(parsed));
  } catch {}
  return Keypair.fromSecretKey(bs58.decode(priv));
}

async function requestAirdrop(conn, kp) {
  if (NETWORK !== 'devnet' && NETWORK !== 'testnet') return;
  const bal = await conn.getBalance(kp.publicKey);
  if (bal < 0.1 * LAMPORTS_PER_SOL) {
    console.log('Requesting airdrop to', kp.publicKey.toBase58());
    const sig = await conn.requestAirdrop(kp.publicKey, 2 * LAMPORTS_PER_SOL);
    await conn.confirmTransaction(sig, 'confirmed');
    console.log('Airdrop done', sig);
  }
}

async function main() {
  const conn = new Connection(RPC, 'confirmed');
  const kp = getKeypairFromEnv();

  await requestAirdrop(conn, kp);

  const recipient = process.argv[2] || kp.publicKey.toBase58();
  const co2e = parseFloat(process.argv[3] || '1');
  const decimals = parseInt(process.env.SPL_TOKEN_DECIMALS || '6');

  console.log('Creating mint and minting to', recipient, 'amount', co2e);
  const mint = await createMint(conn, kp, kp.publicKey, kp.publicKey, decimals);
  const tokenAcc = await getOrCreateAssociatedTokenAccount(conn, kp, mint, new PublicKey(recipient));
  const amount = BigInt(Math.round(co2e * Math.pow(10, decimals)));
  const tx = await mintTo(conn, kp, mint, tokenAcc.address, kp, amount);
  console.log('Mint tx:', tx);
  console.log('Mint address:', mint.toBase58());
  console.log('Token account:', tokenAcc.address.toBase58());
}

main().catch(err => { console.error(err); process.exit(1); });

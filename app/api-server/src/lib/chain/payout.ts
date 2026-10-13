import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { buildPayoutMemo, memoInstruction } from "./memo";
import { ChainSendError, type ChainClient } from "./types";

export interface PayoutRecord {
  key: string;
  batchId: string;
  tranche: 1 | 2;
  recipient: string;
  mint: string;
  amountMinor: number;
  status: "pending" | "confirmed" | "failed";
  signature?: string;
  slot?: number;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface PayoutStore {
  /** Atomic insert-if-absent. True when this call created the record. */
  claim(record: PayoutRecord): Promise<boolean>;
  get(key: string): Promise<PayoutRecord | undefined>;
  update(record: PayoutRecord): Promise<void>;
  /** Delete a claim whose transaction definitively never landed. */
  release(key: string): Promise<void>;
}

export class MemoryPayoutStore implements PayoutStore {
  private readonly records = new Map<string, PayoutRecord>();

  async claim(record: PayoutRecord): Promise<boolean> {
    if (this.records.has(record.key)) return false;
    this.records.set(record.key, { ...record });
    return true;
  }

  async get(key: string): Promise<PayoutRecord | undefined> {
    const found = this.records.get(key);
    return found ? { ...found } : undefined;
  }

  async update(record: PayoutRecord): Promise<void> {
    this.records.set(record.key, { ...record });
  }

  async release(key: string): Promise<void> {
    this.records.delete(key);
  }
}

/**
 * A previous attempt has an unknown outcome (timeout, dropped connection). The
 * transaction may still land, so we never resend: an operator reconciles first.
 */
export class PayoutPendingError extends Error {
  constructor(readonly key: string, detail?: string) {
    super(`payout ${key} has an unknown outcome${detail ? `: ${detail}` : ""}; reconcile before retrying`);
    this.name = "PayoutPendingError";
  }
}

export function payoutKey(batchId: string, tranche: 1 | 2): string {
  return `${batchId}:t${tranche}`;
}

/**
 * Creates the payout test token: the authority is the mint authority, there is
 * no freeze authority, and the whole supply is minted to the authority's
 * associated token account, from which tranches are paid. This token is not a
 * carbon credit; it only stands in for money on devnet.
 */
export async function createPayoutMint(
  client: ChainClient,
  authority: Keypair,
  opts: { decimals?: number; initialSupplyMinor?: bigint } = {},
): Promise<{ mint: PublicKey; authorityAta: PublicKey; decimals: number }> {
  const decimals = opts.decimals ?? 2;
  const supply = opts.initialSupplyMinor ?? 100_000_000n;
  const mintKey = Keypair.generate();
  const authorityAta = getAssociatedTokenAddressSync(mintKey.publicKey, authority.publicKey, true);
  const rent = await client.minRentExempt(MINT_SIZE);

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: authority.publicKey,
      newAccountPubkey: mintKey.publicKey,
      space: MINT_SIZE,
      lamports: rent,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMint2Instruction(mintKey.publicKey, decimals, authority.publicKey, null),
    createAssociatedTokenAccountIdempotentInstruction(
      authority.publicKey,
      authorityAta,
      authority.publicKey,
      mintKey.publicKey,
    ),
    createMintToInstruction(mintKey.publicKey, authorityAta, authority.publicKey, supply),
  );
  await client.send(tx, [authority, mintKey]);
  return { mint: mintKey.publicKey, authorityAta, decimals };
}

export interface PayTrancheArgs {
  client: ChainClient;
  store: PayoutStore;
  authority: Keypair;
  mint: PublicKey;
  decimals: number;
  recipient: PublicKey;
  batchId: string;
  tranche: 1 | 2;
  amountMinor: number;
  now?: () => Date;
}

export interface PayTrancheResult {
  record: PayoutRecord;
  replayed: boolean;
}

interface Inflight {
  promise: Promise<PayTrancheResult>;
  recipient: string;
  amountMinor: number;
}

// Calls for the same key inside one process share a single attempt. The store
// claim is what protects against other processes (serverless instances).
const inflightByStore = new WeakMap<PayoutStore, Map<string, Inflight>>();

export async function payTranche(args: PayTrancheArgs): Promise<PayTrancheResult> {
  if (!Number.isSafeInteger(args.amountMinor) || args.amountMinor <= 0) {
    throw new RangeError("amountMinor must be a positive safe integer");
  }
  const key = payoutKey(args.batchId, args.tranche);
  let inflight = inflightByStore.get(args.store);
  if (!inflight) {
    inflight = new Map();
    inflightByStore.set(args.store, inflight);
  }
  const running = inflight.get(key);
  if (running) {
    if (running.recipient !== args.recipient.toBase58() || running.amountMinor !== args.amountMinor) {
      throw new Error("idempotency key reused with different parameters");
    }
    const result = await running.promise;
    return { record: result.record, replayed: true };
  }
  const map = inflight;
  const promise = attemptPayout(args, key).finally(() => map.delete(key));
  map.set(key, { promise, recipient: args.recipient.toBase58(), amountMinor: args.amountMinor });
  return promise;
}

async function attemptPayout(args: PayTrancheArgs, key: string): Promise<PayTrancheResult> {
  const { client, store, authority, mint, decimals, recipient, batchId, tranche, amountMinor } = args;
  const now = args.now ?? (() => new Date());
  const stamp = now().toISOString();
  const record: PayoutRecord = {
    key,
    batchId,
    tranche,
    recipient: recipient.toBase58(),
    mint: mint.toBase58(),
    amountMinor,
    status: "pending",
    createdAt: stamp,
    updatedAt: stamp,
  };

  let claimed = await store.claim(record);
  for (let attempt = 0; !claimed && attempt < 3; attempt++) {
    const existing = await store.get(key);
    if (existing) {
      if (
        existing.recipient !== record.recipient ||
        existing.amountMinor !== amountMinor ||
        existing.mint !== record.mint
      ) {
        throw new Error("idempotency key reused with different parameters");
      }
      if (existing.status === "confirmed") return { record: existing, replayed: true };
      if (existing.status === "pending") throw new PayoutPendingError(key, existing.error);
      await store.release(key); // an operator marked it failed: allow a fresh attempt
    }
    claimed = await store.claim(record);
  }
  if (!claimed) throw new PayoutPendingError(key);

  let tx: Transaction;
  try {
    const authorityAta = getAssociatedTokenAddressSync(mint, authority.publicKey, true);
    const recipientAta = getAssociatedTokenAddressSync(mint, recipient, true);
    tx = new Transaction().add(
      memoInstruction(authority.publicKey, buildPayoutMemo(batchId, tranche, amountMinor)),
      createAssociatedTokenAccountIdempotentInstruction(authority.publicKey, recipientAta, recipient, mint),
      createTransferCheckedInstruction(authorityAta, mint, recipientAta, authority.publicKey, BigInt(amountMinor), decimals),
    );
  } catch (err) {
    await store.release(key);
    throw err;
  }

  try {
    const sent = await client.send(tx, [authority]);
    const done: PayoutRecord = {
      ...record,
      status: "confirmed",
      signature: sent.signature,
      slot: sent.slot,
      updatedAt: now().toISOString(),
    };
    await store.update(done);
    return { record: done, replayed: false };
  } catch (err) {
    if (err instanceof ChainSendError && err.definitive) {
      await store.release(key);
      throw err;
    }
    const message = err instanceof Error ? err.message : "unknown error";
    await store.update({ ...record, error: message, updatedAt: now().toISOString() });
    throw new PayoutPendingError(key, message);
  }
}

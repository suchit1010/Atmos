import type { Keypair, PublicKey, Transaction } from "@solana/web3.js";

export interface SentTx {
  signature: string;
  slot: number;
}

export interface MemoTx {
  signature: string;
  slot: number;
  blockTime: number | null;
  /** Fee payer, base58. */
  signer: string;
  /** Decoded utf8 text of every Memo-program instruction, in order. */
  memos: string[];
  err: unknown | null;
}

/**
 * `definitive: true` means the transaction can never land (preflight failure,
 * simulation failure, blockhash expired), so retrying is safe.
 * `definitive: false` means the outcome is unknown (timeout, dropped
 * connection): the transaction may still land, so callers must not resend
 * money-moving transactions without reconciling first.
 */
export class ChainSendError extends Error {
  readonly definitive: boolean;

  constructor(message: string, definitive: boolean, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ChainSendError";
    this.definitive = definitive;
  }
}

export interface ChainClient {
  /** "devnet" | "localnet" | ... Used for explorer links only. */
  readonly network: string;
  /** Sets fee payer to signers[0], adds a recent blockhash, signs, sends and confirms. */
  send(tx: Transaction, signers: Keypair[]): Promise<SentTx>;
  /** Null when the transaction is not found. */
  getMemoTx(signature: string): Promise<MemoTx | null>;
  /** 0n when the owner's associated token account does not exist. */
  getTokenBalance(owner: PublicKey, mint: PublicKey): Promise<bigint>;
  /** Rent-exempt minimum for an account of `space` bytes, in lamports. */
  minRentExempt(space: number): Promise<number>;
}

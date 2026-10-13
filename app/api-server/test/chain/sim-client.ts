import {
  Keypair,
  PublicKey,
  SystemInstruction,
  SystemProgram,
  type Transaction,
  type TransactionInstruction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TokenInstruction,
  decodeInitializeMint2Instruction,
  decodeMintToInstruction,
  decodeTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import bs58 from "bs58";
import { MEMO_PROGRAM_ID } from "../../src/lib/chain/memo";
import { ChainSendError, type ChainClient, type MemoTx, type SentTx } from "../../src/lib/chain/types";

/**
 * A small in-memory ledger for tests. It is NOT the Solana runtime: it checks
 * signatures and interprets only the instructions Atmos builds (System
 * createAccount, SPL Token InitializeMint2 / MintTo / TransferChecked,
 * Associated Token Account create-idempotent, Memo), applying them atomically.
 * It exists because LiteSVM aborts after a few program executions in the
 * sandbox this was built in. Real-runtime behaviour is covered by
 * scripts/devnet-smoke.ts, which must be run once against devnet.
 */
const FEE_LAMPORTS = 5000;
const ATA_RENT = 2_039_280;

interface MintState {
  decimals: number;
  mintAuthority: string;
  supply: bigint;
}
interface TokenAccountState {
  mint: string;
  owner: string;
  amount: bigint;
}
interface Ledger {
  lamports: Map<string, number>;
  mints: Map<string, MintState>;
  tokenAccounts: Map<string, TokenAccountState>;
}

function cloneLedger(l: Ledger): Ledger {
  return {
    lamports: new Map(l.lamports),
    mints: new Map([...l.mints].map(([k, v]) => [k, { ...v }])),
    tokenAccounts: new Map([...l.tokenAccounts].map(([k, v]) => [k, { ...v }])),
  };
}

function fail(message: string): never {
  throw new ChainSendError(`simulated runtime rejected the transaction: ${message}`, true);
}

export class SimChainClient implements ChainClient {
  readonly network = "localnet";
  sentCount = 0;
  private ledger: Ledger = { lamports: new Map(), mints: new Map(), tokenAccounts: new Map() };
  private readonly memoTxs = new Map<string, MemoTx>();

  fund(pubkey: PublicKey, sol: number): void {
    this.ledger.lamports.set(pubkey.toBase58(), Math.round(sol * 1_000_000_000));
  }

  lamportsOf(pubkey: PublicKey): number {
    return this.ledger.lamports.get(pubkey.toBase58()) ?? 0;
  }

  async send(tx: Transaction, signers: Keypair[]): Promise<SentTx> {
    const payer = signers[0];
    if (!payer) throw new ChainSendError("no signer supplied", true);
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = Keypair.generate().publicKey.toBase58();
    tx.sign(...signers);
    if (!tx.verifySignatures()) fail("missing or invalid signature");

    const signed = new Set<string>(
      tx.signatures.filter((s) => s.signature !== null).map((s) => s.publicKey.toBase58()),
    );
    const next = cloneLedger(this.ledger);
    this.charge(next, payer.publicKey.toBase58(), FEE_LAMPORTS * tx.signatures.length);

    const memos: string[] = [];
    for (const ix of tx.instructions) this.apply(next, ix, signed, memos);

    this.ledger = next;
    this.sentCount += 1;
    const first = tx.signatures[0]?.signature;
    if (!first) throw new ChainSendError("transaction was not signed", true);
    const signature = bs58.encode(first);
    this.memoTxs.set(signature, {
      signature,
      slot: this.sentCount,
      blockTime: null,
      signer: payer.publicKey.toBase58(),
      memos,
      err: null,
    });
    return { signature, slot: this.sentCount };
  }

  async getMemoTx(signature: string): Promise<MemoTx | null> {
    return this.memoTxs.get(signature) ?? null;
  }

  async getTokenBalance(owner: PublicKey, mint: PublicKey): Promise<bigint> {
    const ata = getAssociatedTokenAddressSync(mint, owner, true).toBase58();
    return this.ledger.tokenAccounts.get(ata)?.amount ?? 0n;
  }

  async minRentExempt(space: number): Promise<number> {
    return (space + 128) * 3480 * 2;
  }

  private charge(ledger: Ledger, account: string, lamports: number): void {
    const balance = ledger.lamports.get(account) ?? 0;
    if (balance < lamports) fail(`insufficient lamports for ${account.slice(0, 6)}`);
    ledger.lamports.set(account, balance - lamports);
  }

  private apply(ledger: Ledger, ix: TransactionInstruction, signed: Set<string>, memos: string[]): void {
    const program = ix.programId;
    if (program.equals(MEMO_PROGRAM_ID)) {
      for (const key of ix.keys) {
        if (key.isSigner && !signed.has(key.pubkey.toBase58())) fail("memo signer did not sign");
      }
      memos.push(Buffer.from(ix.data).toString("utf8"));
      return;
    }
    if (program.equals(SystemProgram.programId)) {
      const create = SystemInstruction.decodeCreateAccount(ix);
      if (!signed.has(create.newAccountPubkey.toBase58())) fail("new account did not sign");
      this.charge(ledger, create.fromPubkey.toBase58(), create.lamports);
      ledger.lamports.set(create.newAccountPubkey.toBase58(), create.lamports);
      return;
    }
    if (program.equals(TOKEN_PROGRAM_ID)) {
      this.applyToken(ledger, ix, signed);
      return;
    }
    if (program.equals(ASSOCIATED_TOKEN_PROGRAM_ID)) {
      this.applyAta(ledger, ix, signed);
      return;
    }
    fail(`unsupported program ${program.toBase58()}`);
  }

  private applyToken(ledger: Ledger, ix: TransactionInstruction, signed: Set<string>): void {
    const kind = ix.data[0];
    if (kind === TokenInstruction.InitializeMint2) {
      const d = decodeInitializeMint2Instruction(ix, TOKEN_PROGRAM_ID);
      const mint = d.keys.mint.pubkey.toBase58();
      if (!ledger.lamports.has(mint)) fail("mint account was not created");
      if (ledger.mints.has(mint)) fail("mint already initialised");
      ledger.mints.set(mint, { decimals: d.data.decimals, mintAuthority: d.data.mintAuthority.toBase58(), supply: 0n });
      return;
    }
    if (kind === TokenInstruction.MintTo) {
      const d = decodeMintToInstruction(ix, TOKEN_PROGRAM_ID);
      const mint = ledger.mints.get(d.keys.mint.pubkey.toBase58());
      const dest = ledger.tokenAccounts.get(d.keys.destination.pubkey.toBase58());
      if (!mint || !dest) fail("mint or destination missing");
      if (dest.mint !== d.keys.mint.pubkey.toBase58()) fail("destination is for another mint");
      if (d.keys.authority.pubkey.toBase58() !== mint.mintAuthority) fail("wrong mint authority");
      if (!signed.has(mint.mintAuthority)) fail("mint authority did not sign");
      mint.supply += d.data.amount;
      dest.amount += d.data.amount;
      return;
    }
    if (kind === TokenInstruction.TransferChecked) {
      const d = decodeTransferCheckedInstruction(ix, TOKEN_PROGRAM_ID);
      const mintKey = d.keys.mint.pubkey.toBase58();
      const mint = ledger.mints.get(mintKey);
      const src = ledger.tokenAccounts.get(d.keys.source.pubkey.toBase58());
      const dst = ledger.tokenAccounts.get(d.keys.destination.pubkey.toBase58());
      if (!mint || !src || !dst) fail("mint, source or destination missing");
      if (src.mint !== mintKey || dst.mint !== mintKey) fail("token account mint mismatch");
      if (d.data.decimals !== mint.decimals) fail("decimals mismatch");
      if (src.owner !== d.keys.owner.pubkey.toBase58() || !signed.has(src.owner)) fail("source owner did not sign");
      if (src.amount < d.data.amount) fail("insufficient token balance");
      src.amount -= d.data.amount;
      dst.amount += d.data.amount;
      return;
    }
    fail(`unsupported token instruction ${String(kind)}`);
  }

  private applyAta(ledger: Ledger, ix: TransactionInstruction, signed: Set<string>): void {
    // Only the idempotent create (data = [1]) is used. Keys: payer, ata, owner, mint, system, token.
    if (ix.data.length !== 1 || ix.data[0] !== 1) fail("unsupported associated-token instruction");
    const [payer, ata, owner, mint] = ix.keys;
    if (!payer || !ata || !owner || !mint) fail("malformed associated-token instruction");
    if (!signed.has(payer.pubkey.toBase58())) fail("ata payer did not sign");
    const expected = getAssociatedTokenAddressSync(mint.pubkey, owner.pubkey, true);
    if (!expected.equals(ata.pubkey)) fail("associated token address is not derived from owner and mint");
    if (!ledger.mints.has(mint.pubkey.toBase58())) fail("mint does not exist");
    const existing = ledger.tokenAccounts.get(ata.pubkey.toBase58());
    if (existing) {
      if (existing.owner !== owner.pubkey.toBase58() || existing.mint !== mint.pubkey.toBase58()) fail("ata exists with other owner or mint");
      return;
    }
    this.charge(ledger, payer.pubkey.toBase58(), ATA_RENT);
    ledger.tokenAccounts.set(ata.pubkey.toBase58(), { mint: mint.pubkey.toBase58(), owner: owner.pubkey.toBase58(), amount: 0n });
  }
}

/** Wraps a client and fails the next send with an unknown-outcome error, to test the pending path. */
export class FlakyClient implements ChainClient {
  failNext: "timeout" | null = null;
  sendAttempts = 0;

  constructor(private readonly inner: ChainClient) {}

  get network(): string {
    return this.inner.network;
  }

  async send(tx: Transaction, signers: Keypair[]): Promise<SentTx> {
    this.sendAttempts += 1;
    if (this.failNext === "timeout") {
      this.failNext = null;
      throw new ChainSendError("timeout", false);
    }
    return this.inner.send(tx, signers);
  }

  getMemoTx(signature: string): Promise<MemoTx | null> {
    return this.inner.getMemoTx(signature);
  }

  getTokenBalance(owner: PublicKey, mint: PublicKey): Promise<bigint> {
    return this.inner.getTokenBalance(owner, mint);
  }

  minRentExempt(space: number): Promise<number> {
    return this.inner.minRentExempt(space);
  }
}

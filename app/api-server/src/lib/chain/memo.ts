import { PublicKey, TransactionInstruction } from "@solana/web3.js";

export const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
export const EVIDENCE_MEMO_PREFIX = "ATMOS1";
export const PAYOUT_MEMO_PREFIX = "ATMOS1P";

const BATCH_ID = /^[A-Za-z0-9_-]{1,64}$/;
const HASH_HEX = /^[0-9a-f]{64}$/;

export function buildEvidenceMemo(batchId: string, hashHex: string): string {
  if (!BATCH_ID.test(batchId)) throw new TypeError("invalid batch id");
  if (!HASH_HEX.test(hashHex)) throw new TypeError("hash must be 64 lowercase hex characters");
  return `${EVIDENCE_MEMO_PREFIX}|${batchId}|${hashHex}`;
}

export function parseEvidenceMemo(text: string): { batchId: string; hash: string } | null {
  const parts = text.split("|");
  if (parts.length !== 3 || parts[0] !== EVIDENCE_MEMO_PREFIX) return null;
  const [, batchId, hash] = parts as [string, string, string];
  if (!BATCH_ID.test(batchId) || !HASH_HEX.test(hash)) return null;
  return { batchId, hash };
}

export function buildPayoutMemo(batchId: string, tranche: 1 | 2, amountMinor: number): string {
  if (!BATCH_ID.test(batchId)) throw new TypeError("invalid batch id");
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) throw new RangeError("invalid amount");
  return `${PAYOUT_MEMO_PREFIX}|${batchId}|t${tranche}|${amountMinor}`;
}

export function parsePayoutMemo(
  text: string,
): { batchId: string; tranche: 1 | 2; amountMinor: number } | null {
  const parts = text.split("|");
  if (parts.length !== 4 || parts[0] !== PAYOUT_MEMO_PREFIX) return null;
  const [, batchId, tr, amount] = parts as [string, string, string, string];
  if (!BATCH_ID.test(batchId)) return null;
  if (tr !== "t1" && tr !== "t2") return null;
  if (!/^[1-9][0-9]{0,15}$/.test(amount)) return null;
  const amountMinor = Number(amount);
  if (!Number.isSafeInteger(amountMinor)) return null;
  return { batchId, tranche: tr === "t1" ? 1 : 2, amountMinor };
}

export function memoInstruction(signer: PublicKey, text: string): TransactionInstruction {
  return new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [{ pubkey: signer, isSigner: true, isWritable: false }],
    data: Buffer.from(text, "utf8"),
  });
}

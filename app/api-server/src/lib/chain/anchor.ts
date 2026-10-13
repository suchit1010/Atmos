import { Transaction, type Keypair } from "@solana/web3.js";
import { buildEvidenceMemo, memoInstruction, parseEvidenceMemo } from "./memo";
import type { ChainClient } from "./types";

export async function anchorEvidence(
  client: ChainClient,
  authority: Keypair,
  batchId: string,
  hashHex: string,
): Promise<{ signature: string; slot: number; memo: string }> {
  const memo = buildEvidenceMemo(batchId, hashHex);
  const tx = new Transaction().add(memoInstruction(authority.publicKey, memo));
  const sent = await client.send(tx, [authority]);
  return { signature: sent.signature, slot: sent.slot, memo };
}

export type AnchorStatus =
  | "match"
  | "mismatch"
  | "not_found"
  | "wrong_signer"
  | "malformed"
  | "tx_failed";

export interface AnchorVerification {
  status: AnchorStatus;
  expected: { batchId: string; hash: string };
  onChain?: {
    batchId: string;
    hash: string;
    slot: number;
    blockTime: number | null;
    signer: string;
  };
}

/**
 * Re-reads the transaction from the chain and compares it with what we expect.
 * The signer is checked before the hash: an anchor written by anyone other than
 * the Atmos authority must never count, even if its hash happens to match.
 */
export async function verifyAnchor(
  client: ChainClient,
  signature: string,
  expected: { batchId: string; hash: string; authority: string },
): Promise<AnchorVerification> {
  const exp = { batchId: expected.batchId, hash: expected.hash };
  const tx = await client.getMemoTx(signature);
  if (!tx) return { status: "not_found", expected: exp };
  if (tx.err) return { status: "tx_failed", expected: exp };
  if (tx.signer !== expected.authority) return { status: "wrong_signer", expected: exp };

  let parsed: { batchId: string; hash: string } | null = null;
  for (const memo of tx.memos) {
    parsed = parseEvidenceMemo(memo);
    if (parsed) break;
  }
  if (!parsed) return { status: "malformed", expected: exp };

  const onChain = {
    batchId: parsed.batchId,
    hash: parsed.hash,
    slot: tx.slot,
    blockTime: tx.blockTime,
    signer: tx.signer,
  };
  const same = parsed.batchId === exp.batchId && parsed.hash === exp.hash;
  return { status: same ? "match" : "mismatch", expected: exp, onChain };
}

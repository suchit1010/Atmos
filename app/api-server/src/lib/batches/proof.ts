import { createHash } from "node:crypto";
import {
  canonicalize,
  explorerAddressUrl,
  explorerTxUrl,
  hashManifest,
  verifyAnchor,
  type AnchorStatus,
} from "../chain";
import { getConfig } from "../../config";
import { getBatch, getPhoto, loadPayouts, type Deps } from "./service";
import type { BatchRecord, EvidenceManifest } from "./types";

export type Verdict = "intact" | "tampered" | "pending_anchor" | "anchor_invalid" | "chain_unavailable";

export interface ProofResult {
  batchId: string;
  verdict: Verdict;
  verdictText: string;
  network: string;
  anchor?: {
    signature: string;
    slot: number;
    explorerUrl: string;
    authority: string;
    authorityUrl: string;
    anchoredHash: string;
    recomputedHash: string;
    chainStatus?: AnchorStatus;
    chainHash?: string;
    blockTime?: number | null;
  };
  photos: Array<{ kind: string; sha256: string; bytes: number; matches: boolean | null }>;
  summary: {
    feedstock: string;
    volumeL: number;
    startedAt: string;
    finalKgCO2e: number;
    finalLowKgCO2e: number;
    finalHighKgCO2e: number;
    methaneKgCO2e: number;
    gate: string;
    reviewedAt?: string;
    checks: Array<{ id: string; result: string; reason: string }>;
  };
  payouts: Array<{
    tranche: 1 | 2;
    status: string;
    amountMinor: number;
    amountDisplay: string;
    recipient: string;
    signature?: string;
    explorerUrl?: string;
  }>;
  registry?: { simulated: true; note: string; issuedTonnes: number };
  disclosures: string[];
}

const VERDICT_TEXT: Record<Verdict, string> = {
  intact: "Intact. The evidence pack matches the hash written to Solana.",
  tampered: "Changed. The evidence pack no longer matches the hash written to Solana.",
  pending_anchor: "Not anchored yet. The batch is accepted but its hash is not on Solana yet.",
  anchor_invalid: "The anchor transaction could not be confirmed as written by Atmos.",
  chain_unavailable: "Could not reach Solana just now. Try again in a moment.",
};

export function amountDisplay(minor: number, decimals = 2): string {
  const whole = Math.floor(minor / 10 ** decimals);
  const frac = String(minor % 10 ** decimals).padStart(decimals, "0");
  return `${whole}.${frac} ATMOS-TEST`;
}

export function shortKey(key: string): string {
  return key.length > 12 ? `${key.slice(0, 4)}…${key.slice(-4)}` : key;
}

/** The exact text that was hashed: fetch it, run sha256 on it, compare with the memo on Solana. */
export function canonicalText(manifest: EvidenceManifest): string {
  return canonicalize(manifest);
}

function sha256Hex(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function summaryOf(batch: BatchRecord): ProofResult["summary"] {
  const m = batch.manifest;
  return {
    feedstock: m.batch.feedstock,
    volumeL: m.batch.volumeL,
    startedAt: m.batch.startedAt,
    finalKgCO2e: m.quantity.finalKgCO2e,
    finalLowKgCO2e: m.quantity.finalLowKgCO2e,
    finalHighKgCO2e: m.quantity.finalHighKgCO2e,
    methaneKgCO2e: m.quantity.methaneKgCO2e,
    gate: m.gate,
    ...(batch.review ? { reviewedAt: batch.review.at } : {}),
    checks: m.checks,
  };
}

/**
 * Public proof for an accepted batch. Nothing here trusts the stored hash:
 * the manifest is re-hashed now and compared with what Solana says, and the
 * stored photos are re-hashed against the manifest.
 */
export async function buildProof(id: string, deps: Deps): Promise<ProofResult | undefined> {
  const batch = await getBatch(id, deps);
  if (!batch || batch.status !== "accepted") return undefined;

  const m = batch.manifest;
  const runtime = deps.chain();
  const network = batch.anchor?.network ?? runtime.client.network;

  const photos: ProofResult["photos"] = [];
  for (const p of m.photos) {
    const stored = await getPhoto(batch.id, p.sha256, deps);
    photos.push({
      kind: p.kind,
      sha256: p.sha256,
      bytes: p.bytes,
      matches: stored ? sha256Hex(stored.bytes) === p.sha256 : false,
    });
  }
  const photosOk = photos.every((p) => p.matches === true);

  const recomputedHash = hashManifest(m);
  let verdict: Verdict = "pending_anchor";
  let anchor: ProofResult["anchor"];

  if (batch.anchor) {
    // The trusted signer comes from this deployment's own key, never from the stored record,
    // so someone with write access to the database cannot swap in their own anchor.
    const trusted =
      runtime.authority?.publicKey.toBase58() ?? (getConfig().isProduction ? undefined : batch.anchor.authority);
    if (!trusted) {
      return {
        batchId: batch.id,
        verdict: "anchor_invalid",
        verdictText: VERDICT_TEXT.anchor_invalid,
        network,
        photos,
        summary: summaryOf(batch),
        payouts: [],
        disclosures: m.disclosures,
      };
    }
    anchor = {
      signature: batch.anchor.signature,
      slot: batch.anchor.slot,
      explorerUrl: explorerTxUrl(batch.anchor.signature, network),
      authority: trusted,
      authorityUrl: explorerAddressUrl(trusted, network),
      anchoredHash: batch.anchor.hash,
      recomputedHash,
    };
    try {
      const check = await verifyAnchor(runtime.client, batch.anchor.signature, {
        batchId: batch.id,
        hash: recomputedHash,
        authority: trusted,
      });
      anchor.chainStatus = check.status;
      if (check.onChain) {
        anchor.chainHash = check.onChain.hash;
        anchor.blockTime = check.onChain.blockTime;
      }
      if (check.status === "match") verdict = photosOk ? "intact" : "tampered";
      else if (check.status === "mismatch") verdict = "tampered";
      else verdict = "anchor_invalid";
    } catch {
      verdict = "chain_unavailable";
    }
  }

  const payouts: ProofResult["payouts"] = [];
  const stored = await loadPayouts(batch, deps);
  for (const rec of [stored.t1, stored.t2]) {
    if (!rec) continue;
    payouts.push({
      tranche: rec.tranche,
      status: rec.status,
      amountMinor: rec.amountMinor,
      amountDisplay: amountDisplay(rec.amountMinor),
      recipient: shortKey(rec.recipient),
      ...(rec.signature ? { signature: rec.signature } : {}),
      ...(rec.explorerUrl ? { explorerUrl: rec.explorerUrl } : {}),
    });
  }

  return {
    batchId: batch.id,
    verdict,
    verdictText: VERDICT_TEXT[verdict],
    network,
    ...(anchor ? { anchor } : {}),
    photos,
    summary: summaryOf(batch),
    payouts,
    ...(batch.registry
      ? { registry: { simulated: true as const, note: batch.registry.note, issuedTonnes: batch.registry.issuedTonnes } }
      : {}),
    disclosures: m.disclosures,
  };
}

export type { BatchRecord };

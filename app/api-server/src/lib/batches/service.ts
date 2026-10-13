import { PublicKey } from "@solana/web3.js";
import { farmerTotalMinor, tranche2Minor } from "../algo";
import {
  ChainSendError,
  PayoutPendingError,
  anchorEvidence,
  explorerAddressUrl,
  explorerTxUrl,
  hashManifest,
  payTranche,
  payoutKey,
  type PayoutRecord,
} from "../chain";
import {
  getChainRuntime,
  resolveMint,
  type ChainRuntime,
} from "../chain-runtime";
import { ServiceError } from "../errors";
import { getStore, type KvStore } from "../store";
import { batchIdFor, decodePhotos, evaluateBatch, round2, walletRef } from "./evaluate";
import { kvPayoutStore, PAYOUTS } from "./payout-store";
import { DEMO_PROGRAMME } from "./programme";
import type { CreateBatchBody, ProducerBody } from "./schemas";
import type { BatchRecord, ProducerRecord } from "./types";

export const BATCHES = "batches";
export const PRODUCERS = "producers";
export const PHOTOS = "photos";
const LOCKS = "locks";

export interface Deps {
  store: KvStore;
  chain: () => ChainRuntime;
  now: () => Date;
}

export function defaultDeps(): Deps {
  return { store: getStore(), chain: getChainRuntime, now: () => new Date() };
}

const DAY_MS = 86_400_000;

// --- producers ---------------------------------------------------------------

export async function saveProducer(userId: string, body: ProducerBody, deps: Deps): Promise<ProducerRecord> {
  const existing = await deps.store.get<ProducerRecord>(PRODUCERS, userId);
  const record: ProducerRecord = {
    userId,
    farmPoint: body.farmPoint,
    polygonOnFile: existing?.polygonOnFile ?? false,
    trainingComplete: true,
    trainingSource: "demo-simulated",
    updatedAt: deps.now().toISOString(),
    ...((body.name ?? existing?.name) ? { name: (body.name ?? existing?.name) as string } : {}),
    ...((body.areaHectares ?? existing?.areaHectares) !== undefined
      ? { areaHectares: (body.areaHectares ?? existing?.areaHectares) as number }
      : {}),
    ...((body.kilnVolumeL ?? existing?.kilnVolumeL) !== undefined
      ? { kilnVolumeL: (body.kilnVolumeL ?? existing?.kilnVolumeL) as number }
      : {}),
    ...((body.wallet ?? existing?.wallet) ? { wallet: (body.wallet ?? existing?.wallet) as string } : {}),
  };
  await deps.store.put(PRODUCERS, userId, record);
  return record;
}

export function getProducer(userId: string, deps: Deps): Promise<ProducerRecord | undefined> {
  return deps.store.get<ProducerRecord>(PRODUCERS, userId);
}

// --- batches -----------------------------------------------------------------

export async function createBatch(
  ownerId: string,
  body: CreateBatchBody,
  deps: Deps,
): Promise<{ batch: BatchRecord; created: boolean }> {
  const id = batchIdFor(ownerId, body.clientBatchId);
  const existing = await deps.store.get<BatchRecord>(BATCHES, id);
  if (existing) return { batch: existing, created: false };

  const now = deps.now();
  const receivedAt = now.toISOString();
  if (Date.parse(body.startedAt) > Date.parse(body.submittedAt)) {
    throw new ServiceError(400, "invalid_times", { detail: "startedAt is after submittedAt" });
  }
  if (Date.parse(body.submittedAt) > now.getTime() + DAY_MS) {
    throw new ServiceError(400, "invalid_times", { detail: "submittedAt is in the future" });
  }

  const photos = decodePhotos(body.photos);
  const producer = await getProducer(ownerId, deps);

  const all = await deps.store.list<BatchRecord>(BATCHES, { limit: 500 });
  const otherPhotoHashes = all.flatMap((b) => b.photos.map((p) => p.sha256));
  const day = body.startedAt.slice(0, 10);
  const batchesTodayForKiln = all.filter((b) => b.ownerId === ownerId && b.manifest.batch.startedAt.slice(0, 10) === day).length + 1;

  const wallet = body.payoutWallet ?? producer?.wallet;
  const evaluation = evaluateBatch({
    batchId: id,
    ownerId,
    body,
    payoutWallet: wallet ?? "",
    photos: photos.map((p) => p.meta),
    producer,
    programme: DEMO_PROGRAMME,
    otherPhotoHashes,
    batchesTodayForKiln,
    receivedAt,
  });

  if (evaluation.gate === "blocked") {
    throw new ServiceError(422, "blocked", {
      gate: evaluation.gate,
      checks: evaluation.checks,
      message: "This batch cannot be accepted yet. Fix the blocked checks and submit again.",
    });
  }

  if (!wallet) throw new ServiceError(400, "payout_wallet_required");

  const record: BatchRecord = {
    id,
    clientBatchId: body.clientBatchId,
    ownerId,
    createdAt: receivedAt,
    status: "pending_review",
    gate: evaluation.gate,
    payoutWallet: wallet,
    photos: photos.map((p) => p.meta),
    checks: evaluation.checks,
    quant: evaluation.quant,
    money: evaluation.money,
    manifest: evaluation.manifest,
    manifestHash: evaluation.manifestHash,
  };

  for (const p of photos) {
    await deps.store.put(PHOTOS, `${id}:${p.meta.sha256}`, { mime: p.meta.mime, dataBase64: p.bytes.toString("base64") });
  }
  const inserted = await deps.store.insertIfAbsent(BATCHES, id, record);
  if (!inserted) {
    const winner = await deps.store.get<BatchRecord>(BATCHES, id);
    if (winner) return { batch: winner, created: false };
  }
  return { batch: record, created: true };
}

export async function getBatch(id: string, deps: Deps): Promise<BatchRecord | undefined> {
  return deps.store.get<BatchRecord>(BATCHES, id);
}

export async function listBatches(
  actor: { id: string; role: string },
  deps: Deps,
  filter: { status?: string } = {},
): Promise<BatchRecord[]> {
  const all = await deps.store.list<BatchRecord>(BATCHES, { limit: 1000 });
  return all.filter(
    (b) => (actor.role === "admin" || b.ownerId === actor.id) && (!filter.status || b.status === filter.status),
  );
}

export async function getPhoto(
  batchId: string,
  sha256: string,
  deps: Deps,
): Promise<{ mime: string; bytes: Buffer } | undefined> {
  const found = await deps.store.get<{ mime: string; dataBase64: string }>(PHOTOS, `${batchId}:${sha256}`);
  return found ? { mime: found.mime, bytes: Buffer.from(found.dataBase64, "base64") } : undefined;
}

// --- views -------------------------------------------------------------------

export interface PayoutView extends PayoutRecord {
  explorerUrl?: string;
}

export async function loadPayouts(batch: BatchRecord, deps: Deps): Promise<{ t1?: PayoutView; t2?: PayoutView }> {
  const network = batch.anchor?.network ?? deps.chain().client.network;
  const out: { t1?: PayoutView; t2?: PayoutView } = {};
  for (const tranche of [1, 2] as const) {
    const rec = await deps.store.get<PayoutRecord>(PAYOUTS, payoutKey(batch.id, tranche));
    if (rec) {
      out[tranche === 1 ? "t1" : "t2"] = {
        ...rec,
        ...(rec.signature ? { explorerUrl: explorerTxUrl(rec.signature, network) } : {}),
      };
    }
  }
  return out;
}

/** What the apps see. Never includes photo bytes or the owner's id. */
export async function toView(batch: BatchRecord, deps: Deps): Promise<Record<string, unknown>> {
  const payouts = await loadPayouts(batch, deps);
  const { ownerId: _owner, demoOriginalManifest, ...rest } = batch;
  const network = batch.anchor?.network;
  return {
    ...rest,
    anchor: batch.anchor
      ? { ...batch.anchor, explorerUrl: explorerTxUrl(batch.anchor.signature, batch.anchor.network) }
      : undefined,
    payouts,
    walletUrl: network ? explorerAddressUrl(batch.payoutWallet, network) : undefined,
    tamperActive: demoOriginalManifest !== undefined,
    proofPath: `/api/proof/${batch.id}/view`,
  };
}

// --- review, anchor and pay --------------------------------------------------

async function save(batch: BatchRecord, deps: Deps): Promise<void> {
  await deps.store.put(BATCHES, batch.id, batch);
}

async function mutate(id: string, deps: Deps, change: (b: BatchRecord) => void): Promise<BatchRecord> {
  const fresh = await getBatch(id, deps);
  if (!fresh) throw new ServiceError(404, "not_found");
  change(fresh);
  await save(fresh, deps);
  return fresh;
}

function mapChainError(err: unknown, unknownCode: string): ServiceError {
  if (err instanceof ServiceError) return err;
  if (err instanceof PayoutPendingError) return new ServiceError(502, "payout_outcome_unknown", { detail: err.message });
  if (err instanceof ChainSendError) {
    return err.definitive
      ? new ServiceError(502, "chain_send_failed", { detail: err.message })
      : new ServiceError(502, unknownCode, { detail: err.message });
  }
  if (err instanceof RangeError) return new ServiceError(409, "payout_invalid", { detail: err.message });
  if (err instanceof Error && err.message.includes("idempotency key")) {
    return new ServiceError(409, "payout_conflict", { detail: err.message });
  }
  return new ServiceError(502, unknownCode, { detail: err instanceof Error ? err.message : "unknown error" });
}

async function requireChain(deps: Deps) {
  const runtime = deps.chain();
  if (!runtime.authority) throw new ServiceError(503, "chain_not_configured");
  const mint = await resolveMint(runtime, deps.store);
  if (!mint) throw new ServiceError(503, "payout_mint_not_configured");
  return { runtime, authority: runtime.authority, mint };
}

async function anchorStep(batch: BatchRecord, deps: Deps): Promise<BatchRecord> {
  if (batch.anchor) return batch;
  const { runtime, authority } = await requireChain(deps);
  const hash = hashManifest(batch.manifest);
  if (hash !== batch.manifestHash) throw new ServiceError(409, "manifest_changed");

  const lockKey = `anchor:${batch.id}`;
  const claimed = await deps.store.insertIfAbsent(LOCKS, lockKey, { at: deps.now().toISOString() });
  if (!claimed) {
    const latest = await getBatch(batch.id, deps);
    if (latest?.anchor) return latest;
    throw new ServiceError(409, "anchor_in_progress_or_unknown", {
      detail: "An earlier anchoring attempt has an unknown outcome. Check the explorer, then reconcile.",
    });
  }
  try {
    const sent = await anchorEvidence(runtime.client, authority, batch.id, hash);
    return await mutate(batch.id, deps, (b) => {
      b.anchor = {
        signature: sent.signature,
        slot: sent.slot,
        memo: sent.memo,
        hash,
        authority: authority.publicKey.toBase58(),
        network: runtime.client.network,
        at: deps.now().toISOString(),
      };
    });
  } catch (err) {
    if (err instanceof ChainSendError && err.definitive) await deps.store.delete(LOCKS, lockKey);
    throw mapChainError(err, "anchor_outcome_unknown");
  }
}

async function payStep(batch: BatchRecord, tranche: 1 | 2, amountMinor: number, deps: Deps): Promise<void> {
  if (amountMinor <= 0) return;
  // The amounts and the recipient must be the ones the anchored evidence committed to.
  const committed = batch.demoOriginalManifest ?? batch.manifest;
  if (
    committed.payout.tranche1Minor !== batch.money.tranche1Minor ||
    committed.payout.totalMinor !== batch.money.totalMinor ||
    committed.payout.recipientRef !== walletRef(batch.payoutWallet)
  ) {
    throw new ServiceError(409, "payout_not_bound_to_evidence");
  }
  const { runtime, authority, mint } = await requireChain(deps);
  try {
    await payTranche({
      client: runtime.client,
      store: kvPayoutStore(deps.store),
      authority,
      mint,
      decimals: runtime.decimals,
      recipient: new PublicKey(batch.payoutWallet),
      batchId: batch.id,
      tranche,
      amountMinor,
      now: deps.now,
    });
  } catch (err) {
    throw mapChainError(err, "payout_outcome_unknown");
  }
}

export async function reviewBatch(
  id: string,
  adminId: string,
  decision: "accept" | "reject",
  note: string | undefined,
  deps: Deps,
): Promise<BatchRecord> {
  let batch = await getBatch(id, deps);
  if (!batch) throw new ServiceError(404, "not_found");

  if (decision === "reject") {
    if (batch.status === "accepted") throw new ServiceError(409, "already_accepted");
    return mutate(id, deps, (b) => {
      if (b.status === "accepted") throw new ServiceError(409, "already_accepted");
      b.status = "rejected";
      b.review = { by: adminId, at: deps.now().toISOString(), decision: "reject", ...(note ? { note } : {}) };
    });
  }

  if (batch.status === "rejected") throw new ServiceError(409, "already_rejected");
  await requireChain(deps); // fail before recording the decision when the chain is not ready

  if (batch.status === "pending_review") {
    batch = await mutate(id, deps, (b) => {
      if (b.status === "rejected") throw new ServiceError(409, "already_rejected");
      b.status = "accepted";
      b.review = { by: adminId, at: deps.now().toISOString(), decision: "accept", ...(note ? { note } : {}) };
    });
  }

  try {
    batch = await anchorStep(batch, deps);
    await payStep(batch, 1, batch.money.tranche1Minor, deps);
  } catch (err) {
    if (err instanceof ServiceError) {
      const latest = (await getBatch(id, deps)) ?? batch;
      err.body = { ...err.body, batch: await toView(latest, deps) };
    }
    throw err;
  }
  return (await getBatch(id, deps)) ?? batch;
}

// --- demo-only steps ---------------------------------------------------------

export async function simulateRegistryIssue(
  id: string,
  issuedFraction: number,
  deps: Deps,
): Promise<BatchRecord> {
  const batch = await getBatch(id, deps);
  if (!batch) throw new ServiceError(404, "not_found");
  if (batch.status !== "accepted" || !batch.anchor) throw new ServiceError(409, "not_anchored");
  const t1 = await deps.store.get<PayoutRecord>(PAYOUTS, payoutKey(id, 1));
  if (batch.money.tranche1Minor > 0 && t1?.status !== "confirmed") throw new ServiceError(409, "tranche1_not_paid");

  const computedTonnes = round2(batch.quant.finalKgCO2e) / 1000;
  const issuedTonnes = Math.round(computedTonnes * issuedFraction * 1_000_000) / 1_000_000;
  const issuedValueMinor = farmerTotalMinor(issuedTonnes, batch.money.priceMinorPerTonne, batch.money.farmerShare);
  const t2 = tranche2Minor(issuedValueMinor, batch.money.tranche1Minor);

  if (!batch.registry) {
    batch.registry = {
      simulated: true,
      issuedTonnes,
      issuedValueMinor,
      at: deps.now().toISOString(),
      note: "Simulated registry issuance for the demo. Atmos mints no credits and no real registry is connected.",
    };
    await save(batch, deps);
  } else if (batch.registry.issuedTonnes !== issuedTonnes) {
    throw new ServiceError(409, "registry_already_simulated", {
      detail: "Issuance was already simulated with a different amount.",
    });
  }
  await payStep(batch, 2, t2, deps);
  return (await getBatch(id, deps)) ?? batch;
}

/** Demo only: change the stored evidence after the fact so the proof page can catch it. */
export async function tamperManifest(id: string, deps: Deps): Promise<BatchRecord> {
  return mutate(id, deps, (b) => {
    if (b.demoOriginalManifest) return;
    b.demoOriginalManifest = structuredClone(b.manifest);
    b.manifest.quantity.finalKgCO2e = round2(b.manifest.quantity.finalKgCO2e * 3);
  });
}

export async function restoreManifest(id: string, deps: Deps): Promise<BatchRecord> {
  return mutate(id, deps, (b) => {
    if (!b.demoOriginalManifest) return;
    b.manifest = b.demoOriginalManifest;
    delete b.demoOriginalManifest;
  });
}

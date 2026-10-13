import { createHash } from "node:crypto";
import {
  ARTISAN_C_SINK_V1,
  CHECK_CONFIG_V1,
  DEMO_FEEDSTOCK_TABLE,
  batchGate,
  farmerTotalMinor,
  quantify,
  runChecks,
  splitTranches,
  type CheckInput,
  type CheckResult,
  type QuantResult,
} from "../algo";
import { hashManifest } from "../chain";
import { ServiceError } from "../errors";
import { DISCLOSURES, PAYOUT_UNIT } from "./programme";
import { MAX_PHOTO_BYTES, type CreateBatchBody } from "./schemas";
import type { EvidenceManifest, Money, PhotoMeta, ProducerRecord, ProgrammeConfig } from "./types";

export const round2 = (n: number): number => Math.round(n * 100) / 100;
export const round2dp = (n: number): number => Math.round(n * 100) / 100;

/** Public coordinates are rounded to 2 decimals (about 1 km); the checks use the exact values. */
export const coarse = round2dp;

/** Drops undefined keys: the canonical form refuses them on purpose. */
function compact<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export function batchIdFor(ownerId: string, clientBatchId: string): string {
  return `b_${createHash("sha256").update(`${ownerId}|${clientBatchId}`).digest("hex").slice(0, 16)}`;
}

/** A commitment to the payout wallet: binds the evidence to the recipient without publishing it. */
export function walletRef(wallet: string): string {
  return createHash("sha256").update(`atmos-wallet|${wallet}`).digest("hex").slice(0, 12);
}

export function producerRef(ownerId: string): string {
  return createHash("sha256").update(`atmos-producer|${ownerId}`).digest("hex").slice(0, 12);
}

export interface DecodedPhoto {
  meta: PhotoMeta;
  bytes: Buffer;
}

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

function hasMagic(bytes: Buffer, mime: string): boolean {
  if (mime === "image/jpeg") return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  );
}

/** Decodes and fingerprints the photos. The server computes every hash itself. */
export function decodePhotos(photos: CreateBatchBody["photos"]): DecodedPhoto[] {
  const decoded = photos.map((p, i): DecodedPhoto => {
    if (!BASE64.test(p.dataBase64)) throw new ServiceError(400, "invalid_photo", { index: i });
    const bytes = Buffer.from(p.dataBase64, "base64");
    if (bytes.length === 0 || bytes.length > MAX_PHOTO_BYTES || !hasMagic(bytes, p.mime)) {
      throw new ServiceError(400, "invalid_photo", { index: i });
    }
    const meta: PhotoMeta = compact({
      kind: p.kind,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.length,
      mime: p.mime,
      capturedAt: p.capturedAt,
      lat: p.lat,
      lng: p.lng,
    });
    return { meta, bytes };
  });
  const hashes = new Set(decoded.map((d) => d.meta.sha256));
  if (hashes.size !== decoded.length) throw new ServiceError(400, "duplicate_photo_in_request");
  return decoded;
}

export interface EvaluateArgs {
  batchId: string;
  ownerId: string;
  body: CreateBatchBody;
  payoutWallet: string;
  photos: PhotoMeta[];
  producer: ProducerRecord | undefined;
  programme: ProgrammeConfig;
  otherPhotoHashes: string[];
  batchesTodayForKiln: number;
  receivedAt: string;
}

export interface Evaluation {
  checks: CheckResult[];
  gate: ReturnType<typeof batchGate>;
  quant: QuantResult;
  money: Money;
  manifest: EvidenceManifest;
  manifestHash: string;
}

export function evaluateBatch(args: EvaluateArgs): Evaluation {
  const { body, producer, programme } = args;
  const feed = DEMO_FEEDSTOCK_TABLE[body.feedstock];

  const checkInput: CheckInput = {
    batchStartedAt: body.startedAt,
    submittedAt: body.submittedAt,
    receivedAt: args.receivedAt,
    photos: args.photos.map((p) =>
      compact({ kind: p.kind, sha256: p.sha256, capturedAt: p.capturedAt, lat: p.lat, lng: p.lng }),
    ),
    farm: producer
      ? compact({
          point: producer.farmPoint,
          areaHectares: producer.areaHectares,
          polygonOnFile: producer.polygonOnFile,
        })
      : {},
    volumeL: body.volumeL,
    batchesTodayForKiln: args.batchesTodayForKiln,
    trainingComplete: Boolean(producer?.trainingComplete),
    methaneCompensationOnFile: false,
    programmeRequiresCompensation: programme.requiresMethaneCompensation,
    // The demo table stands in for the Ithaka database; the manifest says so.
    densitySource: "database",
    otherBatchPhotoHashes: args.otherPhotoHashes,
    ...compact({
      moisturePct: body.moisturePct,
      touchTestPassed: body.touchTestPassed,
      kilnVolumeL: producer?.kilnVolumeL,
    }),
  };

  const checks = runChecks(checkInput, CHECK_CONFIG_V1);
  const gate = batchGate(checks);
  const quant = quantify({
    volumeL: body.volumeL,
    bulkDensityKgPerL: feed.bulkDensityKgPerL,
    carbonFraction: feed.carbonFraction,
  });

  const finalKg = round2(quant.finalKgCO2e);
  const totalMinor = farmerTotalMinor(finalKg / 1000, programme.priceMinorPerTonne, programme.farmerShare);
  const split = splitTranches(totalMinor, programme.tranche1Share);
  const money: Money = {
    priceMinorPerTonne: programme.priceMinorPerTonne,
    farmerShare: programme.farmerShare,
    tranche1Share: programme.tranche1Share,
    totalMinor,
    tranche1Minor: split.t1,
    tranche2Minor: split.t2,
  };

  const manifest: EvidenceManifest = {
    schema: "atmos.batch-evidence/1",
    batchId: args.batchId,
    programme: {
      id: programme.id,
      standard: ARTISAN_C_SINK_V1.id,
      standardVersion: ARTISAN_C_SINK_V1.version,
      checksVersion: CHECK_CONFIG_V1.version,
    },
    producer: { ref: producerRef(args.ownerId), trainingSource: "demo-simulated" },
    farm: producer
      ? compact({
          approxLat: coarse(producer.farmPoint.lat),
          approxLng: coarse(producer.farmPoint.lng),
          areaHectares: producer.areaHectares,
        })
      : { approxLat: 0, approxLng: 0 },
    batch: compact({
      startedAt: body.startedAt,
      submittedAt: body.submittedAt,
      receivedAt: args.receivedAt,
      feedstock: body.feedstock,
      bulkDensityKgPerL: feed.bulkDensityKgPerL,
      carbonFraction: feed.carbonFraction,
      densityNote: feed.source,
      volumeL: body.volumeL,
      moisturePct: body.moisturePct,
      touchTestPassed: body.touchTestPassed,
      kilnVolumeL: producer?.kilnVolumeL,
    }),
    photos: args.photos.map((p) =>
      compact({
        kind: p.kind,
        sha256: p.sha256,
        bytes: p.bytes,
        capturedAt: p.capturedAt,
        lat: p.lat === undefined ? undefined : coarse(p.lat),
        lng: p.lng === undefined ? undefined : coarse(p.lng),
      }),
    ),
    checks: checks.map((c) => ({ id: c.id, result: c.result, reason: c.reason })),
    gate,
    quantity: {
      massKg: round2(quant.massKg),
      carbonKg: round2(quant.carbonKg),
      potentialKgCO2e: round2(quant.potentialKgCO2e),
      finalKgCO2e: finalKg,
      finalLowKgCO2e: round2(quant.finalLowKgCO2e),
      finalHighKgCO2e: round2(quant.finalHighKgCO2e),
      methaneKgCO2e: round2(quant.methaneKgCO2e),
    },
    payout: {
      unit: PAYOUT_UNIT,
      priceMinorPerTonne: money.priceMinorPerTonne,
      farmerShare: money.farmerShare,
      recipientRef: walletRef(args.payoutWallet),
      totalMinor,
      tranche1Minor: split.t1,
      tranche2Minor: split.t2,
    },
    disclosures: [...DISCLOSURES],
  };

  return { checks, gate, quant, money, manifest, manifestHash: hashManifest(manifest) };
}

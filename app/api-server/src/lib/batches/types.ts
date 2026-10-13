import type { BatchGate, CheckResult, QuantResult } from "../algo";
import type { PayoutRecord } from "../chain";

export type BatchStatus = "pending_review" | "accepted" | "rejected";

export interface ProgrammeConfig {
  id: string;
  /** Price of one tonne CO2e in minor units of the payout token (cents). */
  priceMinorPerTonne: number;
  farmerShare: number;
  tranche1Share: number;
  requiresMethaneCompensation: boolean;
}

export interface ProducerRecord {
  userId: string;
  name?: string;
  farmPoint: { lat: number; lng: number };
  areaHectares?: number;
  polygonOnFile: boolean;
  kilnVolumeL?: number;
  wallet?: string;
  /** Simulated in this demo: real onboarding and training records are out of scope. */
  trainingComplete: true;
  trainingSource: "demo-simulated";
  updatedAt: string;
}

export interface PhotoMeta {
  kind: "mid" | "end";
  sha256: string;
  bytes: number;
  mime: "image/jpeg" | "image/png";
  capturedAt?: string;
  lat?: number;
  lng?: number;
}

export interface Money {
  priceMinorPerTonne: number;
  farmerShare: number;
  tranche1Share: number;
  totalMinor: number;
  tranche1Minor: number;
  tranche2Minor: number;
}

export interface EvidenceManifest {
  schema: "atmos.batch-evidence/1";
  batchId: string;
  programme: { id: string; standard: string; standardVersion: string; checksVersion: string };
  producer: { ref: string; trainingSource: "demo-simulated" };
  farm: { approxLat: number; approxLng: number; areaHectares?: number };
  batch: {
    startedAt: string;
    submittedAt: string;
    receivedAt: string;
    feedstock: string;
    bulkDensityKgPerL: number;
    carbonFraction: number;
    densityNote: string;
    volumeL: number;
    moisturePct?: number;
    touchTestPassed?: boolean;
    kilnVolumeL?: number;
  };
  photos: Array<{
    kind: "mid" | "end";
    sha256: string;
    bytes: number;
    capturedAt?: string;
    lat?: number;
    lng?: number;
  }>;
  checks: Array<{ id: string; result: string; reason: string }>;
  gate: BatchGate;
  quantity: {
    massKg: number;
    carbonKg: number;
    potentialKgCO2e: number;
    finalKgCO2e: number;
    finalLowKgCO2e: number;
    finalHighKgCO2e: number;
    methaneKgCO2e: number;
  };
  payout: {
    unit: string;
    priceMinorPerTonne: number;
    farmerShare: number;
    recipientRef: string;
    totalMinor: number;
    tranche1Minor: number;
    tranche2Minor: number;
  };
  disclosures: string[];
}

export interface BatchRecord {
  id: string;
  clientBatchId: string;
  ownerId: string;
  createdAt: string;
  status: BatchStatus;
  gate: Exclude<BatchGate, "blocked">;
  payoutWallet: string;
  photos: PhotoMeta[];
  checks: CheckResult[];
  quant: QuantResult;
  money: Money;
  /** Exactly what is hashed and anchored. */
  manifest: EvidenceManifest;
  manifestHash: string;
  review?: { by: string; at: string; decision: "accept" | "reject"; note?: string };
  anchor?: {
    signature: string;
    slot: number;
    memo: string;
    hash: string;
    authority: string;
    network: string;
    at: string;
  };
  registry?: {
    simulated: true;
    issuedTonnes: number;
    issuedValueMinor: number;
    at: string;
    note: string;
  };
  /** Demo only: the untouched manifest while the tamper button is active. */
  demoOriginalManifest?: EvidenceManifest;
}

export type { PayoutRecord };

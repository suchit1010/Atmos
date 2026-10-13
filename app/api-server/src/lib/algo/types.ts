/**
 * Shared types for the Atmos rules engine.
 *
 * Everything in src/lib/algo is pure and deterministic: no network, no clock,
 * no randomness, no database, no process.env. All times arrive as ISO 8601
 * strings and "now" arrives as `submittedAt`.
 */

export interface GeoPoint {
  lat: number;
  lng: number;
}

// ---------------------------------------------------------------------------
// Standard and quantification
// ---------------------------------------------------------------------------

/** Numeric constants of a carbon-sink standard. See standard.ts for sources. */
export interface StandardConstants {
  /** Fraction of potential removed as a transport margin (0.03 = 3%). */
  transportMargin: number;
  /** kg CO2 per kg carbon (44/12). */
  co2PerCarbon: number;
  /** Share of the carbon still stored after 100 years. */
  persistence100y: number;
  /** Methane emitted per tonne of biochar, in kg CH4. */
  ch4KgPerTonneBiochar: number;
  /** 20-year global warming potential of methane. */
  gwp20ch4: number;
  /** Half-width of the reported range (0.2 = plus or minus 20%). */
  densityAccuracy: number;
  /** Transport emissions are only deducted above this distance (km). */
  transportThresholdKm: number;
}

export interface CSinkStandard {
  readonly id: string;
  readonly version: string;
  readonly constants: Readonly<StandardConstants>;
}

export interface FeedstockEntry {
  readonly bulkDensityKgPerL: number;
  readonly carbonFraction: number;
  readonly source: string;
}

export interface QuantInput {
  volumeL: number;
  bulkDensityKgPerL: number;
  /** Carbon fraction of the biochar, in (0, 1]. */
  carbonFraction: number;
  /** One-way transport distance. Emissions only count above the threshold. */
  transportKm?: number;
  transportKgCO2e?: number;
}

export interface QuantResult {
  massKg: number;
  carbonKg: number;
  potentialKgCO2e: number;
  finalKgCO2e: number;
  finalLowKgCO2e: number;
  finalHighKgCO2e: number;
  /** Reported separately; never netted against the credit quantity. */
  methaneKgCO2e: number;
  standardId: string;
  standardVersion: string;
  constants: StandardConstants;
  inputs: QuantInput;
}

// ---------------------------------------------------------------------------
// Payout tranches (all money is integer minor units: paise or cents)
// ---------------------------------------------------------------------------

export interface TrancheSplit {
  t1: number;
  t2: number;
}

export interface BatchTonnes {
  batchId: string;
  tonnes: number;
}

// ---------------------------------------------------------------------------
// Rule checks
// ---------------------------------------------------------------------------

export type CheckSeverity = "pass" | "note" | "flag" | "block";

export interface CheckResult {
  id: string;
  title: string;
  result: CheckSeverity;
  /** Plain-language explanation a farmer or reviewer can read. */
  reason: string;
}

export type BatchGate = "blocked" | "needs_review" | "clear";

export interface CheckConfig {
  version: string;
  minPhotos: number;
  farmRadiusMeters: number;
  moistureBlockPct: number;
  maxBatchesPerKilnPerDay: number;
  syncDelayNoteDays: number;
  polygonRequiredHectares: number;
}

export type PhotoKind = "mid" | "end";

export interface PhotoEvidence {
  kind: PhotoKind;
  /** ISO 8601 UTC. */
  capturedAt?: string;
  lat?: number;
  lng?: number;
  sha256: string;
}

export interface FarmRecord {
  point?: GeoPoint;
  areaHectares?: number;
  polygonOnFile?: boolean;
}

export type DensitySource = "database" | "lab" | "manual" | "missing";

export interface CheckInput {
  /** ISO 8601 UTC strings. The engine never reads a clock. */
  batchStartedAt: string;
  submittedAt: string;
  receivedAt: string;
  photos: PhotoEvidence[];
  farm: FarmRecord;
  moisturePct?: number;
  touchTestPassed?: boolean;
  volumeL: number;
  kilnVolumeL?: number;
  /** Count of batches on this kiln today, including this one. */
  batchesTodayForKiln: number;
  trainingComplete: boolean;
  methaneCompensationOnFile: boolean;
  programmeRequiresCompensation: boolean;
  densitySource: DensitySource;
  densityOverrideReason?: string;
  otherBatchPhotoHashes: string[];
}

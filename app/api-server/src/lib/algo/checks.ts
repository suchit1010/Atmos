import { distanceMeters } from "./haversine";
import type {
  BatchGate,
  CheckConfig,
  CheckInput,
  CheckResult,
  CheckSeverity,
  GeoPoint,
  PhotoEvidence,
} from "./types";

/**
 * The 13 rule checks (R1..R13). All pure: same input, same output.
 *
 * Checks only ever add scrutiny (note, flag, block). They never produce or
 * change a credit quantity, and results carry no numeric credit field.
 *
 * Each rule says where it comes from: "guideline" (the Artisan C-Sink
 * guideline) or "proposed" (an Atmos addition, to be confirmed).
 */
export const CHECK_CONFIG_V1: CheckConfig = Object.freeze({
  version: "1.0",
  minPhotos: 2,
  farmRadiusMeters: 250,
  moistureBlockPct: 30,
  maxBatchesPerKilnPerDay: 2,
  syncDelayNoteDays: 14,
  polygonRequiredHectares: 1,
});

const MS_PER_DAY = 86_400_000;

const SEVERITY_RANK: Record<CheckSeverity, number> = { pass: 0, note: 1, flag: 2, block: 3 };

// --- helpers ---------------------------------------------------------------

const UTC_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * Parse an ISO 8601 string that carries an explicit zone (Z or an offset) into
 * epoch milliseconds. Strings with no zone are rejected, because JavaScript
 * would read them in the machine's local time and break determinism.
 */
function parseTime(value: string | undefined): number | undefined {
  if (value === undefined || !UTC_ISO.test(value)) return undefined;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : ms;
}

type LocatedPhoto = PhotoEvidence & { lat: number; lng: number };

function hasLocation(photo: PhotoEvidence): photo is LocatedPhoto {
  return (
    typeof photo.lat === "number" &&
    Number.isFinite(photo.lat) &&
    typeof photo.lng === "number" &&
    Number.isFinite(photo.lng)
  );
}

function photoTimes(photos: PhotoEvidence[]): number[] {
  const times: number[] = [];
  for (const photo of photos) {
    const t = parseTime(photo.capturedAt);
    if (t !== undefined) times.push(t);
  }
  return times;
}

const photoWord = (n: number): string => (n === 1 ? "1 photo" : `${n} photos`);

function result(id: string, title: string, severity: CheckSeverity, reason: string): CheckResult {
  return { id, title, result: severity, reason };
}

// --- rules -----------------------------------------------------------------

/** R1 photos present. Source: guideline. */
function r1Photos(input: CheckInput, cfg: CheckConfig): CheckResult {
  const title = "Photos present";
  const hasMid = input.photos.some((p) => p.kind === "mid");
  const hasEnd = input.photos.some((p) => p.kind === "end");
  if (input.photos.length < cfg.minPhotos) {
    return result("R1", title, "block", `We need at least ${cfg.minPhotos} photos, one mid-burn and one at the end. We got ${input.photos.length}.`);
  }
  if (!hasMid) return result("R1", title, "block", "There is no photo taken in the middle of the burn.");
  if (!hasEnd) return result("R1", title, "block", "There is no photo taken at the end of the burn.");
  return result("R1", title, "pass", "Mid-burn and end photos are both there.");
}

/** R2 photo metadata. Missing time or location: guideline. The time-window flag: proposed. */
function r2Metadata(input: CheckInput): CheckResult {
  const title = "Photo time and location";
  const missing = input.photos.filter((p) => parseTime(p.capturedAt) === undefined || !hasLocation(p)).length;
  if (missing > 0) {
    return result("R2", title, "block", `${photoWord(missing)} did not record a readable time or location.`);
  }
  const start = parseTime(input.batchStartedAt);
  const end = parseTime(input.submittedAt);
  if (start === undefined || end === undefined) {
    return result("R2", title, "flag", "The batch start or submit time could not be read, so photo times were not checked.");
  }
  const outside = photoTimes(input.photos).filter((t) => t < start || t > end).length;
  if (outside > 0) {
    return result("R2", title, "flag", `${photoWord(outside)} taken outside the time between batch start and submit.`);
  }
  return result("R2", title, "pass", "Every photo has a time and location, and all fall within the batch.");
}

/** R3 photo order. Source: proposed. */
function r3Order(input: CheckInput): CheckResult {
  const title = "Photo order";
  const midTimes = photoTimes(input.photos.filter((p) => p.kind === "mid"));
  const endTimes = photoTimes(input.photos.filter((p) => p.kind === "end"));
  if (midTimes.length === 0 || endTimes.length === 0) {
    return result("R3", title, "pass", "Not enough photo times to compare the order.");
  }
  if (Math.max(...endTimes) <= Math.min(...midTimes)) {
    return result("R3", title, "flag", "The end photo was not taken after the mid-burn photo.");
  }
  return result("R3", title, "pass", "The end photo was taken after the mid-burn photo.");
}

/** R4 location. Source: proposed. Missing farm point is handled by R10. */
function r4Location(input: CheckInput, cfg: CheckConfig): CheckResult {
  const title = "Photos taken at the farm";
  const point: GeoPoint | undefined = input.farm.point;
  if (point === undefined) return result("R4", title, "pass", "no farm point on file");
  const distances = input.photos.filter(hasLocation).map((p) => distanceMeters(point, p));
  const far = distances.filter((d) => d > cfg.farmRadiusMeters);
  if (far.length > 0) {
    const farthest = Math.round(Math.max(...far));
    return result("R4", title, "flag", `${photoWord(far.length)} taken far from the farm (farthest about ${farthest} m; limit ${cfg.farmRadiusMeters} m).`);
  }
  return result("R4", title, "pass", `All photos with a location are within ${cfg.farmRadiusMeters} m of the farm.`);
}

/** R5 duplicate photo. Source: proposed. Hashes are compared case-insensitively. */
function r5Duplicate(input: CheckInput): CheckResult {
  const title = "Photos not reused";
  const seen = new Set(input.otherBatchPhotoHashes.map((h) => h.toLowerCase()));
  const reused = input.photos.filter((p) => seen.has(p.sha256.toLowerCase())).length;
  if (reused > 0) {
    return result("R5", title, "flag", `${photoWord(reused)} already used in another batch.`);
  }
  return result("R5", title, "pass", "No photo was used in another batch.");
}

/** R6 moisture. Source: guideline. A reading of exactly the limit blocks. */
function r6Moisture(input: CheckInput, cfg: CheckConfig): CheckResult {
  const title = "Feedstock dryness";
  const m = input.moisturePct;
  if (m !== undefined && Number.isFinite(m) && m >= 0) {
    if (m >= cfg.moistureBlockPct) {
      return result("R6", title, "block", `Moisture reading ${m}% is at or above the ${cfg.moistureBlockPct}% limit. The feedstock is too wet.`);
    }
    return result("R6", title, "pass", `Moisture reading ${m}% is below the ${cfg.moistureBlockPct}% limit.`);
  }
  if (input.touchTestPassed === true) {
    return result("R6", title, "pass", "No moisture reading, but the touch test was passed.");
  }
  return result("R6", title, "block", "no moisture reading and touch test not passed");
}

/** R7 capacity. Source: partly proposed (the kiln volume comparison). */
function r7Capacity(input: CheckInput): CheckResult {
  const title = "Batch fits the kiln";
  if (input.kilnVolumeL !== undefined && input.volumeL > input.kilnVolumeL) {
    return result("R7", title, "flag", `Batch volume ${input.volumeL} L is more than the kiln holds (${input.kilnVolumeL} L).`);
  }
  return result("R7", title, "pass", "Batch volume fits the kiln, or the kiln size is not on record.");
}

/** R8 rate. Source: proposed. */
function r8Rate(input: CheckInput, cfg: CheckConfig): CheckResult {
  const title = "Batches per day";
  if (input.batchesTodayForKiln > cfg.maxBatchesPerKilnPerDay) {
    return result("R8", title, "flag", `This is batch ${input.batchesTodayForKiln} today on this kiln; we expect at most ${cfg.maxBatchesPerKilnPerDay}.`);
  }
  return result("R8", title, "pass", "The number of batches today is normal for this kiln.");
}

/** R9 training. Source: guideline. */
function r9Training(input: CheckInput): CheckResult {
  const title = "Training complete";
  if (!input.trainingComplete) {
    return result("R9", title, "block", "The producer has not finished the required training.");
  }
  return result("R9", title, "pass", "Training is complete.");
}

/** R10 registration. Source: guideline. */
function r10Registration(input: CheckInput, cfg: CheckConfig): CheckResult {
  const title = "Farm registration";
  if (input.farm.point === undefined) {
    return result("R10", title, "block", "The farm location is not registered.");
  }
  const area = input.farm.areaHectares;
  if (area !== undefined && area > cfg.polygonRequiredHectares && input.farm.polygonOnFile !== true) {
    return result("R10", title, "block", `Farms over ${cfg.polygonRequiredHectares} ha need a boundary map on file. This one is ${area} ha.`);
  }
  return result("R10", title, "pass", "The farm is registered.");
}

/** R11 methane compensation. Source: guideline. */
function r11Methane(input: CheckInput): CheckResult {
  const title = "Methane compensation";
  if (input.methaneCompensationOnFile) {
    return result("R11", title, "pass", "Methane compensation is on file.");
  }
  if (input.programmeRequiresCompensation) {
    return result("R11", title, "flag", "This programme requires methane compensation and none is on file.");
  }
  return result("R11", title, "note", "No methane compensation on file. This programme does not require it.");
}

/** R12 density. Source: guideline (a measured or database value is required). */
function r12Density(input: CheckInput): CheckResult {
  const title = "Density source";
  if (input.densitySource === "missing") {
    return result("R12", title, "flag", "No feedstock density is on record. Add a lab result or database value.");
  }
  const reason = input.densityOverrideReason;
  if (input.densitySource === "manual" && (reason === undefined || reason.trim() === "")) {
    return result("R12", title, "flag", "The density was typed in by hand with no reason given.");
  }
  return result("R12", title, "pass", "The density has a recorded source.");
}

/** R13 sync delay. Source: proposed. Measured from the last photo, else the batch start. */
function r13SyncDelay(input: CheckInput, cfg: CheckConfig): CheckResult {
  const title = "Upload delay";
  const received = parseTime(input.receivedAt);
  const times = photoTimes(input.photos);
  const reference = times.length > 0 ? Math.max(...times) : parseTime(input.batchStartedAt);
  if (received === undefined || reference === undefined) {
    return result("R13", title, "note", "The upload delay could not be worked out because a date was unreadable.");
  }
  const days = (received - reference) / MS_PER_DAY;
  if (days > cfg.syncDelayNoteDays) {
    const what = times.length > 0 ? "the last photo was taken" : "the batch started";
    return result("R13", title, "note", `This upload arrived about ${Math.floor(days)} days after ${what}.`);
  }
  return result("R13", title, "pass", "The upload arrived without a long delay.");
}

// --- public API ------------------------------------------------------------

/** Run all 13 rules, in order R1..R13, one result each. */
export function runChecks(input: CheckInput, config: CheckConfig = CHECK_CONFIG_V1): CheckResult[] {
  return [
    r1Photos(input, config),
    r2Metadata(input),
    r3Order(input),
    r4Location(input, config),
    r5Duplicate(input),
    r6Moisture(input, config),
    r7Capacity(input),
    r8Rate(input, config),
    r9Training(input),
    r10Registration(input, config),
    r11Methane(input),
    r12Density(input),
    r13SyncDelay(input, config),
  ];
}

/** Most severe result: block > flag > note > pass. An empty list is "pass". */
export function worstResult(results: CheckResult[]): CheckSeverity {
  let worst: CheckSeverity = "pass";
  for (const r of results) {
    if (SEVERITY_RANK[r.result] > SEVERITY_RANK[worst]) worst = r.result;
  }
  return worst;
}

/** Gate for the batch: blocked if any block, needs_review if any flag, else clear. */
export function batchGate(results: CheckResult[]): BatchGate {
  const worst = worstResult(results);
  if (worst === "block") return "blocked";
  if (worst === "flag") return "needs_review";
  return "clear";
}

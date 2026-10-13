import type { BatchTonnes, TrancheSplit } from "./types";

/**
 * Payout maths. All money is integer minor units (paise or cents); a float is
 * never stored as an amount. Rounding happens once per function, as stated.
 */

function requireNonNegativeFinite(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite number of 0 or more (got ${String(value)})`);
  }
}

function requireMinorUnits(name: string, value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative whole number of minor units (got ${String(value)})`);
  }
}

/** Farmer's total payout in minor units: round(credits * price * share). */
export function farmerTotalMinor(
  creditsTonnes: number,
  priceMinorPerTonne: number,
  farmerShare: number,
): number {
  requireNonNegativeFinite("creditsTonnes", creditsTonnes);
  requireNonNegativeFinite("priceMinorPerTonne", priceMinorPerTonne);
  requireNonNegativeFinite("farmerShare", farmerShare);
  const total = Math.round(creditsTonnes * priceMinorPerTonne * farmerShare);
  if (!Number.isSafeInteger(total)) {
    throw new RangeError(`farmer total is too large to hold as whole minor units (got ${String(total)})`);
  }
  return total;
}

/** Split a total into an upfront tranche (floored) and the remainder. t1 + t2 === total. */
export function splitTranches(totalMinor: number, tranche1Share = 0.5): TrancheSplit {
  requireMinorUnits("totalMinor", totalMinor);
  if (!Number.isFinite(tranche1Share) || tranche1Share < 0 || tranche1Share > 1) {
    throw new RangeError(`tranche1Share must be between 0 and 1 (got ${String(tranche1Share)})`);
  }
  const t1 = Math.floor(totalMinor * tranche1Share);
  return { t1, t2: totalMinor - t1 };
}

/** Second tranche once issuance is known: whatever the issued value covers beyond t1, never negative. */
export function tranche2Minor(issuedValueMinor: number, t1: number): number {
  requireMinorUnits("issuedValueMinor", issuedValueMinor);
  requireMinorUnits("t1", t1);
  return Math.max(0, issuedValueMinor - t1);
}

/**
 * Scale each batch's computed tonnes by issued / sum(computed), so the
 * allocation sums to what the registry actually issued. If nothing was
 * computed (sum 0) there is nothing to scale, so every batch gets 0.
 */
export function allocateIssuance(issuedTonnes: number, computed: BatchTonnes[]): BatchTonnes[] {
  requireNonNegativeFinite("issuedTonnes", issuedTonnes);
  for (const batch of computed) {
    requireNonNegativeFinite(`tonnes for batch ${batch.batchId}`, batch.tonnes);
  }
  const sum = computed.reduce((acc, batch) => acc + batch.tonnes, 0);
  const factor = sum > 0 ? issuedTonnes / sum : 0;
  return computed.map((batch) => ({ batchId: batch.batchId, tonnes: batch.tonnes * factor }));
}

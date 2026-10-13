import { ARTISAN_C_SINK_V1 } from "./standard";
import type { CSinkStandard, QuantInput, QuantResult } from "./types";

function requirePositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite number greater than 0 (got ${String(value)})`);
  }
}

function requireNonNegativeIfPresent(name: string, value: number | undefined): void {
  if (value === undefined) return;
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite number of 0 or more when given (got ${String(value)})`);
  }
}

/**
 * Quantify one batch (guideline sections 10, 12, 13, 14 via ARTISAN_C_SINK_V1).
 *
 *   mass      = volume * bulk density
 *   carbon    = mass * carbon fraction
 *   potential = carbon * (1 - transport margin) * 44/12
 *   final     = potential * persistence - T      (never below 0)
 *   T         = transportKgCO2e only when transportKm exceeds the threshold, else 0
 *   range     = final * (1 -/+ density accuracy)
 *   methane   = mass * (CH4 kg per tonne / 1000) * GWP20   (separate, never netted)
 *
 * Nothing is rounded here. Round once, at lot level, when a total is reported.
 */
export function quantify(input: QuantInput, std: CSinkStandard = ARTISAN_C_SINK_V1): QuantResult {
  requirePositive("volumeL", input.volumeL);
  requirePositive("bulkDensityKgPerL", input.bulkDensityKgPerL);
  requirePositive("carbonFraction", input.carbonFraction);
  if (input.carbonFraction > 1) {
    throw new RangeError(`carbonFraction must be at most 1 (got ${String(input.carbonFraction)})`);
  }
  requireNonNegativeIfPresent("transportKm", input.transportKm);
  requireNonNegativeIfPresent("transportKgCO2e", input.transportKgCO2e);

  const k = std.constants;
  const massKg = input.volumeL * input.bulkDensityKgPerL;
  const carbonKg = massKg * input.carbonFraction;
  const potentialKgCO2e = carbonKg * (1 - k.transportMargin) * k.co2PerCarbon;

  const transportApplies = input.transportKm !== undefined && input.transportKm > k.transportThresholdKm;
  const transportKgCO2e = transportApplies ? (input.transportKgCO2e ?? 0) : 0;

  const finalKgCO2e = Math.max(0, potentialKgCO2e * k.persistence100y - transportKgCO2e);
  const methaneKgCO2e = massKg * (k.ch4KgPerTonneBiochar / 1000) * k.gwp20ch4;

  // Copy only the known input fields so the result carries no stray properties.
  const inputs: QuantInput = {
    volumeL: input.volumeL,
    bulkDensityKgPerL: input.bulkDensityKgPerL,
    carbonFraction: input.carbonFraction,
  };
  if (input.transportKm !== undefined) inputs.transportKm = input.transportKm;
  if (input.transportKgCO2e !== undefined) inputs.transportKgCO2e = input.transportKgCO2e;

  return {
    massKg,
    carbonKg,
    potentialKgCO2e,
    finalKgCO2e,
    finalLowKgCO2e: finalKgCO2e * (1 - k.densityAccuracy),
    finalHighKgCO2e: finalKgCO2e * (1 + k.densityAccuracy),
    methaneKgCO2e,
    standardId: std.id,
    standardVersion: std.version,
    constants: { ...k },
    inputs,
  };
}

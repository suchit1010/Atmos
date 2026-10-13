import type { ProgrammeConfig } from "./types";

/**
 * Demo programme assumptions. These are placeholders for the hackathon build:
 * the price is not a market price and the split is not an agreed term.
 */
export const DEMO_PROGRAMME: ProgrammeConfig = Object.freeze({
  id: "atmos-demo-programme",
  priceMinorPerTonne: 14_000,
  farmerShare: 0.4,
  tranche1Share: 0.5,
  requiresMethaneCompensation: false,
});

export const PAYOUT_UNIT = "ATMOS-TEST (Solana devnet test token, 2 decimals; not money)";

export const DISCLOSURES: readonly string[] = Object.freeze([
  "Atmos does not mint, issue or sell carbon credits.",
  "The quantity is an estimate using the Artisan C-Sink v1.0 constants as configured in Atmos. Those constants must be checked against the guideline before real use.",
  "Feedstock density and carbon fraction are demo values from the guideline's worked example.",
  "Photo times and locations are reported by the producer's app and are not independently attested.",
  "Training status is simulated in this demo.",
  "Payouts in this build are Solana devnet test tokens, not money.",
]);

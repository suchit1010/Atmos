import type { CSinkStandard, FeedstockEntry } from "./types";

/**
 * Global Artisan C-Sink guideline, version 1.0.
 *
 * These constants come from sections 10, 12, 13 and 14 of the guideline as
 * read through a text extractor. They MUST be checked against the PDF before
 * any real use.
 *
 * Every threshold the engine uses lives here (or in CHECK_CONFIG_V1), never
 * inline in a formula.
 */
export const ARTISAN_C_SINK_V1: CSinkStandard = Object.freeze({
  id: "artisan-c-sink",
  version: "1.0",
  constants: Object.freeze({
    transportMargin: 0.03,
    co2PerCarbon: 44 / 12,
    persistence100y: 0.74,
    ch4KgPerTonneBiochar: 30,
    gwp20ch4: 86,
    densityAccuracy: 0.2,
    transportThresholdKm: 100,
  }),
});

const DEMO_SOURCE =
  "demo value from the guideline's worked example; the standard requires the Ithaka database or a lab result";

export type DemoFeedstockId = "mixed-crop-residue" | "woody-residue";

/**
 * Demo feedstock values. Only the two worked-example rows from the guideline
 * are present; no other agronomic numbers are invented here.
 */
export const DEMO_FEEDSTOCK_TABLE: Readonly<Record<DemoFeedstockId, FeedstockEntry>> =
  Object.freeze({
    "mixed-crop-residue": Object.freeze({
      bulkDensityKgPerL: 0.2,
      carbonFraction: 0.62,
      source: DEMO_SOURCE,
    }),
    "woody-residue": Object.freeze({
      bulkDensityKgPerL: 0.1902,
      carbonFraction: 0.75,
      source: DEMO_SOURCE,
    }),
  });

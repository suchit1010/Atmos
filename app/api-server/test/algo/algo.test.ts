import { describe, expect, it } from "vitest";
import {
  ARTISAN_C_SINK_V1,
  CHECK_CONFIG_V1,
  DEMO_FEEDSTOCK_TABLE,
  allocateIssuance,
  batchGate,
  distanceMeters,
  farmerTotalMinor,
  quantify,
  runChecks,
  splitTranches,
  tranche2Minor,
  worstResult,
} from "../../src/lib/algo";
import type { CheckInput, CheckResult, CheckSeverity } from "../../src/lib/algo";

/** Seeded linear congruential generator (Numerical Recipes constants). No Math.random. */
function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

// ---------------------------------------------------------------------------
// standard
// ---------------------------------------------------------------------------

describe("standard", () => {
  it("pins the Artisan C-Sink v1.0 constants", () => {
    expect(ARTISAN_C_SINK_V1.id).toBe("artisan-c-sink");
    expect(ARTISAN_C_SINK_V1.version).toBe("1.0");
    expect(ARTISAN_C_SINK_V1.constants).toEqual({
      transportMargin: 0.03,
      co2PerCarbon: 44 / 12,
      persistence100y: 0.74,
      ch4KgPerTonneBiochar: 30,
      gwp20ch4: 86,
      densityAccuracy: 0.2,
      transportThresholdKm: 100,
    });
  });

  it("holds only the two demo feedstocks, each labelled as a demo value", () => {
    expect(Object.keys(DEMO_FEEDSTOCK_TABLE)).toEqual(["mixed-crop-residue", "woody-residue"]);
    expect(DEMO_FEEDSTOCK_TABLE["mixed-crop-residue"]).toMatchObject({ bulkDensityKgPerL: 0.2, carbonFraction: 0.62 });
    expect(DEMO_FEEDSTOCK_TABLE["woody-residue"]).toMatchObject({ bulkDensityKgPerL: 0.1902, carbonFraction: 0.75 });
    for (const entry of Object.values(DEMO_FEEDSTOCK_TABLE)) {
      expect(entry.source).toBe(
        "demo value from the guideline's worked example; the standard requires the Ithaka database or a lab result",
      );
    }
  });
});

// ---------------------------------------------------------------------------
// quantify
// ---------------------------------------------------------------------------

describe("quantify: guideline vectors", () => {
  it("(a) 320 L of mixed crop residue", () => {
    const q = quantify({ volumeL: 320, bulkDensityKgPerL: 0.2, carbonFraction: 0.62 });
    expect(q.massKg).toBeCloseTo(64.0, 9);
    expect(q.carbonKg).toBeCloseTo(39.68, 9);
    expect(q.potentialKgCO2e).toBeCloseTo(141.13, 2);
    expect(q.finalKgCO2e).toBeCloseTo(104.44, 2);
    expect(q.finalLowKgCO2e).toBeCloseTo(83.5, 1);
    expect(q.finalHighKgCO2e).toBeCloseTo(125.3, 1);
    expect(q.methaneKgCO2e).toBeCloseTo(165.1, 1);
    expect(q.standardId).toBe("artisan-c-sink");
    expect(q.standardVersion).toBe("1.0");
  });

  it("(b) 820 L load weighing 156 kg", () => {
    const q = quantify({ volumeL: 820, bulkDensityKgPerL: 156 / 820, carbonFraction: 0.75 });
    expect(q.massKg).toBeCloseTo(156.0, 9);
    expect(q.carbonKg).toBeCloseTo(117.0, 9);
    expect(q.potentialKgCO2e).toBeCloseTo(416.13, 2);
    expect(q.finalKgCO2e).toBeCloseTo(307.94, 2);
    expect(q.methaneKgCO2e).toBeCloseTo(402.5, 1);
  });

  it("(c) 1000 L at density 1 and carbon 0.75", () => {
    const q = quantify({ volumeL: 1000, bulkDensityKgPerL: 1, carbonFraction: 0.75 });
    expect(q.carbonKg).toBeCloseTo(750, 9);
    expect(q.potentialKgCO2e).toBeCloseTo(2667.5, 2); // spec rounds to 2,668
    expect(q.finalKgCO2e).toBeCloseTo(1973.95, 2); // spec rounds to 1,974
    expect(q.methaneKgCO2e).toBeCloseTo(2580, 9);
  });

  it("works with the demo feedstock table", () => {
    const row = DEMO_FEEDSTOCK_TABLE["mixed-crop-residue"];
    const q = quantify({ volumeL: 320, bulkDensityKgPerL: row.bulkDensityKgPerL, carbonFraction: row.carbonFraction });
    expect(q.finalKgCO2e).toBeCloseTo(104.44, 2);
  });
});

describe("quantify: properties", () => {
  const base = { volumeL: 320, bulkDensityKgPerL: 0.2, carbonFraction: 0.62 };

  it("is deterministic: two calls serialise identically", () => {
    const input = { ...base, transportKm: 150, transportKgCO2e: 12.5 };
    expect(JSON.stringify(quantify(input))).toBe(JSON.stringify(quantify(input)));
  });

  it("never lowers final when volume, density or carbon rises", () => {
    const rand = lcg(42);
    for (let i = 0; i < 500; i++) {
      const v = 1 + rand() * 5000;
      const rho = 0.05 + rand() * 0.9;
      const c = 0.05 + rand() * 0.95;
      const transport = { transportKm: 150, transportKgCO2e: rand() * 200 };
      const before = quantify({ volumeL: v, bulkDensityKgPerL: rho, carbonFraction: c, ...transport }).finalKgCO2e;
      const moreV = quantify({ volumeL: v * 1.1, bulkDensityKgPerL: rho, carbonFraction: c, ...transport }).finalKgCO2e;
      const moreRho = quantify({ volumeL: v, bulkDensityKgPerL: rho * 1.1, carbonFraction: c, ...transport }).finalKgCO2e;
      const moreC = quantify({ volumeL: v, bulkDensityKgPerL: rho, carbonFraction: Math.min(1, c * 1.1), ...transport }).finalKgCO2e;
      expect(moreV).toBeGreaterThanOrEqual(before);
      expect(moreRho).toBeGreaterThanOrEqual(before);
      expect(moreC).toBeGreaterThanOrEqual(before);
    }
  });

  it("subtracts transport only above 100 km", () => {
    const none = quantify(base).finalKgCO2e;
    expect(quantify({ ...base, transportKm: 50, transportKgCO2e: 20 }).finalKgCO2e).toBe(none);
    expect(quantify({ ...base, transportKm: 100, transportKgCO2e: 20 }).finalKgCO2e).toBe(none);
    expect(quantify({ ...base, transportKm: 100.01, transportKgCO2e: 20 }).finalKgCO2e).toBeCloseTo(none - 20, 9);
    expect(quantify({ ...base, transportKm: 500 }).finalKgCO2e).toBe(none); // no emissions figure given
  });

  it("never lets final go below zero", () => {
    const q = quantify({ ...base, transportKm: 500, transportKgCO2e: 1e6 });
    expect(q.finalKgCO2e).toBe(0);
    expect(q.finalLowKgCO2e).toBe(0);
    expect(q.finalHighKgCO2e).toBe(0);
  });

  it("keeps methane separate: it is not netted against final", () => {
    const q = quantify(base);
    expect(q.methaneKgCO2e).toBeGreaterThan(0);
    expect(q.finalKgCO2e).toBeCloseTo(q.potentialKgCO2e * 0.74, 9);
  });

  it("rounds once at lot level: summing full-precision batches keeps the cents", () => {
    let lot = 0;
    for (let i = 0; i < 10; i++) lot += 104.435;
    expect(lot).toBeCloseTo(1044.35, 9);
    expect(lot).not.toBeCloseTo(1000, 0);

    // The same holds for real quantify output.
    const perBatch = quantify(base).finalKgCO2e;
    let lotFromEngine = 0;
    for (let i = 0; i < 10; i++) lotFromEngine += perBatch;
    expect(lotFromEngine).toBeCloseTo(perBatch * 10, 9);
    expect(lotFromEngine).toBeCloseTo(1044.35, 2);
  });

  it("returns copies of the constants and inputs", () => {
    const input = { ...base, transportKm: 150, transportKgCO2e: 5 };
    const q = quantify(input);
    expect(q.inputs).toEqual(input);
    expect(q.inputs).not.toBe(input);
    expect(q.constants).toEqual(ARTISAN_C_SINK_V1.constants);
    expect(q.constants).not.toBe(ARTISAN_C_SINK_V1.constants);
  });

  it("accepts a different standard object", () => {
    const stricter = {
      id: "test-standard",
      version: "9.9",
      constants: { ...ARTISAN_C_SINK_V1.constants, persistence100y: 0.5 },
    };
    const q = quantify(base, stricter);
    expect(q.standardId).toBe("test-standard");
    expect(q.finalKgCO2e).toBeCloseTo(q.potentialKgCO2e * 0.5, 9);
  });

  it("throws RangeError on invalid inputs", () => {
    const bad: Array<Partial<Record<string, number>>> = [
      { volumeL: 0 },
      { volumeL: -1 },
      { volumeL: Number.NaN },
      { volumeL: Number.POSITIVE_INFINITY },
      { bulkDensityKgPerL: 0 },
      { bulkDensityKgPerL: -0.2 },
      { carbonFraction: 0 },
      { carbonFraction: 1.01 },
      { carbonFraction: Number.NaN },
      { transportKm: -1 },
      { transportKgCO2e: Number.NaN },
      { transportKgCO2e: -5 },
    ];
    for (const override of bad) {
      expect(() => quantify({ ...base, ...override })).toThrow(RangeError);
    }
    expect(() => quantify({ ...base, volumeL: 0 })).toThrow(/volumeL/);
    expect(() => quantify({ ...base, carbonFraction: 1 })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// tranches
// ---------------------------------------------------------------------------

describe("tranches", () => {
  it("splits odd totals with the extra unit in tranche 2", () => {
    expect(splitTranches(1725)).toEqual({ t1: 862, t2: 863 });
    expect(splitTranches(585)).toEqual({ t1: 292, t2: 293 });
    expect(splitTranches(1001)).toEqual({ t1: 500, t2: 501 });
    expect(splitTranches(0)).toEqual({ t1: 0, t2: 0 });
    expect(splitTranches(1000, 0)).toEqual({ t1: 0, t2: 1000 });
    expect(splitTranches(1000, 1)).toEqual({ t1: 1000, t2: 0 });
  });

  it("keeps t1 + t2 === total for 1000 seeded totals", () => {
    const rand = lcg(2024);
    for (let i = 0; i < 1000; i++) {
      const total = Math.floor(rand() * 10_000_000);
      const share = i % 3 === 0 ? 0.5 : rand();
      const { t1, t2 } = splitTranches(total, share);
      expect(t1 + t2).toBe(total);
      expect(Number.isSafeInteger(t1)).toBe(true);
      expect(t1).toBeGreaterThanOrEqual(0);
      expect(t2).toBeGreaterThanOrEqual(0);
    }
  });

  it("pays the guideline's 320 L batch 585 and the 820 L load 1724 (price 14000/t, share 0.4)", () => {
    const batch = quantify({ volumeL: 320, bulkDensityKgPerL: 0.2, carbonFraction: 0.62 });
    expect(farmerTotalMinor(batch.finalKgCO2e / 1000, 14000, 0.4)).toBe(585);
    const load = quantify({ volumeL: 820, bulkDensityKgPerL: 156 / 820, carbonFraction: 0.75 });
    expect(farmerTotalMinor(load.finalKgCO2e / 1000, 14000, 0.4)).toBe(1724);
  });

  it("farmerTotalMinor returns whole minor units and validates", () => {
    expect(farmerTotalMinor(0, 14000, 0.4)).toBe(0);
    expect(Number.isInteger(farmerTotalMinor(0.123456, 14000, 0.4))).toBe(true);
    expect(() => farmerTotalMinor(-1, 14000, 0.4)).toThrow(RangeError);
    expect(() => farmerTotalMinor(1, Number.NaN, 0.4)).toThrow(RangeError);
    expect(() => farmerTotalMinor(1, 14000, Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => farmerTotalMinor(1e300, 1e300, 1)).toThrow(RangeError);
    expect(() => farmerTotalMinor(Number.MAX_SAFE_INTEGER, 100, 1)).toThrow(RangeError);
  });

  it("splitTranches validates", () => {
    expect(() => splitTranches(-1)).toThrow(RangeError);
    expect(() => splitTranches(1.5)).toThrow(RangeError);
    expect(() => splitTranches(Number.NaN)).toThrow(RangeError);
    expect(() => splitTranches(2 ** 53)).toThrow(RangeError);
    expect(() => splitTranches(100, -0.1)).toThrow(RangeError);
    expect(() => splitTranches(100, 1.1)).toThrow(RangeError);
    expect(() => splitTranches(100, Number.NaN)).toThrow(RangeError);
  });

  it("tranche2Minor pays what issuance covers beyond t1, never negative", () => {
    expect(tranche2Minor(1000, 400)).toBe(600);
    expect(tranche2Minor(400, 400)).toBe(0);
    expect(tranche2Minor(300, 400)).toBe(0);
    expect(() => tranche2Minor(10.5, 4)).toThrow(RangeError);
    expect(() => tranche2Minor(10, -4)).toThrow(RangeError);
  });

  it("allocateIssuance scales every batch by issued / computed sum", () => {
    const computed = [
      { batchId: "b1", tonnes: 0.104435 },
      { batchId: "b2", tonnes: 0.30794 },
      { batchId: "b3", tonnes: 0.632 },
    ];
    const sum = computed.reduce((acc, b) => acc + b.tonnes, 0);
    const issued = sum - 0.00435;
    const out = allocateIssuance(issued, computed);
    const factor = issued / sum;
    expect(out.map((b) => b.batchId)).toEqual(["b1", "b2", "b3"]);
    out.forEach((b, i) => expect(b.tonnes).toBeCloseTo(computed[i].tonnes * factor, 9));
    expect(out.reduce((acc, b) => acc + b.tonnes, 0)).toBeCloseTo(issued, 9);
  });

  it("allocateIssuance: 1040 issued against 1044.35 computed", () => {
    const computed = Array.from({ length: 10 }, (_, i) => ({ batchId: `b${i}`, tonnes: 104.435 }));
    const out = allocateIssuance(1040, computed);
    for (const b of out) expect(b.tonnes).toBeCloseTo((104.435 * 1040) / 1044.35, 9);
    expect(out.reduce((acc, b) => acc + b.tonnes, 0)).toBeCloseTo(1040, 9);
    // Input is not mutated.
    expect(computed[0].tonnes).toBe(104.435);
  });

  it("allocateIssuance guards a zero sum and bad input", () => {
    expect(allocateIssuance(5, [{ batchId: "a", tonnes: 0 }])).toEqual([{ batchId: "a", tonnes: 0 }]);
    expect(allocateIssuance(5, [])).toEqual([]);
    expect(() => allocateIssuance(-1, [])).toThrow(RangeError);
    expect(() => allocateIssuance(1, [{ batchId: "a", tonnes: -1 }])).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// haversine
// ---------------------------------------------------------------------------

describe("distanceMeters", () => {
  it("is 0 for identical points", () => {
    expect(distanceMeters({ lat: 20.5, lng: 78.9 }, { lat: 20.5, lng: 78.9 })).toBe(0);
  });

  it("is about 111.2 m for 0.001 degrees of latitude", () => {
    const d = distanceMeters({ lat: 20, lng: 78 }, { lat: 20.001, lng: 78 });
    expect(Math.abs(d - 111.2)).toBeLessThan(0.5);
  });

  it("is symmetric", () => {
    const a = { lat: 12.97, lng: 77.59 };
    const b = { lat: 28.61, lng: 77.21 };
    expect(distanceMeters(a, b)).toBe(distanceMeters(b, a));
  });
});

// ---------------------------------------------------------------------------
// checks
// ---------------------------------------------------------------------------

const SHA_MID = "a".repeat(64);
const SHA_END = "b".repeat(64);

function cleanInput(): CheckInput {
  return {
    batchStartedAt: "2026-03-10T06:00:00Z",
    submittedAt: "2026-03-10T16:00:00Z",
    receivedAt: "2026-03-10T16:05:00Z",
    photos: [
      { kind: "mid", capturedAt: "2026-03-10T09:00:00Z", lat: 20.0, lng: 78.0, sha256: SHA_MID },
      { kind: "end", capturedAt: "2026-03-10T14:00:00Z", lat: 20.0, lng: 78.0, sha256: SHA_END },
    ],
    farm: { point: { lat: 20.0001, lng: 78.0001 }, areaHectares: 0.8, polygonOnFile: false },
    moisturePct: 18,
    volumeL: 320,
    kilnVolumeL: 400,
    batchesTodayForKiln: 1,
    trainingComplete: true,
    methaneCompensationOnFile: true,
    programmeRequiresCompensation: false,
    densitySource: "database",
    otherBatchPhotoHashes: [],
  };
}

const RULE_IDS = ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9", "R10", "R11", "R12", "R13"];

function byId(results: CheckResult[], id: string): CheckResult {
  const found = results.find((r) => r.id === id);
  if (!found) throw new Error(`missing result ${id}`);
  return found;
}

/**
 * Apply one mutation, then assert: the target rule has the expected severity
 * (different from the clean baseline), and the other 12 rules keep the same id,
 * title and severity as the baseline. Their reason text may be reworded when the
 * evidence it describes is gone (for example R3 once a photo is missing).
 */
function expectOnlyRuleChanges(
  mutate: (input: CheckInput) => void,
  ruleId: string,
  severity: CheckSeverity,
): CheckResult {
  const baseline = runChecks(cleanInput());
  const input = cleanInput();
  mutate(input);
  const results = runChecks(input);
  expect(results).toHaveLength(13);
  expect(results.map((r) => r.id)).toEqual(RULE_IDS);
  expect(byId(results, ruleId).result).toBe(severity);
  expect(byId(results, ruleId).result).not.toBe(byId(baseline, ruleId).result);
  for (const id of RULE_IDS.filter((x) => x !== ruleId)) {
    const before = byId(baseline, id);
    const after = byId(results, id);
    expect({ id: after.id, title: after.title, result: after.result }).toEqual({
      id: before.id,
      title: before.title,
      result: before.result,
    });
  }
  return byId(results, ruleId);
}

describe("checks: clean fixture and helpers", () => {
  it("a fully clean batch gives 13 passes and a clear gate", () => {
    const results = runChecks(cleanInput());
    expect(results).toHaveLength(13);
    expect(results.map((r) => r.id)).toEqual(RULE_IDS);
    expect(results.every((r) => r.result === "pass")).toBe(true);
    expect(worstResult(results)).toBe("pass");
    expect(batchGate(results)).toBe("clear");
  });

  it("exposes the v1 config", () => {
    expect(CHECK_CONFIG_V1).toEqual({
      version: "1.0",
      minPhotos: 2,
      farmRadiusMeters: 250,
      moistureBlockPct: 30,
      maxBatchesPerKilnPerDay: 2,
      syncDelayNoteDays: 14,
      polygonRequiredHectares: 1,
    });
  });

  it("honours a custom config", () => {
    const strict = { ...CHECK_CONFIG_V1, minPhotos: 3 };
    expect(byId(runChecks(cleanInput(), strict), "R1").result).toBe("block");
    const loose = { ...CHECK_CONFIG_V1, moistureBlockPct: 50 };
    const input = cleanInput();
    input.moisturePct = 40;
    expect(byId(runChecks(input, loose), "R6").result).toBe("pass");
    expect(byId(runChecks(input), "R6").result).toBe("block");
  });

  it("worstResult orders block > flag > note > pass", () => {
    const mk = (result: CheckSeverity): CheckResult => ({ id: "X", title: "t", result, reason: "r" });
    expect(worstResult([])).toBe("pass");
    expect(worstResult([mk("pass"), mk("note")])).toBe("note");
    expect(worstResult([mk("note"), mk("flag"), mk("pass")])).toBe("flag");
    expect(worstResult([mk("flag"), mk("block"), mk("note")])).toBe("block");
  });

  it("batchGate maps severities to a gate", () => {
    const mk = (result: CheckSeverity): CheckResult => ({ id: "X", title: "t", result, reason: "r" });
    expect(batchGate([mk("pass"), mk("note")])).toBe("clear");
    expect(batchGate([mk("note"), mk("flag")])).toBe("needs_review");
    expect(batchGate([mk("flag"), mk("block")])).toBe("blocked");
  });

  it("is deterministic and does not mutate its input", () => {
    const input = cleanInput();
    const snapshot = JSON.stringify(input);
    const a = JSON.stringify(runChecks(input));
    const b = JSON.stringify(runChecks(input));
    expect(a).toBe(b);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it("only ever adds scrutiny: results carry no numeric or credit field", () => {
    const worst = cleanInput();
    worst.photos = [];
    worst.moisturePct = 55;
    worst.trainingComplete = false;
    worst.batchesTodayForKiln = 9;
    for (const input of [cleanInput(), worst]) {
      for (const r of runChecks(input)) {
        expect(Object.keys(r).sort()).toEqual(["id", "reason", "result", "title"]);
        for (const [key, value] of Object.entries(r)) {
          expect(typeof value).toBe("string");
          expect(key).not.toMatch(/credit|tonne|kg|co2|amount|price/i);
        }
      }
    }
  });

  it("keeps every reason to 140 characters or fewer, including worst-case numbers", () => {
    const bad = cleanInput();
    bad.photos = [{ kind: "mid", capturedAt: "garbage", sha256: SHA_MID }];
    bad.farm = { point: { lat: 20, lng: 78 }, areaHectares: 123456.789, polygonOnFile: false };
    bad.moisturePct = 99.999;
    bad.volumeL = 123456789;
    bad.kilnVolumeL = 1;
    bad.batchesTodayForKiln = 123456;
    bad.densitySource = "manual";
    bad.receivedAt = "2030-01-01T00:00:00Z";
    const far = cleanInput();
    far.photos = [
      { kind: "mid", capturedAt: "2026-03-10T09:00:00Z", lat: -80, lng: 170, sha256: SHA_MID },
      { kind: "end", capturedAt: "2026-03-10T14:00:00Z", lat: 20, lng: 78, sha256: SHA_END },
    ];
    far.otherBatchPhotoHashes = [SHA_MID, SHA_END];
    far.receivedAt = "2030-01-01T00:00:00Z";
    for (const input of [cleanInput(), bad, far]) {
      for (const r of runChecks(input)) {
        expect(r.reason.length).toBeGreaterThan(0);
        expect(r.reason.length).toBeLessThanOrEqual(140);
        expect(r.title.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("checks: one rule at a time", () => {
  it("R1 blocks when there are too few photos", () => {
    expectOnlyRuleChanges((i) => { i.photos = [i.photos[0]]; }, "R1", "block");
  });

  it("R1 blocks when the mid photo is missing", () => {
    expectOnlyRuleChanges((i) => { i.photos = [i.photos[1], { ...i.photos[1], sha256: "c".repeat(64) }]; }, "R1", "block");
  });

  it("R1 blocks when the end photo is missing", () => {
    expectOnlyRuleChanges((i) => { i.photos = [i.photos[0], { ...i.photos[0], sha256: "c".repeat(64) }]; }, "R1", "block");
  });

  it("R2 blocks when a photo has no capture time", () => {
    expectOnlyRuleChanges((i) => { i.photos = [{ kind: "mid", lat: 20, lng: 78, sha256: SHA_MID }, i.photos[1]]; }, "R2", "block");
  });

  it("R2 blocks when a photo has no location", () => {
    expectOnlyRuleChanges(
      (i) => { i.photos = [i.photos[0], { kind: "end", capturedAt: "2026-03-10T14:00:00Z", sha256: SHA_END }]; },
      "R2",
      "block",
    );
  });

  it("R2 flags a photo taken before the batch started", () => {
    expectOnlyRuleChanges((i) => { i.photos[0] = { ...i.photos[0], capturedAt: "2026-03-10T05:59:59Z" }; }, "R2", "flag");
  });

  it("R2 flags a photo taken after submission", () => {
    expectOnlyRuleChanges((i) => { i.photos[1] = { ...i.photos[1], capturedAt: "2026-03-10T16:00:01Z" }; }, "R2", "flag");
  });

  it("R2 accepts photos exactly at the window edges", () => {
    const input = cleanInput();
    input.photos[0] = { ...input.photos[0], capturedAt: input.batchStartedAt };
    input.photos[1] = { ...input.photos[1], capturedAt: input.submittedAt };
    expect(byId(runChecks(input), "R2").result).toBe("pass");
  });

  it("R2 treats a time with no zone as unreadable (no local-time guessing)", () => {
    expectOnlyRuleChanges((i) => { i.photos[0] = { ...i.photos[0], capturedAt: "2026-03-10T09:00:00" }; }, "R2", "block");
  });

  it("R3 flags an end photo that is not after the mid photo", () => {
    expectOnlyRuleChanges(
      (i) => { i.photos = [{ ...i.photos[0], capturedAt: "2026-03-10T15:00:00Z" }, i.photos[1]]; },
      "R3",
      "flag",
    );
  });

  it("R3 flags equal times and passes when a time is missing", () => {
    const equal = cleanInput();
    equal.photos[1] = { ...equal.photos[1], capturedAt: equal.photos[0].capturedAt };
    expect(byId(runChecks(equal), "R3").result).toBe("flag");
    const unknown = cleanInput();
    delete unknown.photos[1].capturedAt;
    expect(byId(runChecks(unknown), "R3").result).toBe("pass");
  });

  it("R4 flags a photo more than 250 m from the farm", () => {
    const r = expectOnlyRuleChanges((i) => { i.photos[1] = { ...i.photos[1], lat: 20.01 }; }, "R4", "flag");
    expect(r.reason).toMatch(/250 m/);
  });

  it("R4 passes with a reason when there is no farm point (R10 handles it)", () => {
    const input = cleanInput();
    delete input.farm.point;
    const results = runChecks(input);
    expect(byId(results, "R4")).toMatchObject({ result: "pass", reason: "no farm point on file" });
    expect(byId(results, "R10").result).toBe("block");
  });

  it("R4 passes at 249 m and flags at 251 m", () => {
    // 0.001 degree of latitude is about 111.2 m, so 249 m is about 0.002239 degrees.
    const near = cleanInput();
    near.farm.point = { lat: 20, lng: 78 };
    near.photos[0] = { ...near.photos[0], lat: 20 + 249 / 111195, lng: 78 };
    expect(byId(runChecks(near), "R4").result).toBe("pass");
    const far = cleanInput();
    far.farm.point = { lat: 20, lng: 78 };
    far.photos[0] = { ...far.photos[0], lat: 20 + 251 / 111195, lng: 78 };
    expect(byId(runChecks(far), "R4").result).toBe("flag");
  });

  it("R5 flags a photo already used in another batch", () => {
    expectOnlyRuleChanges((i) => { i.otherBatchPhotoHashes = ["f".repeat(64), SHA_END.toUpperCase()]; }, "R5", "flag");
  });

  it("R6 blocks at exactly 30 percent and passes at 29.9", () => {
    expectOnlyRuleChanges((i) => { i.moisturePct = 30; }, "R6", "block");
    const input = cleanInput();
    input.moisturePct = 29.9;
    expect(byId(runChecks(input), "R6").result).toBe("pass");
    input.moisturePct = 30.1;
    expect(byId(runChecks(input), "R6").result).toBe("block");
  });

  it("R6 blocks with no reading and no passed touch test", () => {
    const r = expectOnlyRuleChanges((i) => { delete i.moisturePct; }, "R6", "block");
    expect(r.reason).toBe("no moisture reading and touch test not passed");
    const failed = cleanInput();
    delete failed.moisturePct;
    failed.touchTestPassed = false;
    expect(byId(runChecks(failed), "R6").result).toBe("block");
  });

  it("R6 passes with no reading when the touch test passed", () => {
    const input = cleanInput();
    delete input.moisturePct;
    input.touchTestPassed = true;
    expect(byId(runChecks(input), "R6").result).toBe("pass");
  });

  it("R7 flags a batch larger than the kiln", () => {
    expectOnlyRuleChanges((i) => { i.volumeL = 401; }, "R7", "flag");
  });

  it("R7 passes at exactly the kiln volume and when the kiln size is unknown", () => {
    const exact = cleanInput();
    exact.volumeL = 400;
    expect(byId(runChecks(exact), "R7").result).toBe("pass");
    const unknown = cleanInput();
    delete unknown.kilnVolumeL;
    unknown.volumeL = 5000;
    expect(byId(runChecks(unknown), "R7").result).toBe("pass");
  });

  it("R8 flags a third batch on the same kiln in a day", () => {
    expectOnlyRuleChanges((i) => { i.batchesTodayForKiln = 3; }, "R8", "flag");
    const two = cleanInput();
    two.batchesTodayForKiln = 2;
    expect(byId(runChecks(two), "R8").result).toBe("pass");
  });

  it("R9 blocks when training is incomplete", () => {
    expectOnlyRuleChanges((i) => { i.trainingComplete = false; }, "R9", "block");
  });

  it("R10 blocks when there is no farm point", () => {
    expectOnlyRuleChanges((i) => { delete i.farm.point; }, "R10", "block");
  });

  it("R10 blocks a farm over 1 ha with no boundary map", () => {
    expectOnlyRuleChanges((i) => { i.farm.areaHectares = 1.5; }, "R10", "block");
  });

  it("R10 passes at exactly 1 ha, or over 1 ha with a boundary map on file", () => {
    const exact = cleanInput();
    exact.farm.areaHectares = 1;
    expect(byId(runChecks(exact), "R10").result).toBe("pass");
    const mapped = cleanInput();
    mapped.farm.areaHectares = 5;
    mapped.farm.polygonOnFile = true;
    expect(byId(runChecks(mapped), "R10").result).toBe("pass");
    const unknownArea = cleanInput();
    delete unknownArea.farm.areaHectares;
    expect(byId(runChecks(unknownArea), "R10").result).toBe("pass");
  });

  it("R11 notes missing compensation when the programme does not require it", () => {
    expectOnlyRuleChanges((i) => { i.methaneCompensationOnFile = false; }, "R11", "note");
  });

  it("R11 flags missing compensation when the programme requires it", () => {
    const input = cleanInput();
    input.methaneCompensationOnFile = false;
    input.programmeRequiresCompensation = true;
    expect(byId(runChecks(input), "R11").result).toBe("flag");
    input.methaneCompensationOnFile = true;
    expect(byId(runChecks(input), "R11").result).toBe("pass");
  });

  it("R12 flags a missing density", () => {
    expectOnlyRuleChanges((i) => { i.densitySource = "missing"; }, "R12", "flag");
  });

  it("R12 flags a manual density with no reason, and passes with one", () => {
    expectOnlyRuleChanges((i) => { i.densitySource = "manual"; }, "R12", "flag");
    const withReason = cleanInput();
    withReason.densitySource = "manual";
    withReason.densityOverrideReason = "Weighed on the village scale";
    expect(byId(runChecks(withReason), "R12").result).toBe("pass");
    const lab = cleanInput();
    lab.densitySource = "lab";
    expect(byId(runChecks(lab), "R12").result).toBe("pass");
  });

  it("R13 notes an upload more than 14 days after the last photo", () => {
    expectOnlyRuleChanges((i) => { i.receivedAt = "2026-03-26T16:05:00Z"; }, "R13", "note");
  });

  it("R13 passes at exactly 14 days and falls back to batch start with no photo times", () => {
    const exact = cleanInput();
    exact.receivedAt = "2026-03-24T14:00:00Z";
    expect(byId(runChecks(exact), "R13").result).toBe("pass");
    const justOver = cleanInput();
    justOver.receivedAt = "2026-03-24T14:00:01Z";
    expect(byId(runChecks(justOver), "R13").result).toBe("note");

    const noTimes = cleanInput();
    noTimes.photos = noTimes.photos.map((p) => ({ kind: p.kind, lat: p.lat, lng: p.lng, sha256: p.sha256 }));
    noTimes.receivedAt = "2026-03-24T06:00:00Z";
    expect(byId(runChecks(noTimes), "R13").result).toBe("pass");
    noTimes.receivedAt = "2026-03-24T06:00:01Z";
    expect(byId(runChecks(noTimes), "R13").result).toBe("note");
  });
});

describe("checks: gate combinations", () => {
  it("a flag alone needs review; a block wins over flags", () => {
    const flagged = cleanInput();
    flagged.batchesTodayForKiln = 3;
    expect(batchGate(runChecks(flagged))).toBe("needs_review");
    const blocked = cleanInput();
    blocked.batchesTodayForKiln = 3;
    blocked.trainingComplete = false;
    expect(batchGate(runChecks(blocked))).toBe("blocked");
    const noted = cleanInput();
    noted.methaneCompensationOnFile = false;
    expect(batchGate(runChecks(noted))).toBe("clear");
  });
});

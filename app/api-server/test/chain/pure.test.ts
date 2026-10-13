import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildEvidenceMemo,
  buildPayoutMemo,
  canonicalize,
  explorerAddressUrl,
  explorerTxUrl,
  hashManifest,
  parseEvidenceMemo,
  parsePayoutMemo,
} from "../../src/lib/chain";

const HASH = "a".repeat(64);

describe("canonicalize and hashManifest", () => {
  it("does not depend on key order", () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe(canonicalize({ a: 2, b: 1 }));
    expect(canonicalize({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it("handles nested arrays and objects and keeps array order", () => {
    expect(canonicalize({ z: [3, { y: 1, x: 2 }], a: null })).toBe('{"a":null,"z":[3,{"x":2,"y":1}]}');
  });

  it("is stable for Devanagari text and normalises -0", () => {
    expect(canonicalize({ name: "बायोचार", n: -0 })).toBe('{"n":0,"name":"बायोचार"}');
  });

  it("rejects values with no single JSON form", () => {
    expect(() => canonicalize({ a: Number.NaN })).toThrow(TypeError);
    expect(() => canonicalize({ a: Infinity })).toThrow(TypeError);
    expect(() => canonicalize({ a: undefined })).toThrow(TypeError);
    expect(() => canonicalize({ a: new Date() })).toThrow(TypeError);
    expect(() => canonicalize({ a: new Map() })).toThrow(TypeError);
    expect(() => canonicalize({ a: 1n })).toThrow(TypeError);
    expect(() => canonicalize([undefined])).toThrow(TypeError);
  });

  it("hashes the canonical string with SHA-256", () => {
    const expected = createHash("sha256").update('{"a":1,"b":[true,null,"x"]}', "utf8").digest("hex");
    expect(hashManifest({ b: [true, null, "x"], a: 1 })).toBe(expected);
  });

  it("changes when any value changes", () => {
    expect(hashManifest({ volumeL: 320 })).not.toBe(hashManifest({ volumeL: 321 }));
  });
});

describe("memos", () => {
  it("round-trips an evidence memo", () => {
    const memo = buildEvidenceMemo("batch_1", HASH);
    expect(memo).toBe(`ATMOS1|batch_1|${HASH}`);
    expect(parseEvidenceMemo(memo)).toEqual({ batchId: "batch_1", hash: HASH });
  });

  it("rejects malformed and injected input", () => {
    expect(() => buildEvidenceMemo("a|b", HASH)).toThrow();
    expect(() => buildEvidenceMemo("", HASH)).toThrow();
    expect(() => buildEvidenceMemo("ok", "A".repeat(64))).toThrow();
    expect(() => buildEvidenceMemo("ok", "abc")).toThrow();
    expect(parseEvidenceMemo("hello")).toBeNull();
    expect(parseEvidenceMemo(`ATMOS2|b|${HASH}`)).toBeNull();
    expect(parseEvidenceMemo(`ATMOS1|b|${HASH}|extra`)).toBeNull();
    expect(parseEvidenceMemo(`ATMOS1|b|${"A".repeat(64)}`)).toBeNull();
  });

  it("round-trips a payout memo and rejects bad ones", () => {
    const memo = buildPayoutMemo("b1", 2, 863);
    expect(memo).toBe("ATMOS1P|b1|t2|863");
    expect(parsePayoutMemo(memo)).toEqual({ batchId: "b1", tranche: 2, amountMinor: 863 });
    expect(parsePayoutMemo("ATMOS1P|b1|t3|5")).toBeNull();
    expect(parsePayoutMemo("ATMOS1P|b1|t1|0")).toBeNull();
    expect(parsePayoutMemo("ATMOS1P|b1|t1|01")).toBeNull();
    expect(() => buildPayoutMemo("b1", 1, 1.5)).toThrow();
  });

  it("builds explorer links", () => {
    expect(explorerTxUrl("sig", "devnet")).toBe("https://explorer.solana.com/tx/sig?cluster=devnet");
    expect(explorerTxUrl("sig", "mainnet-beta")).toBe("https://explorer.solana.com/tx/sig");
    expect(explorerAddressUrl("addr", "devnet")).toBe("https://explorer.solana.com/address/addr?cluster=devnet");
  });
});

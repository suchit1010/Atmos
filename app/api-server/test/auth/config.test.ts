import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import { loadConfig, ttlToSeconds } from "../../src/config";
import { parseSecretKey } from "../../src/lib/chain";

const STRONG = "x".repeat(40);

describe("loadConfig", () => {
  it("refuses production without JWT_SECRET", () => {
    expect(() => loadConfig({ NODE_ENV: "production" })).toThrow(/JWT_SECRET/);
  });

  it("refuses a short secret in production and never echoes it", () => {
    try {
      loadConfig({ NODE_ENV: "production", JWT_SECRET: "short-secret" });
      expect.unreachable();
    } catch (err) {
      expect(String(err)).toMatch(/JWT_SECRET/);
      expect(String(err)).not.toContain("short-secret");
    }
  });

  it("treats Vercel preview deployments as production", () => {
    expect(() => loadConfig({ VERCEL_ENV: "preview" })).toThrow(/JWT_SECRET/);
  });

  it("works without a secret outside production, with a random one", () => {
    const config = loadConfig({ NODE_ENV: "development" });
    expect(config.isProduction).toBe(false);
    expect(config.jwtSecret).toMatch(/^[0-9a-f]{64}$/);
  });

  it("allows any origin outside production but none in production when the list is empty", () => {
    expect(loadConfig({ NODE_ENV: "test" }).corsOrigins).toEqual([]);
    expect(loadConfig({ NODE_ENV: "production", JWT_SECRET: STRONG, CORS_ORIGINS: "https://a.example, https://b.example" }).corsOrigins).toEqual([
      "https://a.example",
      "https://b.example",
    ]);
  });

  it("refuses mainnet-beta: this build is devnet-only", () => {
    expect(() => loadConfig({ NODE_ENV: "test", SOLANA_CLUSTER: "mainnet-beta" })).toThrow(/devnet/);
  });

  it("validates the token mint and the payer key", () => {
    expect(() => loadConfig({ NODE_ENV: "test", ATMOS_TOKEN_MINT: "not-a-key" })).toThrow(/ATMOS_TOKEN_MINT/);
    expect(() => loadConfig({ NODE_ENV: "test", SOLANA_PAYER_SECRET_KEY: "abc" })).toThrow();
    const kp = Keypair.generate();
    const ok = loadConfig({
      NODE_ENV: "test",
      ATMOS_TOKEN_MINT: kp.publicKey.toBase58(),
      SOLANA_PAYER_SECRET_KEY: bs58.encode(kp.secretKey),
    });
    expect(ok.solana.tokenMint).toBe(kp.publicKey.toBase58());
  });

  it("defaults the rate limiter off in tests and on elsewhere", () => {
    expect(loadConfig({ NODE_ENV: "test" }).rateLimitEnabled).toBe(false);
    expect(loadConfig({ NODE_ENV: "development" }).rateLimitEnabled).toBe(true);
  });

  it("parses ttl strings", () => {
    expect(ttlToSeconds("15m")).toBe(900);
    expect(ttlToSeconds("30d")).toBe(2_592_000);
    expect(() => ttlToSeconds("soon")).toThrow();
  });
});

describe("parseSecretKey", () => {
  const kp = Keypair.generate();

  it("accepts base58 and a JSON array", () => {
    expect(parseSecretKey(bs58.encode(kp.secretKey))).toEqual(kp.secretKey);
    expect(parseSecretKey(JSON.stringify(Array.from(kp.secretKey)))).toEqual(kp.secretKey);
  });

  it("rejects wrong lengths and garbage without echoing the input", () => {
    expect(() => parseSecretKey(JSON.stringify([1, 2, 3]))).toThrow(/64 bytes/);
    expect(() => parseSecretKey("0OIl+/")).toThrow();
    expect(() => parseSecretKey("[1,2,\"x\"]")).toThrow();
  });
});

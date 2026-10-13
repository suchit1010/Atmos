import crypto from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { parseSecretKey } from "./lib/chain/keys";

export interface AppConfig {
  /** True for production and for Vercel preview deployments: both are public. */
  isProduction: boolean;
  jwtSecret: string;
  accessTtlSeconds: number;
  refreshTtlSeconds: number;
  corsOrigins: string[];
  databaseUrl?: string;
  solana: {
    rpcUrl: string;
    cluster: "devnet" | "localnet";
    payerSecretKey?: string;
    tokenMint?: string;
  };
  /** Enables demo-only endpoints such as the tamper button. */
  demoMode: boolean;
  /** Lets anyone in the live demo open the reviewer console with a short-lived admin token. Off by default. */
  demoPublicReviewer: boolean;
  otp: { demoMode: boolean; smsProviderConfigured: boolean };
  adminPhones: string[];
  rateLimitEnabled: boolean;
}

type Env = Record<string, string | undefined>;

const ttlSchema = z.string().regex(/^\d+[smhd]$/, "must look like 15m, 12h or 30d");
const clusterSchema = z.enum(["devnet", "localnet"]);

const UNIT_SECONDS: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };

export function ttlToSeconds(ttl: string): number {
  const parsed = ttlSchema.parse(ttl);
  const unit = parsed.slice(-1);
  return Number(parsed.slice(0, -1)) * (UNIT_SECONDS[unit] ?? 1);
}

function list(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

let ephemeralSecret: string | undefined;

export function loadConfig(env: Env = process.env): AppConfig {
  const isProduction =
    env["NODE_ENV"] === "production" || env["VERCEL_ENV"] === "production" || env["VERCEL_ENV"] === "preview";

  let jwtSecret = env["JWT_SECRET"];
  if (isProduction) {
    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error("JWT_SECRET must be set to at least 32 characters in production");
    }
  } else if (!jwtSecret) {
    if (!ephemeralSecret) {
      ephemeralSecret = crypto.randomBytes(32).toString("hex");
      console.warn("JWT_SECRET is not set: using a random secret for this process. Tokens will not survive a restart.");
    }
    jwtSecret = ephemeralSecret;
  }

  const clusterRaw = env["SOLANA_CLUSTER"] ?? "devnet";
  const cluster = clusterSchema.safeParse(clusterRaw);
  if (!cluster.success) {
    throw new Error(`SOLANA_CLUSTER must be "devnet" or "localnet" (this build is devnet-only), got "${clusterRaw}"`);
  }

  const tokenMint = env["ATMOS_TOKEN_MINT"];
  if (tokenMint) {
    try {
      new PublicKey(tokenMint);
    } catch {
      throw new Error("ATMOS_TOKEN_MINT is not a valid public key");
    }
  }

  const payerSecretKey = env["SOLANA_PAYER_SECRET_KEY"];
  if (payerSecretKey) parseSecretKey(payerSecretKey); // validates; throws without echoing the key

  const accessTtl = ttlToSeconds(env["ACCESS_TOKEN_TTL"] ?? "15m");
  const refreshTtl = ttlToSeconds(env["REFRESH_TOKEN_TTL"] ?? "30d");

  const demoMode = env["DEMO_MODE"] === "true";
  if (demoMode && isProduction) {
    console.warn("DEMO_MODE is on in a public deployment: demo-only endpoints are enabled.");
  }

  if (demoMode && env["DEMO_PUBLIC_REVIEWER"] === "true" && isProduction) {
    console.warn("DEMO_PUBLIC_REVIEWER is on in a public deployment: anyone can act as a reviewer (devnet test tokens only).");
  }

  const cors = list(env["CORS_ORIGINS"] ?? env["CORS_ORIGIN"]);

  return {
    isProduction,
    jwtSecret,
    accessTtlSeconds: accessTtl,
    refreshTtlSeconds: refreshTtl,
    corsOrigins: cors,
    databaseUrl: env["DATABASE_URL"] || undefined,
    solana: {
      rpcUrl: env["SOLANA_RPC_URL"] ?? "https://api.devnet.solana.com",
      cluster: cluster.data,
      payerSecretKey: payerSecretKey || undefined,
      tokenMint: tokenMint || undefined,
    },
    demoMode,
    demoPublicReviewer: demoMode && env["DEMO_PUBLIC_REVIEWER"] === "true",
    otp: { demoMode: env["OTP_DEMO_MODE"] === "true", smsProviderConfigured: false },
    adminPhones: list(env["ADMIN_PHONES"]),
    rateLimitEnabled: env["NODE_ENV"] !== "test" || env["RATE_LIMIT_FORCE"] === "true",
  };
}

let cached: AppConfig | undefined;

export function getConfig(): AppConfig {
  cached ??= loadConfig();
  return cached;
}

export function resetConfigForTests(): void {
  cached = undefined;
}

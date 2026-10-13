import crypto from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { getConfig } from "../config";

export type Role = "producer" | "buyer" | "admin";
const ROLES: readonly string[] = ["producer", "buyer", "admin"];

export interface AuthClaims {
  userId: string;
  role: Role;
  wallet?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** Every verification failure maps to this one generic error: no detail reaches the client. */
export class AuthError extends Error {
  constructor() {
    super("unauthorized");
    this.name = "AuthError";
  }
}

const ISSUER = "atmos";
const AUDIENCE = "atmos-api";

const keyCache = new Map<string, Uint8Array>();

/** Sub-keys are derived from the one configured secret so a leaked code key never signs tokens. */
export function deriveKey(label: string): Uint8Array {
  const secret = getConfig().jwtSecret;
  const cacheKey = `${label}:${secret}`;
  let key = keyCache.get(cacheKey);
  if (!key) {
    key = new Uint8Array(crypto.hkdfSync("sha256", secret, "atmos-v1", label, 32));
    keyCache.set(cacheKey, key);
  }
  return key;
}

export async function issueTokens(opts: {
  userId: string;
  role: Role;
  wallet?: string;
  accessTtlSeconds?: number;
}): Promise<AuthTokens> {
  const config = getConfig();
  const key = deriveKey("atmos-jwt");
  const accessTtl = opts.accessTtlSeconds ?? config.accessTtlSeconds;
  const sign = (typ: "access" | "refresh", ttl: number): Promise<string> =>
    new SignJWT({ role: opts.role, typ, ...(opts.wallet ? { wallet: opts.wallet } : {}) })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(opts.userId)
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(`${ttl}s`)
      .setJti(crypto.randomUUID())
      .sign(key);
  const [accessToken, refreshToken] = await Promise.all([
    sign("access", accessTtl),
    sign("refresh", config.refreshTtlSeconds),
  ]);
  return { accessToken, refreshToken, expiresIn: accessTtl };
}

async function verify(token: string, typ: "access" | "refresh"): Promise<AuthClaims> {
  try {
    const { payload } = await jwtVerify(token, deriveKey("atmos-jwt"), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const role = payload["role"];
    const wallet = payload["wallet"];
    if (payload["typ"] !== typ) throw new AuthError();
    if (typeof payload.sub !== "string" || typeof role !== "string" || !ROLES.includes(role)) throw new AuthError();
    return {
      userId: payload.sub,
      role: role as Role,
      ...(typeof wallet === "string" ? { wallet } : {}),
    };
  } catch {
    throw new AuthError();
  }
}

export const verifyAccessToken = (token: string): Promise<AuthClaims> => verify(token, "access");
export const verifyRefreshToken = (token: string): Promise<AuthClaims> => verify(token, "refresh");

export function extractToken(header: string | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1] ?? null;
}

/** The same phone always maps to the same pseudonymous id, with no database. */
export function userIdFromPhone(phoneE164: string): string {
  const mac = crypto.createHmac("sha256", deriveKey("atmos-userid")).update(phoneE164).digest("hex");
  return `u_${mac.slice(0, 24)}`;
}

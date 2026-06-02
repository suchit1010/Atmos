/**
 * JWT Authentication Service
 * Handles token generation, validation, and refresh
 */

import crypto from "node:crypto";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-change-in-production";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "30d";

// In production, use jsonwebtoken library
// For now, using simple JWT-like structure

interface TokenPayload {
  userId: string;
  phone: string;
  wallet?: string;
  role: "producer" | "buyer" | "admin";
  iat: number;
  exp: number;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Parse JWT expiry duration to seconds
 */
function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid expiry format: ${expiry}`);

  const [, amount, unit] = match;
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return parseInt(amount) * (multipliers[unit] ?? 1);
}

/**
 * Create a simple JWT token
 * In production, use `jsonwebtoken` library
 */
export function createTokens(
  userId: string,
  phone: string,
  role: "producer" | "buyer" | "admin" = "producer",
  wallet?: string,
): AuthTokens {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = parseExpiry(JWT_EXPIRY);
  const exp = now + expiresIn;

  const payload: TokenPayload = {
    userId,
    phone,
    wallet,
    role,
    iat: now,
    exp,
  };

  // Simple base64 encoding (NOT cryptographically secure - use jsonwebtoken in production)
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");

  // Create signature
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64url");

  const accessToken = `${headerB64}.${payloadB64}.${signature}`;

  // Refresh token (longer expiry)
  const refreshExpiry = parseExpiry(REFRESH_TOKEN_EXPIRY);
  const refreshPayload = {
    userId,
    type: "refresh",
    iat: now,
    exp: now + refreshExpiry,
  };

  const refreshPayloadB64 = Buffer.from(JSON.stringify(refreshPayload)).toString("base64url");
  const refreshSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${headerB64}.${refreshPayloadB64}`)
    .digest("base64url");

  const refreshToken = `${headerB64}.${refreshPayloadB64}.${refreshSignature}`;

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split(".");

    if (!headerB64 || !payloadB64 || !signatureB64) {
      throw new Error("Invalid token format");
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest("base64url");

    if (signatureB64 !== expectedSignature) {
      throw new Error("Invalid signature");
    }

    // Decode payload
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error("Token expired");
    }

    return payload as TokenPayload;
  } catch (error: any) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

import crypto from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { AuthError, deriveKey } from "./auth";

/**
 * Stateless one-time codes for DEMO sign-in. The code is an HMAC of the phone
 * and a five-minute window, so no server state is needed. Limitation: inside
 * its window a code and challenge pair can be replayed. A real deployment
 * needs an SMS provider and a one-time-use store.
 */
export const OTP_WINDOW_SECONDS = 300;

export function otpCode(phone: string, window: number): string {
  const mac = crypto.createHmac("sha256", deriveKey("atmos-otp")).update(`${phone}|${window}`).digest();
  const offset = (mac[mac.length - 1] ?? 0) & 0x0f;
  const value =
    (((mac[offset] ?? 0) & 0x7f) << 24) |
    ((mac[offset + 1] ?? 0) << 16) |
    ((mac[offset + 2] ?? 0) << 8) |
    (mac[offset + 3] ?? 0);
  return String(value % 1_000_000).padStart(6, "0");
}

export async function createChallenge(
  phone: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<{ challenge: string; code: string }> {
  const window = Math.floor(nowSeconds / OTP_WINDOW_SECONDS);
  const challenge = await new SignJWT({ phone, win: window, typ: "otp-challenge" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(nowSeconds)
    .setExpirationTime(nowSeconds + OTP_WINDOW_SECONDS)
    .sign(deriveKey("atmos-otp-challenge"));
  return { challenge, code: otpCode(phone, window) };
}

export async function checkChallenge(challenge: string, phone: string, code: string): Promise<boolean> {
  let claims: { phone: string; win: number };
  try {
    const { payload } = await jwtVerify(challenge, deriveKey("atmos-otp-challenge"), { algorithms: ["HS256"] });
    if (payload["typ"] !== "otp-challenge") throw new AuthError();
    const win = payload["win"];
    const claimedPhone = payload["phone"];
    if (typeof win !== "number" || typeof claimedPhone !== "string") throw new AuthError();
    claims = { phone: claimedPhone, win };
  } catch {
    return false;
  }
  if (claims.phone !== phone) return false;
  const expected = Buffer.from(otpCode(claims.phone, claims.win));
  const given = Buffer.from(code);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

/** +91 mobile numbers only for the pilot: 10 digits starting 6-9, with an optional +91, 91 or 0 prefix. */
export function normalizeIndianPhone(raw: string): string | null {
  const compact = raw.replace(/[\s-]/g, "");
  const match = /^(?:\+91|91|0)?([6-9]\d{9})$/.exec(compact);
  return match ? `+91${match[1]}` : null;
}

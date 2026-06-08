/**
 * ATMOS Auth Service
 * - Phone OTP (Twilio / mock fallback)
 * - JWT access + refresh tokens
 * - Device fingerprinting
 * - Rate limiting per phone
 */

import crypto from 'crypto';
import { query } from '../db/pool';
import { logger, log } from '../utils/logger';

const JWT_SECRET         = process.env.JWT_SECRET         || 'dev-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const JWT_EXPIRY         = parseInt(process.env.JWT_EXPIRY         || '900');    // 15 min
const JWT_REFRESH_EXPIRY = parseInt(process.env.JWT_REFRESH_EXPIRY || '604800'); // 7 days

// Simple base64url JWT (no external dep needed for HS256)
function base64url(str: string): string {
  return Buffer.from(str).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signJWT(payload: object, secret: string, expiresIn: number): string {
  const header  = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body    = base64url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + expiresIn, iat: Math.floor(Date.now() / 1000) }));
  const sig     = crypto.createHmac('sha256', secret)
    .update(`${header}.${body}`).digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${header}.${body}.${sig}`;
}

export function verifyJWT(token: string, secret: string = JWT_SECRET): Record<string, any> | null {
  try {
    const [header, body, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', secret)
      .update(`${header}.${body}`).digest('base64')
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

// ─── OTP generation + storage ─────────────────────────
const OTP_STORE = new Map<string, { otp: string; expiresAt: number; attempts: number }>();

async function checkOTPRateLimit(phone: string): Promise<void> {
  const key   = `otp:${phone}`;
  const entry = OTP_STORE.get(key);
  if (entry && entry.attempts >= 3 && entry.expiresAt > Date.now()) {
    throw new Error('Too many OTP attempts. Please wait 1 hour.');
  }
}

async function sendOTPViaTwilio(phone: string, otp: string): Promise<void> {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;
  const isDevFallback = !sid || !token || !from;

  if (isDevFallback) {
    // Dev mode: log OTP
    logger.warn(`DEV MODE OTP for ${phone}: ${otp}`);
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: from,
      To:   phone,
      Body: `Your ATMOS verification code: ${otp}. Valid for 5 minutes. Do not share.`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twilio error: ${err}`);
  }
}

// ─── Public API ───────────────────────────────────────
export async function sendOTP(
  phoneNumber: string,
  countryCode: string
): Promise<{ status: 'sent'; expiresIn: number; devOtp?: string }> {
  const fullPhone = `+${countryCode}${phoneNumber.replace(/^0/, '')}`;

  await checkOTPRateLimit(fullPhone);

  const otp    = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 5 * 60 * 1000; // 5 min

  const existing = OTP_STORE.get(`otp:${fullPhone}`);
  OTP_STORE.set(`otp:${fullPhone}`, {
    otp,
    expiresAt: expiry,
    attempts:  (existing?.attempts || 0) + 1,
  });

  // Cleanup after expiry
  setTimeout(() => OTP_STORE.delete(`otp:${fullPhone}`), 5 * 60 * 1000);

  await sendOTPViaTwilio(fullPhone, otp);

  log.audit('otp.sent', 'anonymous', { phone: fullPhone.slice(0, -4) + '****' });

  return {
    status: 'sent',
    expiresIn: 300,
    devOtp: process.env.TWILIO_ACCOUNT_SID ? undefined : otp,
  };
}

export async function verifyOTPAndIssueTokens(
  phoneNumber:       string,
  countryCode:       string,
  otp:               string,
  deviceFingerprint: string
): Promise<{
  accessToken:  string;
  refreshToken: string;
  user: { id: string; phone: string; role: string; name: string | null };
}> {
  const fullPhone = `+${countryCode}${phoneNumber.replace(/^0/, '')}`;
  const entry     = OTP_STORE.get(`otp:${fullPhone}`);

  if (!entry || entry.otp !== otp || entry.expiresAt < Date.now()) {
    throw new Error('Invalid or expired OTP');
  }

  OTP_STORE.delete(`otp:${fullPhone}`);

  // Upsert user
  let userResult = await query<{ id: string; role: string; name: string }>(
    `INSERT INTO users (phone_number, role)
     VALUES ($1, 'producer')
     ON CONFLICT (phone_number) DO UPDATE SET updated_at = NOW()
     RETURNING id, role, name`,
    [fullPhone]
  );

  const user = userResult.rows[0];

  // Upsert device
  await query(
    `INSERT INTO user_devices (user_id, fingerprint, device_name, last_seen)
     VALUES ($1, $2, 'mobile', NOW())
     ON CONFLICT (user_id, fingerprint) DO UPDATE SET last_seen = NOW()`,
    [user.id, deviceFingerprint]
  );

  const payload = { sub: user.id, phone: fullPhone, role: user.role };

  const accessToken  = signJWT(payload, JWT_SECRET,         JWT_EXPIRY);
  const refreshToken = signJWT(payload, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRY);

  log.audit('auth.login', user.id, { phone: fullPhone.slice(0, -4) + '****' });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, phone: fullPhone, role: user.role, name: user.name },
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  const payload = verifyJWT(refreshToken, JWT_REFRESH_SECRET);
  if (!payload) throw new Error('Invalid or expired refresh token');

  const newToken = signJWT(
    { sub: payload.sub, phone: payload.phone, role: payload.role },
    JWT_SECRET,
    JWT_EXPIRY
  );

  return { accessToken: newToken };
}

export async function getUserById(userId: string) {
  const result = await query(
    `SELECT id, phone_number, email, name, organisation, role, kyc_status,
            wallet_address, created_at
     FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

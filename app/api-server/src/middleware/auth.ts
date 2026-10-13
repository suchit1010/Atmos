import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { getConfig } from "../config";
import { extractToken, verifyAccessToken, type Role } from "../lib/auth";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: Role; wallet?: string };
    }
  }
}

export type AuthRequest = Request;

const unauthorized = (res: Response): void => {
  res.status(401).json({ error: "unauthorized" });
};

export const requireAuth: RequestHandler = async (req, res, next) => {
  const token = extractToken(req.headers.authorization);
  if (!token) return unauthorized(res);
  try {
    const claims = await verifyAccessToken(token);
    req.user = { id: claims.userId, role: claims.role, ...(claims.wallet ? { wallet: claims.wallet } : {}) };
    next();
  } catch {
    unauthorized(res);
  }
};

export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const token = extractToken(req.headers.authorization);
  if (token) {
    try {
      const claims = await verifyAccessToken(token);
      req.user = { id: claims.userId, role: claims.role, ...(claims.wallet ? { wallet: claims.wallet } : {}) };
    } catch {
      // An invalid token is treated as no token.
    }
  }
  next();
};

export function requireRole(...roles: Role[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) return unauthorized(res);
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "forbidden" });
      return;
    }
    next();
  };
}

export const requireAdmin: RequestHandler = requireRole("admin");

interface LimiterOptions {
  windowMs: number;
  limit: number;
  /** Key by the signed-in user when there is one, else by IP. */
  perUser?: boolean;
}

export function makeLimiter(opts: LimiterOptions): RequestHandler {
  return rateLimit({
    windowMs: opts.windowMs,
    limit: opts.limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => !getConfig().rateLimitEnabled,
    keyGenerator: (req) => (opts.perUser && req.user ? `u:${req.user.id}` : ipKeyGenerator(req.ip ?? "unknown")),
    handler: (_req, res) => {
      res.status(429).json({ error: "rate_limited" });
    },
  });
}

export const otpLimiter = makeLimiter({ windowMs: 10 * 60_000, limit: 5 });
export const authLimiter = makeLimiter({ windowMs: 60_000, limit: 20 });
export const chainLimiter = makeLimiter({ windowMs: 60_000, limit: 30, perUser: true });
export const publicReadLimiter = makeLimiter({ windowMs: 60_000, limit: 120 });

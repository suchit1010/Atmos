import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractToken } from '../lib/auth';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    phone: string;
    wallet?: string;
    role: "producer" | "buyer" | "admin";
  };
}

/**
 * Proper JWT validation middleware for protected routes.
 * Validates token and extracts user information.
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = extractToken(authHeader);

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header',
      required: 'Authorization: Bearer <token>',
    });
  }

  try {
    const payload = verifyToken(token);
    
    // Attach user to request
    req.user = {
      id: payload.userId,
      phone: payload.phone,
      wallet: payload.wallet,
      role: payload.role,
    };

    next();
  } catch (error: any) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: error.message,
    });
  }
}

/**
 * Optional auth middleware - attaches user if token is valid, continues without if not
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = extractToken(authHeader);

  if (token) {
    try {
      const payload = verifyToken(token);
      req.user = {
        id: payload.userId,
        phone: payload.phone,
        wallet: payload.wallet,
        role: payload.role,
      };
    } catch {
      // Token invalid - continue without auth
    }
  }

  next();
}

/**
 * Admin-only middleware
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }

  next();
}

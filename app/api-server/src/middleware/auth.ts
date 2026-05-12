import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    wallet?: string;
  };
}

/**
 * Simple auth middleware for Umbra/private routes.
 * In production, validate JWT or session token.
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  // Extract user ID from Authorization header or query
  const authHeader = req.headers.authorization || '';
  const userId = req.query.userId as string || req.body?.userId || 'demo-user';

  if (!userId && !authHeader) {
    // In demo/dev, allow without auth; in production, reject
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Fall through with demo user
  }

  // Attach user to request
  req.user = {
    id: userId || authHeader.replace('Bearer ', ''),
    wallet: req.body?.walletAddress || req.query.wallet as string,
  };

  next();
}

import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyJWT } from '../services/auth';

export interface AuthUser {
  sub:   string;
  phone: string;
  role:  string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply:   FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Missing authorization header' });
    return;
  }

  const token   = authHeader.substring(7);
  const payload = verifyJWT(token);

  if (!payload) {
    reply.status(401).send({ error: 'Invalid or expired token' });
    return;
  }

  request.user = {
    sub:   payload.sub,
    phone: payload.phone,
    role:  payload.role,
  };
}

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authMiddleware(request, reply);
    if (reply.sent) return;
    if (!roles.includes(request.user!.role)) {
      reply.status(403).send({ error: 'Insufficient permissions' });
    }
  };
}

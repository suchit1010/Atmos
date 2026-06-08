/**
 * ATMOS Protocol — Production-Grade Backend
 * Week 1 Implementation: Connection Pool, Cache, Rate Limiting, Compression
 */

import 'dotenv/config';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import compress from '@fastify/compress';
import { createClient } from 'redis';
import { logger } from './utils/logger';
import { registerRoutes } from './routes/api';
import { getPool, healthCheck } from './db/pool';
import { initSentry, attachSentryToFastify } from './services/sentry.production';

// ─── Redis Cache Setup ──────────────────────────────────────
let redisClient: any = null;

async function initRedis() {
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      reconnectStrategy: (retries) => Math.min(retries * 50, 500),
    },
    password: process.env.REDIS_PASSWORD || undefined,
    database: 0,
  });

  redisClient.on('error', (err) => {
    logger.error('Redis connection error', { error: err.message });
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected');
  });

  await redisClient.connect();
}

export function getRedis() {
  return redisClient;
}

// ─── Cache Wrapper ──────────────────────────────────────────
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    if (!redisClient) return null;
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    logger.error('Cache get error', { key, error: (err as any).message });
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = 3600
): Promise<void> {
  try {
    if (!redisClient) return;
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    logger.error('Cache set error', { key, error: (err as any).message });
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    if (!redisClient) return;
    await redisClient.del(key);
  } catch (err) {
    logger.error('Cache del error', { key, error: (err as any).message });
  }
}

// ─── Rate Limiting Configuration ────────────────────────────
interface UserTier {
  tier: 'free' | 'pro' | 'enterprise';
  rpsLimit: number;
  verificationConcurrency: number;
  cacheTTL: number;
}

const tierLimits: Record<string, UserTier> = {
  free: { tier: 'free', rpsLimit: 100, verificationConcurrency: 1, cacheTTL: 86400 },
  pro: { tier: 'pro', rpsLimit: 1000, verificationConcurrency: 10, cacheTTL: 172800 },
  enterprise: { tier: 'enterprise', rpsLimit: 10000, verificationConcurrency: 100, cacheTTL: 604800 },
};

async function getUserTier(token: string): Promise<UserTier> {
  // TODO: Fetch from JWT or DB based on user subscription
  return tierLimits.free;
}

// ─── Build App ──────────────────────────────────────────────
async function buildApp(): Promise<FastifyInstance> {
  await initRedis();

  // Initialize Sentry (no-op if not configured)
  try {
    initSentry();
  } catch (err) {
    logger.warn('Sentry initialization failed', { error: (err as any).message });
  }

  const app = Fastify({
    logger: false,
    trustProxy: true,
    requestTimeout: 30000,
  });

  // Attach Sentry hooks to Fastify (if enabled)
  try {
    attachSentryToFastify(app as FastifyInstance);
  } catch (err) {
    logger.warn('Failed to attach Sentry to Fastify', { error: (err as any).message });
  }

  // ── Plugins: Compression ──
  await app.register(compress, {
    threshold: 1024, // Compress responses > 1KB
    encodings: ['gzip', 'deflate'],
  });

  // ── Plugins: Security ──
  await app.register(helmet, {
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  });

  // ── Plugins: CORS ──
  await app.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? (process.env.ALLOWED_ORIGINS || 'http://localhost:19006').split(',')
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // ── Plugins: Rate Limiting (User-Aware) ──
  await app.register(rateLimit, {
    max: async (req) => {
      const token = (req.headers.authorization || '').replace('Bearer ', '');
      const tier = await getUserTier(token);
      return tier.rpsLimit;
    },
    timeWindow: '1 minute',
    keyGenerator: async (req) => {
      // Use user ID if authenticated, IP otherwise
      const token = (req.headers.authorization || '').replace('Bearer ', '');
      if (token) {
        // TODO: Extract user_id from JWT
        return `user:${token.substring(0, 20)}`;
      }
      return `ip:${req.ip}`;
    },
    errorResponseBuilder: () => ({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Upgrade your plan for higher limits.',
      retryAfter: 60,
    }),
  });

  // ── Plugins: Multipart ──
  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024,
      files: 10,
      fieldSize: 1 * 1024 * 1024,
    },
  });

  // ── Request/Response Logging & Tracing ──
  app.addHook('onRequest', async (req) => {
    const requestId = (req.headers['x-request-id'] || `${Date.now()}-${Math.random()}`) as string;
    (req as any).requestId = requestId;

    logger.info('Incoming request', {
      requestId,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });

  app.addHook('onResponse', async (req, reply) => {
    const duration = Date.now() - ((req as any).startTime || Date.now());
    const level = reply.statusCode >= 500 ? 'error'
      : reply.statusCode >= 400 ? 'warn'
        : 'info';

    logger[level]('Response', {
      requestId: (req as any).requestId,
      method: req.method,
      url: req.url,
      status: reply.statusCode,
      duration,
      size: reply.getHeader('content-length'),
    });

    // Alert on slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        requestId: (req as any).requestId,
        duration,
        url: req.url,
      });
    }
  });

  // Timestamp request start
  app.addHook('preValidation', async (req) => {
    (req as any).startTime = Date.now();
  });

  // ── Error Handler ──
  app.setErrorHandler(async (err: any, req, reply) => {
    if (err && err.name === 'ZodError') {
      return reply.status(400).send({
        error: 'Validation Error',
        issues: err.issues,
        requestId: (req as any).requestId,
      });
    }

    logger.error('Unhandled error', {
      requestId: (req as any).requestId,
      error: err.message,
      stack: err.stack,
      url: req.url,
    });

    return reply.status(err.statusCode || 500).send({
      error: err.message || 'Internal Server Error',
      requestId: (req as any).requestId,
    });
  });

  // ── Health Check Endpoint ──
  app.get('/api/healthz', async (req, reply) => {
    const dbHealthy = await healthCheck();
    const redisHealthy = redisClient ? await redisClient.ping() === 'PONG' : false;

    const status = dbHealthy && redisHealthy ? 200 : 503;
    return reply.status(status).send({
      status: dbHealthy && redisHealthy ? 'healthy' : 'degraded',
      db: dbHealthy ? 'ok' : 'error',
      cache: redisHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
    });
  });

  // ── Readiness Check (all dependencies) ──
  app.get('/api/readyz', async (req, reply) => {
    try {
      const dbHealthy = await healthCheck();
      if (!dbHealthy) {
        return reply.status(503).send({ ready: false, reason: 'Database not ready' });
      }
      return reply.status(200).send({ ready: true });
    } catch (err) {
      return reply.status(503).send({ ready: false, reason: (err as any).message });
    }
  });

  // ── Register Routes ──
  await registerRoutes(app);

  return app;
}

// ─── Graceful Shutdown ──────────────────────────────────────
let isShuttingDown = false;

async function gracefulShutdown(app: FastifyInstance) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info('Graceful shutdown initiated');

  // Close HTTP server
  await app.close();

  // Close Redis
  if (redisClient) {
    await redisClient.quit();
  }

  // Close DB pool
  const pool = getPool();
  if (pool) {
    await pool.end();
  }

  logger.info('Graceful shutdown complete');
  process.exit(0);
}

// ─── Start Server ───────────────────────────────────────────
async function start() {
  try {
    const app = await buildApp();

    const port = parseInt(process.env.PORT || '3000');
    await app.listen({ port, host: '0.0.0.0' });

    logger.info(`Server running on port ${port}`, {
      environment: process.env.NODE_ENV || 'development',
      redisUrl: process.env.REDIS_HOST || 'localhost',
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown(app));
    process.on('SIGINT', () => gracefulShutdown(app));
  } catch (err) {
    logger.error('Failed to start server', { error: (err as any).message });
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

export { buildApp };

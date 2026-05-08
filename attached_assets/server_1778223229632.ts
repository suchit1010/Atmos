/**
 * KARTA Protocol — Main Server
 * Fastify + WebSocket + Rate Limit + CORS + Helmet
 */

import 'dotenv/config';
import Fastify, { FastifyInstance } from 'fastify';
import cors          from '@fastify/cors';
import helmet        from '@fastify/helmet';
import rateLimit     from '@fastify/rate-limit';
import multipart     from '@fastify/multipart';
import { logger }    from './utils/logger';
import { registerRoutes } from './routes/api';
import { getPool, healthCheck } from './db/pool';
import { setWebSocketEmitter } from './services/mrv';

// ─── WebSocket clients registry ──────────────────────
const wsClients = new Map<string, Set<any>>();

function broadcastToProject(event: string, data: object): void {
  const [, projectId] = event.split(':');
  const clients = wsClients.get(projectId);
  if (clients) {
    const msg = JSON.stringify({ event, data, ts: Date.now() });
    clients.forEach(ws => {
      try { ws.send(msg); } catch { /* client disconnected */ }
    });
  }
}

// ─── Build app ────────────────────────────────────────
async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger:         false, // we use Winston
    trustProxy:     true,
    requestTimeout: 30000,
  });

  // ── Plugins ──
  await app.register(helmet, {
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy:     false,
  });

  await app.register(cors, {
    origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:19006').split(','),
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(rateLimit, {
    max:           parseInt(process.env.RATE_LIMIT_MAX || '200'),
    timeWindow:    parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
    keyGenerator: (req) => {
      const auth = req.headers.authorization;
      if (auth) return auth.substring(7, 27); // first 20 chars of token
      return req.ip;
    },
    errorResponseBuilder: () => ({
      error:   'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
    }),
  });

  await app.register(multipart, {
    limits: {
      fileSize:  50 * 1024 * 1024, // 50 MB
      files:     10,
      fieldSize: 1 * 1024 * 1024,  // 1 MB per field
    },
  });

  // ── Request logging ──
  app.addHook('onRequest', async (req) => {
    logger.debug('Incoming request', {
      method: req.method,
      url:    req.url,
      ip:     req.ip,
    });
  });

  app.addHook('onResponse', async (req, reply) => {
    const level = reply.statusCode >= 500 ? 'error'
                : reply.statusCode >= 400 ? 'warn'
                : 'debug';
    logger[level]('Response', {
      method: req.method,
      url:    req.url,
      status: reply.statusCode,
    });
  });

  // ── Error handler ──
  app.setErrorHandler(async (err, req, reply) => {
    if (err.name === 'ZodError') {
      return reply.status(400).send({
        error:  'Validation Error',
        issues: (err as any).issues,
      });
    }
    if (err.statusCode === 429) {
      return reply.status(429).send(err);
    }
    logger.error('Unhandled error', { url: req.url, error: err.message, stack: err.stack });
    return reply.status(err.statusCode || 500).send({
      error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    });
  });

  // ── Routes ──
  await registerRoutes(app);

  // ── WebSocket upgrade (manual) ──
  app.server.on('upgrade', (req, socket, head) => {
    const url       = new URL(req.url || '/', `http://${req.headers.host}`);
    const projectId = url.searchParams.get('projectId');
    const token     = url.searchParams.get('token');

    if (!projectId) { socket.destroy(); return; }

    // Simple WS handshake
    const key    = req.headers['sec-websocket-key'] as string;
    const accept = require('crypto')
      .createHash('sha1')
      .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64');

    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
    );

    // Register client
    if (!wsClients.has(projectId)) wsClients.set(projectId, new Set());
    wsClients.get(projectId)!.add(socket);
    logger.debug('WS client connected', { projectId });

    socket.on('close', () => {
      wsClients.get(projectId)?.delete(socket);
      logger.debug('WS client disconnected', { projectId });
    });

    socket.on('error', () => {
      wsClients.get(projectId)?.delete(socket);
    });
  });

  // ── Set MRV pipeline emitter ──
  setWebSocketEmitter(broadcastToProject);

  return app;
}

// ─── Start ────────────────────────────────────────────
async function start(): Promise<void> {
  const app  = await buildApp();
  const port = parseInt(process.env.PORT || '3000');
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen({ port, host });
    logger.info(`🌿 KARTA backend running`, { port, host, env: process.env.NODE_ENV });
  } catch (err) {
    logger.error('Failed to start server', { error: (err as Error).message });
    process.exit(1);
  }

  // ── Graceful shutdown ──
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down`);
    await app.close();
    await getPool().end();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

start();

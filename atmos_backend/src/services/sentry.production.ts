/**
 * ATMOS Backend - Sentry Error Monitoring Integration
 * Day 2 Production Enhancement
 * 
 * Sentry provides real-time error tracking, performance monitoring,
 * and release health tracking for production deployments.
 */

import * as Sentry from '@sentry/node';
import type { FastifyInstance } from 'fastify';
import { logger } from '../utils/logger';

/**
 * Initialize Sentry with production-grade settings
 */
export function initSentry(): void {
  if (process.env.NODE_ENV !== 'production') {
    logger.info('Sentry skipped in development mode');
    return;
  }

  const sentryDsn = process.env.SENTRY_DSN || '';
  if (!sentryDsn) {
    logger.warn('SENTRY_DSN not configured, error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    
    // Environment and version tracking
    environment: process.env.NODE_ENV || 'development',
    release: process.env.APP_VERSION || '1.0.0',
    
    // Sampling for performance (reduce noise in high-volume scenarios)
    tracesSampleRate: 0.1, // Capture 10% of transactions
    profilesSampleRate: 0.1, // Capture 10% of profiles
    
    // Error filtering
    ignoreErrors: [
      // Network errors (often noise)
      'NetworkError',
      'ECONNREFUSED',
      'ENOTFOUND',
      
      // Expected client errors
      '4\d\d',
      
      // Browser extensions
      'top.GLOBALS',
      'chrome://',
      'moz-extension://',
      
      // Known third-party issues
      'ResizeObserver loop limit exceeded',
    ],
    
    // Integration settings
    integrations: [
      // Use casts because @sentry/node types may vary by version
      ...(Sentry as any).Integrations
        ? [
            new (Sentry as any).Integrations.Http({ tracing: true }),
            new (Sentry as any).Integrations.OnUncaughtException(),
            new (Sentry as any).Integrations.OnUnhandledRejection(),
          ]
        : [],
    ],
    
    // Attach context to every error
    beforeSend(event, hint) {
      // Don't send errors that are just noise
      if (event.exception) {
        const message = hint.originalException?.toString() || '';
        if (message.includes('ECONNREFUSED')) {
          // Could be Redis/DB temporarily down - log locally only
          return null;
        }
      }
      return event;
    },
  });

  logger.info('Sentry initialized', {
    environment: process.env.NODE_ENV,
    release: process.env.APP_VERSION,
  });
}

/**
 * Attach Sentry to Fastify instance for request tracking
 */
export function attachSentryToFastify(app: FastifyInstance): void {
  if (process.env.NODE_ENV !== 'production') return;

  // Capture request context
  app.addHook('onRequest', async (request, reply) => {
    const transaction = (Sentry as any).startTransaction({
      name: `${request.method} ${request.url}`,
      op: 'http.server',
    });

    (request as any).sentryTransaction = transaction;

    // Attach user info if authenticated
    if ((request.user as any)?.sub) {
      Sentry.setUser({
        id: (request.user as any).sub,
        email: (request.user as any).email,
      });
    }

    // Add request metadata
    Sentry.setContext('request', {
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'] || 'unknown',
    });
  });

  // Finish transaction on response
  app.addHook('onResponse', async (request, reply) => {
    const tx = (request as any).sentryTransaction;
    if (tx) {
      try {
        (tx as any).setHttpStatus?.(reply.statusCode);
        (tx as any).end?.();
      } catch (err) {
        // ignore
      }
    }
  });

  // Capture all errors
  app.setErrorHandler((error, request, reply) => {
    Sentry.captureException(error, {
      contexts: {
        http: {
          method: request.method,
          url: request.url,
          status_code: reply.statusCode,
        },
      },
      tags: {
        handler: 'fastify',
      },
    });

    // Re-throw to maintain error handling
    throw error;
  });
}

/**
 * Wrapper for AI verification jobs to track in Sentry
 */
export function captureVerificationJob(projectId: string) {
  return (Sentry as any).startTransaction({
    name: `verification.${projectId}`,
    op: 'job.verification',
    data: { projectId },
  });
}

/**
 * Wrapper for payments to track in Sentry
 */
export function capturePaymentTransaction(paymentId: string, amount: number) {
  return (Sentry as any).startTransaction({
    name: `payment.${paymentId}`,
    op: 'payment.process',
    data: { paymentId, amount },
  });
}

/**
 * Manual breadcrumb tracking for key events
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, any>,
  level: 'info' | 'warning' | 'error' = 'info'
) {
  Sentry.addBreadcrumb({
    message,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture a custom metric
 */
export function captureMetric(
  name: string,
  value: number,
  tags?: Record<string, string>
) {
  Sentry.captureMessage(`metric:${name}=${value}`, {
    level: 'info',
    tags: {
      metric: name,
      ...tags,
    },
  });
}

export { Sentry };

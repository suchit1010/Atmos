import winston from 'winston';

const { combine, timestamp, json, colorize, simple } = winston.format;

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production'
    ? combine(timestamp(), json())
    : combine(colorize(), timestamp({ format: 'HH:mm:ss' }), simple()),
  defaultMeta: { service: 'atmos-backend' },
  transports: [
    new winston.transports.Console(),
  ],
});

// Structured logging helpers
export const log = {
  info:  (msg: string, meta?: object) => logger.info(msg, meta),
  warn:  (msg: string, meta?: object) => logger.warn(msg, meta),
  error: (msg: string, meta?: object) => logger.error(msg, meta),
  debug: (msg: string, meta?: object) => logger.debug(msg, meta),
  audit: (event: string, userId: string, meta?: object) =>
    logger.info('AUDIT', { event, userId, ...meta }),
};

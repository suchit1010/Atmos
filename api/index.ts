import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';

// Import route handlers
import healthRouter from '../app/api-server/src/routes/health';
import paymentsRouter from '../app/api-server/src/routes/payments';
import verifyRouter from '../app/api-server/src/routes/verify';
import paymentsPrivateRouter from '../app/api-server/src/routes/payments-private';
import portfolioPrivateRouter from '../app/api-server/src/routes/portfolio-private';
import { logger } from '../app/api-server/src/lib/logger';

const app = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split('?')[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(
  express.json({
    verify(req, _res, buffer) {
      (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', healthRouter);
app.use('/api/payments', paymentsPrivateRouter);
app.use('/api', paymentsRouter);
app.use('/api/portfolio', portfolioPrivateRouter);
app.use('/api', verifyRouter);

export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};

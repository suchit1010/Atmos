import { existsSync } from "node:fs";
import express, { type ErrorRequestHandler, type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { getConfig } from "./config";
import { logger } from "./lib/logger";
import { ServiceError } from "./lib/errors";
import { StoreUnavailableError } from "./lib/store";

class CorsDeniedError extends Error {
  constructor() {
    super("cors_denied");
    this.name = "CorsDeniedError";
  }
}

// Fail fast at boot: a bad production configuration must not start serving.
const config = getConfig();

const app: Express = express();
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // No Origin header: native apps, curl and same-origin requests.
      if (!origin) return callback(null, true);
      if (config.corsOrigins.includes(origin)) return callback(null, true);
      // Outside production, an empty allow-list means any origin may call the API.
      if (!config.isProduction && config.corsOrigins.length === 0) return callback(null, true);
      callback(new CorsDeniedError());
    },
    credentials: true,
  }),
);
app.use(
  express.json({
    limit: "4mb",
    verify(req, _res, buffer) {
      (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use("/api", router);

// Optional: serve the demo web app from this process (local work and Docker). On Vercel the
// same files come from the static output instead.
const webDir = process.env["ATMOS_WEB_DIR"];
if (webDir && existsSync(webDir)) {
  app.use("/atmos", express.static(webDir, { index: "index.html", maxAge: 0 }));
}

app.use((_req, res) => {
  res.status(404).json({ error: "not_found" });
});

const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof CorsDeniedError) {
    res.status(403).json({ error: "cors_denied" });
    return;
  }
  if (err instanceof ServiceError) {
    res.status(err.status).json({ error: err.code, ...err.body });
    return;
  }
  if (err instanceof StoreUnavailableError) {
    res.status(503).json({ error: "store_unavailable" });
    return;
  }
  const status = typeof err?.status === "number" && err.status >= 400 && err.status < 500 ? err.status : 500;
  if (status === 500) req.log?.error({ err }, "unhandled error");
  res.status(status).json({ error: status === 500 ? "internal_error" : "bad_request" });
};
app.use(errorHandler);

export default app;

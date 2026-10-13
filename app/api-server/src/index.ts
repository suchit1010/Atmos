import "./load-env";
import { pathToFileURL } from "node:url";
import app from "./app";
import { logger } from "./lib/logger";

// Export app for serverless deployment (e.g., Vercel)
export default app;

// Handle standalone server execution
const standalone = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;

if (standalone) {
  const rawPort = process.env["PORT"] ?? "9001";
  const port = Number(rawPort);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

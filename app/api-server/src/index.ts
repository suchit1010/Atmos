import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import dotenv from "dotenv";
import app from "./app";
import { logger } from "./lib/logger";


const envCandidates = [
  path.resolve(process.cwd(), "../../.env.local"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "app/api-server/.env.local"),
  path.resolve(process.cwd(), "app/api-server/.env"),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }

}

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

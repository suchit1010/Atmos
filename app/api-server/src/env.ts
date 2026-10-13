import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

/** Loads the first .env files found, without overriding variables that are already set. */
export function loadEnvFiles(): void {
  const candidates = [
    path.resolve(process.cwd(), "../../.env.local"),
    path.resolve(process.cwd(), "../../.env"),
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "app/api-server/.env.local"),
    path.resolve(process.cwd(), "app/api-server/.env"),
  ];
  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) dotenv.config({ path: envPath, override: false });
  }
}

/**
 * Prints an admin access token to stdout (everything else goes to stderr).
 *
 *   pnpm --filter @workspace/api-server exec tsx scripts/admin-token.ts --sub admin-1 --ttl 12h
 *
 * Admin tokens are issued only here, never through the public sign-in routes.
 * Needs JWT_SECRET (the same value the deployed API uses).
 */
import { loadEnvFiles } from "../src/env";

const UNIT: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
const MAX_SECONDS = 7 * 86400;

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? (process.argv[i + 1] as string) : fallback;
}

async function main(): Promise<void> {
  loadEnvFiles();
  if (!process.env["JWT_SECRET"]) {
    console.error("JWT_SECRET is not set. Use the same value as the deployed API, e.g. JWT_SECRET=... pnpm ...");
    process.exit(1);
  }
  const match = /^(\d+)([smhd])$/.exec(arg("ttl", "12h"));
  if (!match) {
    console.error("--ttl must look like 30m, 12h or 2d");
    process.exit(1);
  }
  const seconds = Number(match[1]) * (UNIT[match[2] as string] ?? 1);
  if (seconds <= 0 || seconds > MAX_SECONDS) {
    console.error("--ttl must be between 1 second and 7 days");
    process.exit(1);
  }
  const { issueTokens } = await import("../src/lib/auth");
  const { accessToken } = await issueTokens({ userId: arg("sub", "admin-1"), role: "admin", accessTtlSeconds: seconds });
  console.error(`Admin token valid for ${arg("ttl", "12h")}. Keep it private.`);
  process.stdout.write(`${accessToken}\n`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : "failed");
  process.exit(1);
});

import { pool as workspacePool } from "@workspace/db";

export interface QueryResultLike<T> {
  rows: T[];
  rowCount: number | null;
}

/** True when DATABASE_URL is set. Without it, `query` returns empty results (mock mode). */
export const isDatabaseAvailable = Boolean(process.env["DATABASE_URL"]);

const pool = isDatabaseAvailable ? workspacePool : null;
let warned = false;

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<QueryResultLike<T>> {
  if (pool) {
    const result = await pool.query(text, params);
    return { rows: result.rows as T[], rowCount: result.rowCount };
  }
  if (!warned) {
    warned = true;
    console.warn("DATABASE_URL is not set: database queries return empty results (mock mode).");
  }
  return { rows: [], rowCount: 0 };
}

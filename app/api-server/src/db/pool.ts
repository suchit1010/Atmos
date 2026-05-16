import { pool as workspacePool } from "@workspace/db";

interface MockQueryResult {
  rows: any[];
  rowCount: number;
}

const pool = process.env.DATABASE_URL ? workspacePool : null;

if (!pool) {
  console.warn("Database not available; using mock queries for development/testing");
}

export async function query(text: string, params?: any[]): Promise<MockQueryResult> {
  if (pool) {
    return pool.query(text, params);
  }

  // Mock mode: return empty results for SELECT, success for mutations
  console.log(`[MOCK DB] Query: ${text.substring(0, 50)}...`);
  
  if (text.toUpperCase().startsWith('SELECT')) {
    return { rows: [], rowCount: 0 };
  }
  
  if (text.toUpperCase().startsWith('INSERT')) {
    return { rows: [{ id: Math.random().toString(36).substr(2, 9) }], rowCount: 1 };
  }

  return { rows: [], rowCount: 0 };
}

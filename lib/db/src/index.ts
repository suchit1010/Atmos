import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let db: any = null;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
  } catch (err) {
    console.error("Failed to connect to database:", err);
    // Continue without DB for testing
  }
} else {
  console.warn(
    "DATABASE_URL not set; database features will be unavailable. Set DATABASE_URL to enable persistence.",
  );
}

export { pool, db };
export * from "./schema";

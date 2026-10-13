import { getConfig } from "../config";
import { isDatabaseAvailable, query } from "../db/pool";

/**
 * A tiny document store: one table, JSON values, keyed by (collection, key).
 * It is enough for the M0 demo spine (batches, producers, payouts, meta) and
 * keeps the whole feature runnable with no database for local work and tests.
 */
export interface KvStore {
  readonly kind: "memory" | "postgres";
  get<T>(collection: string, key: string): Promise<T | undefined>;
  put<T>(collection: string, key: string, value: T): Promise<void>;
  /** Atomic. True when this call created the document. */
  insertIfAbsent<T>(collection: string, key: string, value: T): Promise<boolean>;
  delete(collection: string, key: string): Promise<void>;
  /** Newest first. */
  list<T>(collection: string, opts?: { limit?: number }): Promise<T[]>;
}

export class StoreUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoreUnavailableError";
  }
}

interface Entry {
  data: unknown;
  seq: number;
}

export class MemoryKv implements KvStore {
  readonly kind = "memory" as const;
  private readonly collections = new Map<string, Map<string, Entry>>();
  private seq = 0;

  private bucket(collection: string): Map<string, Entry> {
    let found = this.collections.get(collection);
    if (!found) {
      found = new Map();
      this.collections.set(collection, found);
    }
    return found;
  }

  async get<T>(collection: string, key: string): Promise<T | undefined> {
    const entry = this.collections.get(collection)?.get(key);
    return entry ? (structuredClone(entry.data) as T) : undefined;
  }

  async put<T>(collection: string, key: string, value: T): Promise<void> {
    const bucket = this.bucket(collection);
    const existing = bucket.get(key);
    bucket.set(key, { data: structuredClone(value), seq: existing?.seq ?? ++this.seq });
  }

  async insertIfAbsent<T>(collection: string, key: string, value: T): Promise<boolean> {
    const bucket = this.bucket(collection);
    if (bucket.has(key)) return false;
    bucket.set(key, { data: structuredClone(value), seq: ++this.seq });
    return true;
  }

  async delete(collection: string, key: string): Promise<void> {
    this.collections.get(collection)?.delete(key);
  }

  async list<T>(collection: string, opts: { limit?: number } = {}): Promise<T[]> {
    const entries = [...(this.collections.get(collection)?.values() ?? [])];
    entries.sort((a, b) => b.seq - a.seq);
    return entries.slice(0, opts.limit ?? 200).map((e) => structuredClone(e.data) as T);
  }
}

export class PgKv implements KvStore {
  readonly kind = "postgres" as const;
  private ready: Promise<void> | undefined;

  private ensureTable(): Promise<void> {
    this.ready ??= query(
      `CREATE TABLE IF NOT EXISTS atmos_kv (
         collection text NOT NULL,
         key text NOT NULL,
         data jsonb NOT NULL,
         created_at timestamptz NOT NULL DEFAULT now(),
         updated_at timestamptz NOT NULL DEFAULT now(),
         PRIMARY KEY (collection, key)
       )`,
    ).then(
      () => undefined,
      (err) => {
        this.ready = undefined; // allow a retry on the next call
        throw err;
      },
    );
    return this.ready;
  }

  async get<T>(collection: string, key: string): Promise<T | undefined> {
    await this.ensureTable();
    const res = await query<{ data: T }>("SELECT data FROM atmos_kv WHERE collection = $1 AND key = $2", [
      collection,
      key,
    ]);
    return res.rows[0]?.data;
  }

  async put<T>(collection: string, key: string, value: T): Promise<void> {
    await this.ensureTable();
    await query(
      `INSERT INTO atmos_kv (collection, key, data) VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (collection, key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [collection, key, JSON.stringify(value)],
    );
  }

  async insertIfAbsent<T>(collection: string, key: string, value: T): Promise<boolean> {
    await this.ensureTable();
    const res = await query(
      `INSERT INTO atmos_kv (collection, key, data) VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (collection, key) DO NOTHING`,
      [collection, key, JSON.stringify(value)],
    );
    return (res.rowCount ?? 0) > 0;
  }

  async delete(collection: string, key: string): Promise<void> {
    await this.ensureTable();
    await query("DELETE FROM atmos_kv WHERE collection = $1 AND key = $2", [collection, key]);
  }

  async list<T>(collection: string, opts: { limit?: number } = {}): Promise<T[]> {
    await this.ensureTable();
    const res = await query<{ data: T }>(
      "SELECT data FROM atmos_kv WHERE collection = $1 ORDER BY created_at DESC, key DESC LIMIT $2",
      [collection, opts.limit ?? 200],
    );
    return res.rows.map((r) => r.data);
  }
}

let current: KvStore | undefined;

/**
 * Postgres when DATABASE_URL is set. Otherwise memory, which is only acceptable
 * for local work and tests: a public deployment without a database would lose
 * state between serverless invocations, so it refuses instead.
 */
export function getStore(): KvStore {
  if (current) return current;
  const config = getConfig();
  if (isDatabaseAvailable) {
    current = new PgKv();
  } else if (config.isProduction) {
    throw new StoreUnavailableError("DATABASE_URL is required in a public deployment");
  } else {
    current = new MemoryKv();
  }
  return current;
}

export function setStoreForTests(store: KvStore | undefined): void {
  current = store;
}

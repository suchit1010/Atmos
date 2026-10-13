import { createHash } from "node:crypto";

/**
 * Deterministic JSON: keys sorted by UTF-16 code unit, no whitespace, arrays
 * keep their order. Anything that has no single obvious JSON form (undefined,
 * NaN, Date, Map, bigint...) throws instead of being silently dropped, because
 * a silently dropped field would let two different manifests hash the same.
 */
export function canonicalize(value: unknown): string {
  return walk(value, "$");
}

function walk(value: unknown, path: string): string {
  if (value === null) return "null";
  switch (typeof value) {
    case "string":
      return JSON.stringify(value);
    case "boolean":
      return value ? "true" : "false";
    case "number":
      if (!Number.isFinite(value)) throw new TypeError(`non-finite number at ${path}`);
      return Object.is(value, -0) ? "0" : JSON.stringify(value);
    case "object": {
      if (Array.isArray(value)) {
        return `[${value.map((item, i) => walk(item, `${path}[${i}]`)).join(",")}]`;
      }
      const proto: unknown = Object.getPrototypeOf(value);
      if (proto !== Object.prototype && proto !== null) {
        throw new TypeError(`unsupported object type at ${path}`);
      }
      const record = value as Record<string, unknown>;
      const parts = Object.keys(record)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${walk(record[key], `${path}.${key}`)}`);
      return `{${parts.join(",")}}`;
    }
    default:
      throw new TypeError(`unsupported ${typeof value} at ${path}`);
  }
}

/** Lowercase hex SHA-256 of the canonical UTF-8 form. */
export function hashManifest(manifest: unknown): string {
  return createHash("sha256").update(canonicalize(manifest), "utf8").digest("hex");
}

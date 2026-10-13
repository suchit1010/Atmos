import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";

/**
 * Accepts a base58-encoded 64-byte secret key or a JSON array of 64 numbers
 * (the format `solana-keygen` writes). Never includes the key in an error.
 */
export function parseSecretKey(raw: string): Uint8Array {
  const text = raw.trim();
  let bytes: Uint8Array;
  try {
    if (text.startsWith("[")) {
      const parsed: unknown = JSON.parse(text);
      if (!Array.isArray(parsed) || !parsed.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
        throw new Error("not a byte array");
      }
      bytes = Uint8Array.from(parsed as number[]);
    } else {
      bytes = bs58.decode(text);
    }
  } catch {
    throw new Error("secret key is neither base58 nor a JSON array of bytes");
  }
  if (bytes.length !== 64) throw new Error("secret key must be 64 bytes");
  return bytes;
}

export function keypairFromSecret(raw: string): Keypair {
  return Keypair.fromSecretKey(parseSecretKey(raw));
}

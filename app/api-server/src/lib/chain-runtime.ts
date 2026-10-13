import { Keypair, PublicKey } from "@solana/web3.js";
import { getConfig } from "../config";
import { createRpcClient, keypairFromSecret, type ChainClient } from "./chain";
import type { KvStore } from "./store";

/** The payout test token has two decimals so amounts are written in minor units. */
export const PAYOUT_TOKEN_DECIMALS = 2;

export interface ChainRuntime {
  client: ChainClient;
  /** Pays fees, signs anchors and is the payout token authority. Absent when no key is configured. */
  authority?: Keypair;
  /** Configured payout mint (env). A mint created from the admin screen is kept in the store. */
  mint?: PublicKey;
  decimals: number;
}

let override: ChainRuntime | undefined;
let cached: ChainRuntime | undefined;

export function getChainRuntime(): ChainRuntime {
  if (override) return override;
  if (cached) return cached;
  const { solana } = getConfig();
  cached = {
    client: createRpcClient(solana.rpcUrl, solana.cluster),
    ...(solana.payerSecretKey ? { authority: keypairFromSecret(solana.payerSecretKey) } : {}),
    ...(solana.tokenMint ? { mint: new PublicKey(solana.tokenMint) } : {}),
    decimals: PAYOUT_TOKEN_DECIMALS,
  };
  return cached;
}

export function setChainRuntimeForTests(runtime: ChainRuntime | undefined): void {
  override = runtime;
  cached = undefined;
}

const META = "meta";
const MINT_KEY = "payout-mint";

export async function rememberMint(store: KvStore, mint: PublicKey): Promise<void> {
  await store.put(META, MINT_KEY, { mint: mint.toBase58() });
}

/** The env-configured mint wins; otherwise the one created from the admin screen. */
export async function resolveMint(runtime: ChainRuntime, store: KvStore): Promise<PublicKey | undefined> {
  if (runtime.mint) return runtime.mint;
  const saved = await store.get<{ mint: string }>(META, MINT_KEY);
  return saved ? new PublicKey(saved.mint) : undefined;
}

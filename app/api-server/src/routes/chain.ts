import { Router, type IRouter } from "express";
import { createPayoutMint, explorerAddressUrl } from "../lib/chain";
import { PAYOUT_TOKEN_DECIMALS, getChainRuntime, rememberMint, resolveMint } from "../lib/chain-runtime";
import { ServiceError } from "../lib/errors";
import { getStore } from "../lib/store";
import { chainLimiter, requireAdmin, requireAuth } from "../middleware/auth";

const router: IRouter = Router();

// GET /api/chain/status  (admin)
router.get("/chain/status", requireAuth, requireAdmin, async (_req, res) => {
  const runtime = getChainRuntime();
  const store = getStore();
  const mint = await resolveMint(runtime, store);
  const network = runtime.client.network;
  let payoutBalanceMinor: string | null = null;
  let reachable = true;
  if (runtime.authority && mint) {
    try {
      payoutBalanceMinor = (await runtime.client.getTokenBalance(runtime.authority.publicKey, mint)).toString();
    } catch {
      reachable = false;
    }
  }
  res.json({
    network,
    store: store.kind,
    authority: runtime.authority?.publicKey.toBase58() ?? null,
    authorityUrl: runtime.authority ? explorerAddressUrl(runtime.authority.publicKey.toBase58(), network) : null,
    mint: mint?.toBase58() ?? null,
    mintUrl: mint ? explorerAddressUrl(mint.toBase58(), network) : null,
    decimals: PAYOUT_TOKEN_DECIMALS,
    payoutBalanceMinor,
    reachable,
    ready: Boolean(runtime.authority && mint),
  });
});

// POST /api/chain/init-mint  (admin: creates the devnet payout test token once)
router.post("/chain/init-mint", requireAuth, requireAdmin, chainLimiter, async (_req, res) => {
  const runtime = getChainRuntime();
  if (!runtime.authority) throw new ServiceError(503, "chain_not_configured");
  const store = getStore();
  if (await resolveMint(runtime, store)) throw new ServiceError(409, "mint_already_configured");
  try {
    const created = await createPayoutMint(runtime.client, runtime.authority, { decimals: runtime.decimals });
    await rememberMint(store, created.mint);
    res.status(201).json({
      mint: created.mint.toBase58(),
      mintUrl: explorerAddressUrl(created.mint.toBase58(), runtime.client.network),
      note: "Set ATMOS_TOKEN_MINT to this address so every serverless instance agrees on it.",
    });
  } catch (err) {
    throw new ServiceError(502, "chain_send_failed", { detail: err instanceof Error ? err.message : "unknown error" });
  }
});

export default router;

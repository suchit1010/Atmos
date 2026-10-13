import { Router, type IRouter, type NextFunction, type Request, type Response } from "express";
import { getConfig } from "../config";
import { issueTokens } from "../lib/auth";
import { getChainRuntime } from "../lib/chain-runtime";
import { ServiceError } from "../lib/errors";
import { registryIssueSchema } from "../lib/batches/schemas";
import { defaultDeps, restoreManifest, simulateRegistryIssue, tamperManifest, toView } from "../lib/batches/service";
import { authLimiter, chainLimiter, requireAdmin, requireAuth } from "../middleware/auth";

const router: IRouter = Router();

/** Demo endpoints do not exist unless DEMO_MODE=true. */
function demoOnly(_req: Request, res: Response, next: NextFunction): void {
  if (!getConfig().demoMode) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  next();
}

// What the demo web app needs to know before anyone signs in.
router.get("/demo/status", (_req, res) => {
  const config = getConfig();
  res.json({
    demoMode: config.demoMode,
    otpDemo: config.otp.demoMode,
    publicReviewer: config.demoPublicReviewer,
    network: getChainRuntime().client.network,
  });
});

// Optional: a one-hour reviewer token for the live demo, so judges can try the reviewer side.
// Off unless DEMO_PUBLIC_REVIEWER=true. Everything it can spend is a devnet test token.
router.post("/demo/reviewer-session", authLimiter, async (_req, res) => {
  if (!getConfig().demoPublicReviewer) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  const tokens = await issueTokens({ userId: "u_demo_reviewer", role: "admin", accessTtlSeconds: 3600 });
  res.json({ accessToken: tokens.accessToken, expiresInSeconds: 3600 });
});

const idParam = (req: Request): string => {
  const raw = req.params["id"];
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id || !/^b_[0-9a-f]{16}$/.test(id)) throw new ServiceError(404, "not_found");
  return id;
};

// Stands in for a registry issuing credits, then pays tranche 2. Simulated and labelled as such.
router.post("/demo/registry-issue/:id", demoOnly, requireAuth, requireAdmin, chainLimiter, async (req, res) => {
  const parsed = registryIssueSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw new ServiceError(400, "invalid_request");
  const deps = defaultDeps();
  const batch = await simulateRegistryIssue(idParam(req), parsed.data.issuedFraction ?? 1, deps);
  res.json({ batch: await toView(batch, deps) });
});

// Changes the stored evidence after it was anchored, so the proof page shows it was caught.
router.post("/demo/tamper/:id", demoOnly, requireAuth, requireAdmin, async (req, res) => {
  const deps = defaultDeps();
  res.json({ batch: await toView(await tamperManifest(idParam(req), deps), deps) });
});

router.post("/demo/restore/:id", demoOnly, requireAuth, requireAdmin, async (req, res) => {
  const deps = defaultDeps();
  res.json({ batch: await toView(await restoreManifest(idParam(req), deps), deps) });
});

export default router;

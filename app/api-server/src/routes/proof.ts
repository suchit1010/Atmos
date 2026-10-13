import { Router, type IRouter, type Request } from "express";
import { ServiceError } from "../lib/errors";
import { canonicalText, buildProof } from "../lib/batches/proof";
import { renderNotFoundPage, renderProofPage } from "../lib/batches/proof-html";
import { defaultDeps, getBatch } from "../lib/batches/service";
import { publicReadLimiter } from "../middleware/auth";

const router: IRouter = Router();

const idParam = (req: Request): string => {
  const raw = req.params["id"];
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id || !/^b_[0-9a-f]{16}$/.test(id)) throw new ServiceError(404, "not_found");
  return id;
};

// Shown in the "check it yourself" commands. Prefer a configured URL; otherwise rebuild one from
// the request with a fixed scheme, so a forged forwarding header cannot inject a link scheme.
const baseUrl = (req: Request): string => {
  const configured = process.env["PUBLIC_BASE_URL"];
  if (configured && /^https?:\/\/[A-Za-z0-9.:-]+$/.test(configured)) return configured;
  const host = req.get("host") ?? "localhost";
  return `${req.secure ? "https" : "http"}://${/^[A-Za-z0-9.:-]+$/.test(host) ? host : "localhost"}`;
};

router.get("/proof/:id", publicReadLimiter, async (req, res) => {
  const proof = await buildProof(idParam(req), defaultDeps());
  if (!proof) throw new ServiceError(404, "not_found");
  res.setHeader("Cache-Control", "no-store");
  res.json(proof);
});

// The exact text that was hashed, so anyone can run sha256 on it and compare with the memo on Solana.
router.get("/proof/:id/canonical", publicReadLimiter, async (req, res) => {
  const batch = await getBatch(idParam(req), defaultDeps());
  if (!batch || batch.status !== "accepted") throw new ServiceError(404, "not_found");
  res.setHeader("Cache-Control", "no-store");
  res.type("text/plain").send(canonicalText(batch.manifest));
});

router.get("/proof/:id/manifest", publicReadLimiter, async (req, res) => {
  const batch = await getBatch(idParam(req), defaultDeps());
  if (!batch || batch.status !== "accepted") throw new ServiceError(404, "not_found");
  res.setHeader("Cache-Control", "no-store");
  res.json(batch.manifest);
});

router.get("/proof/:id/view", publicReadLimiter, async (req, res) => {
  let proof;
  try {
    proof = await buildProof(idParam(req), defaultDeps());
  } catch (err) {
    if (err instanceof ServiceError && err.status === 404) proof = undefined;
    else throw err;
  }
  res.setHeader("Cache-Control", "no-store");
  if (!proof) {
    res.status(404).type("html").send(renderNotFoundPage());
    return;
  }
  res.type("html").send(renderProofPage(proof, baseUrl(req)));
});

export default router;

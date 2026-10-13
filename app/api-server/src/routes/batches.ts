import { Router, type IRouter, type Request } from "express";
import { ServiceError } from "../lib/errors";
import {
  createBatch,
  defaultDeps,
  getBatch,
  getPhoto,
  getProducer,
  listBatches,
  reviewBatch,
  saveProducer,
  toView,
} from "../lib/batches/service";
import { createBatchSchema, producerSchema, reviewSchema } from "../lib/batches/schemas";
import { chainLimiter, requireAdmin, requireAuth, requireRole } from "../middleware/auth";

const router: IRouter = Router();

const idParam = (req: Request): string => {
  const raw = req.params["id"];
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id || !/^b_[0-9a-f]{16}$/.test(id)) throw new ServiceError(404, "not_found");
  return id;
};

// PUT /api/producers/me  (register the farm point, kiln size and payout wallet)
router.put("/producers/me", requireAuth, requireRole("producer"), chainLimiter, async (req, res) => {
  const parsed = producerSchema.safeParse(req.body);
  if (!parsed.success) throw new ServiceError(400, "invalid_request", { issues: parsed.error.issues.map((i) => i.path.join(".")) });
  const user = req.user!;
  res.json({ producer: await saveProducer(user.id, parsed.data, defaultDeps()) });
});

router.get("/producers/me", requireAuth, requireRole("producer"), async (req, res) => {
  const producer = await getProducer(req.user!.id, defaultDeps());
  if (!producer) throw new ServiceError(404, "not_found");
  res.json({ producer });
});

// POST /api/batches  (idempotent on clientBatchId)
router.post("/batches", requireAuth, requireRole("producer"), chainLimiter, async (req, res) => {
  const parsed = createBatchSchema.safeParse(req.body);
  if (!parsed.success) throw new ServiceError(400, "invalid_request", { issues: parsed.error.issues.map((i) => i.path.join(".")) });
  const deps = defaultDeps();
  const { batch, created } = await createBatch(req.user!.id, parsed.data, deps);
  res.status(created ? 201 : 200).json({ created, batch: await toView(batch, deps) });
});

router.get("/batches", requireAuth, async (req, res) => {
  const deps = defaultDeps();
  const status = typeof req.query["status"] === "string" ? req.query["status"] : undefined;
  const batches = await listBatches(req.user!, deps, status ? { status } : {});
  res.json({ batches: await Promise.all(batches.map((b) => toView(b, deps))) });
});

async function loadForActor(req: Request) {
  const deps = defaultDeps();
  const batch = await getBatch(idParam(req), deps);
  // The same answer for "missing" and "not yours": ids must not be probeable.
  if (!batch || (req.user!.role !== "admin" && batch.ownerId !== req.user!.id)) {
    throw new ServiceError(404, "not_found");
  }
  return { deps, batch };
}

router.get("/batches/:id", requireAuth, async (req, res) => {
  const { deps, batch } = await loadForActor(req);
  res.json({ batch: await toView(batch, deps) });
});

// Raw photo bytes: owner or admin only. The public proof page shows hashes, never pictures.
router.get("/batches/:id/photos/:sha256", requireAuth, async (req, res) => {
  const { deps, batch } = await loadForActor(req);
  const raw = req.params["sha256"];
  const sha = Array.isArray(raw) ? raw[0] : raw;
  if (!sha || !batch.photos.some((p) => p.sha256 === sha)) throw new ServiceError(404, "not_found");
  const photo = await getPhoto(batch.id, sha, deps);
  if (!photo) throw new ServiceError(404, "not_found");
  res.setHeader("Content-Type", photo.mime);
  res.setHeader("Cache-Control", "private, max-age=3600");
  res.send(photo.bytes);
});

// POST /api/batches/:id/review  (admin: accept anchors the evidence and pays tranche 1)
router.post("/batches/:id/review", requireAuth, requireAdmin, chainLimiter, async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) throw new ServiceError(400, "invalid_request");
  const deps = defaultDeps();
  const batch = await reviewBatch(idParam(req), req.user!.id, parsed.data.decision, parsed.data.note, deps);
  res.json({ batch: await toView(batch, deps) });
});

export default router;

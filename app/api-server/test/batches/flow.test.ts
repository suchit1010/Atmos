import { createHash } from "node:crypto";
import request from "supertest";
import { Keypair } from "@solana/web3.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetConfigForTests } from "../../src/config";
import { issueTokens } from "../../src/lib/auth";
import { setChainRuntimeForTests } from "../../src/lib/chain-runtime";
import { MemoryKv, setStoreForTests } from "../../src/lib/store";
import app from "../../src/app";
import { FlakyClient, SimChainClient } from "../chain/sim-client";

const FARM = { lat: 12.9716, lng: 77.5946 };

let sim: SimChainClient;
let authority: Keypair;
let farmer: Keypair;
let producerToken: string;
let otherToken: string;
let adminToken: string;

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const jpeg = (seed: string) => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from(seed.repeat(20))]);

function body(over: Record<string, unknown> = {}, seed = "a") {
  const now = Date.now();
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
  return {
    clientBatchId: `cb-${seed}-0001-aaaa`,
    startedAt: iso(3 * 3_600_000),
    submittedAt: iso(30 * 60_000),
    feedstock: "mixed-crop-residue",
    volumeL: 320,
    moisturePct: 12,
    payoutWallet: farmer.publicKey.toBase58(),
    photos: [
      { kind: "mid", mime: "image/jpeg", dataBase64: jpeg(`mid-${seed}`).toString("base64"), capturedAt: iso(2 * 3_600_000), ...FARM },
      { kind: "end", mime: "image/jpeg", dataBase64: jpeg(`end-${seed}`).toString("base64"), capturedAt: iso(3_600_000), ...FARM },
    ],
    ...over,
  };
}

async function registerFarm(token = producerToken) {
  return request(app).put("/api/producers/me").set(auth(token)).send({ farmPoint: FARM, areaHectares: 0.6, kilnVolumeL: 500 });
}

async function submit(over: Record<string, unknown> = {}, seed = "a", token = producerToken) {
  return request(app).post("/api/batches").set(auth(token)).send(body(over, seed));
}

async function initMint() {
  return request(app).post("/api/chain/init-mint").set(auth(adminToken)).send({});
}

async function readyBatch(seed = "a") {
  await registerFarm();
  const created = await submit({}, seed);
  expect(created.status).toBe(201);
  return created.body.batch.id as string;
}

const accept = (id: string) => request(app).post(`/api/batches/${id}/review`).set(auth(adminToken)).send({ decision: "accept" });
const balanceOf = async (owner: Keypair, mint: string) => {
  const { PublicKey } = await import("@solana/web3.js");
  return sim.getTokenBalance(owner.publicKey, new PublicKey(mint));
};

beforeEach(async () => {
  vi.stubEnv("JWT_SECRET", "d".repeat(48));
  vi.stubEnv("DEMO_MODE", "true");
  resetConfigForTests();
  setStoreForTests(new MemoryKv());
  sim = new SimChainClient();
  authority = Keypair.generate();
  farmer = Keypair.generate();
  sim.fund(authority.publicKey, 10);
  setChainRuntimeForTests({ client: sim, authority, decimals: 2 });
  producerToken = (await issueTokens({ userId: "u_producer", role: "producer" })).accessToken;
  otherToken = (await issueTokens({ userId: "u_other", role: "producer" })).accessToken;
  adminToken = (await issueTokens({ userId: "u_admin", role: "admin" })).accessToken;
});

afterEach(() => {
  vi.unstubAllEnvs();
  resetConfigForTests();
  setStoreForTests(undefined);
  setChainRuntimeForTests(undefined);
});

describe("submitting a batch", () => {
  it("blocks a batch from a producer with no registered farm and stores nothing", async () => {
    const res = await submit();
    expect(res.status).toBe(422);
    expect(res.body.error).toBe("blocked");
    const blocked = res.body.checks.filter((c: { result: string }) => c.result === "block").map((c: { id: string }) => c.id);
    expect(blocked).toEqual(expect.arrayContaining(["R9", "R10"]));
    const list = await request(app).get("/api/batches").set(auth(producerToken));
    expect(list.body.batches).toHaveLength(0);
  });

  it("validates the producer profile", async () => {
    const bad = await request(app).put("/api/producers/me").set(auth(producerToken)).send({ farmPoint: FARM, wallet: "not-a-wallet" });
    expect(bad.status).toBe(400);
    const ok = await registerFarm();
    expect(ok.status).toBe(200);
    expect(ok.body.producer.trainingSource).toBe("demo-simulated");
  });

  it("accepts a good batch and computes the documented numbers", async () => {
    await registerFarm();
    const res = await submit();
    expect(res.status).toBe(201);
    const batch = res.body.batch;
    expect(batch.status).toBe("pending_review");
    expect(batch.manifest.quantity.finalKgCO2e).toBe(104.44);
    expect(batch.manifest.quantity.methaneKgCO2e).toBe(165.12);
    expect(batch.money).toMatchObject({ totalMinor: 585, tranche1Minor: 292, tranche2Minor: 293 });
    expect(batch.manifestHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("never leaks the owner id, the phone-derived id, or photo bytes", async () => {
    await registerFarm();
    const res = await submit();
    const text = JSON.stringify(res.body);
    expect(text).not.toContain("u_producer");
    expect(text).not.toContain("dataBase64");
    expect(res.body.batch.manifest.producer.ref).toMatch(/^[0-9a-f]{12}$/);
    expect(res.body.batch.manifest.farm.approxLat).toBe(12.97);
    expect(res.body.batch.manifest.payout.recipientRef).toMatch(/^[0-9a-f]{12}$/);
  });

  it("is idempotent on clientBatchId", async () => {
    await registerFarm();
    const first = await submit();
    const second = await submit();
    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.created).toBe(false);
    expect(second.body.batch.id).toBe(first.body.batch.id);
    expect((await request(app).get("/api/batches").set(auth(producerToken))).body.batches).toHaveLength(1);
  });

  it("blocks wet feedstock", async () => {
    await registerFarm();
    const res = await submit({ moisturePct: 45 });
    expect(res.status).toBe(422);
    expect(res.body.checks.find((c: { id: string }) => c.id === "R6").result).toBe("block");
  });

  it("flags a reused photo for review instead of blocking", async () => {
    await registerFarm();
    await submit({}, "a");
    const again = body({}, "b");
    again.photos = body({}, "a").photos; // identical bytes under a new batch id
    const res = await request(app).post("/api/batches").set(auth(producerToken)).send(again);
    expect(res.status).toBe(201);
    expect(res.body.batch.gate).toBe("needs_review");
    expect(res.body.batch.checks.find((c: { id: string }) => c.id === "R5").result).toBe("flag");
  });

  it.each([
    ["a non-image file", { photos: [{ kind: "mid", mime: "image/jpeg", dataBase64: Buffer.from("not an image at all").toString("base64") }] }],
    ["bad base64", { photos: [{ kind: "mid", mime: "image/jpeg", dataBase64: "@@@@@@@@@@" }] }],
    ["a start after the submit", { startedAt: new Date(Date.now() + 3_600_000).toISOString() }],
    ["a missing wallet", { payoutWallet: undefined }],
  ])("rejects %s", async (_label, over) => {
    await registerFarm();
    const res = await submit(over as Record<string, unknown>);
    expect(res.status).toBe(400);
  });

  it("rejects the same photo sent twice in one request", async () => {
    await registerFarm();
    const b = body();
    b.photos[1] = { ...b.photos[0]!, kind: "end" };
    const res = await request(app).post("/api/batches").set(auth(producerToken)).send(b);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("duplicate_photo_in_request");
  });
});

describe("access control", () => {
  it("hides batches from other producers, answering as if they do not exist", async () => {
    const id = await readyBatch();
    expect((await request(app).get(`/api/batches/${id}`).set(auth(otherToken))).status).toBe(404);
    expect((await request(app).get(`/api/batches/${id}`).set(auth(producerToken))).status).toBe(200);
    expect((await request(app).get(`/api/batches/${id}`).set(auth(adminToken))).status).toBe(200);
    expect((await request(app).get("/api/batches").set(auth(otherToken))).body.batches).toHaveLength(0);
    expect((await request(app).get("/api/batches").set(auth(adminToken))).body.batches).toHaveLength(1);
  });

  it("serves photo bytes only to the owner and admins", async () => {
    const id = await readyBatch();
    const detail = await request(app).get(`/api/batches/${id}`).set(auth(producerToken));
    const sha = detail.body.batch.photos[0].sha256;
    const mine = await request(app).get(`/api/batches/${id}/photos/${sha}`).set(auth(producerToken));
    expect(mine.status).toBe(200);
    expect(mine.headers["content-type"]).toContain("image/jpeg");
    expect(createHash("sha256").update(mine.body).digest("hex")).toBe(sha);
    expect((await request(app).get(`/api/batches/${id}/photos/${sha}`).set(auth(otherToken))).status).toBe(404);
    expect((await request(app).get(`/api/batches/${id}/photos/${sha}`)).status).toBe(401);
    expect((await request(app).get(`/api/batches/${id}/photos/${"0".repeat(64)}`).set(auth(producerToken))).status).toBe(404);
  });

  it("needs an admin to review and a producer to submit", async () => {
    const id = await readyBatch();
    const asProducer = await request(app).post(`/api/batches/${id}/review`).set(auth(producerToken)).send({ decision: "accept" });
    expect(asProducer.status).toBe(403);
    expect((await request(app).post(`/api/batches/${id}/review`).send({ decision: "accept" })).status).toBe(401);
    const asAdmin = await request(app).post("/api/batches").set(auth(adminToken)).send(body());
    expect(asAdmin.status).toBe(403);
  });

  it("rejects malformed ids without touching the store", async () => {
    expect((await request(app).get("/api/batches/not-an-id").set(auth(adminToken))).status).toBe(404);
    expect((await request(app).get("/api/proof/not-an-id")).status).toBe(404);
  });
});

describe("review, anchor and payout", () => {
  it("refuses to accept before the chain is ready and leaves the batch pending", async () => {
    const id = await readyBatch();
    const noMint = await accept(id);
    expect(noMint.status).toBe(503);
    expect(noMint.body.error).toBe("payout_mint_not_configured");

    setChainRuntimeForTests({ client: sim, decimals: 2 }); // no authority key
    const noKey = await accept(id);
    expect(noKey.status).toBe(503);
    expect(noKey.body.error).toBe("chain_not_configured");

    const after = await request(app).get(`/api/batches/${id}`).set(auth(adminToken));
    expect(after.body.batch.status).toBe("pending_review");
  });

  it("creates the payout token once", async () => {
    const first = await initMint();
    expect(first.status).toBe(201);
    expect((await initMint()).status).toBe(409);
    const status = await request(app).get("/api/chain/status").set(auth(adminToken));
    expect(status.body).toMatchObject({ ready: true, mint: first.body.mint, authority: authority.publicKey.toBase58() });
    expect((await request(app).get("/api/chain/status").set(auth(producerToken))).status).toBe(403);
  });

  it("accepts, anchors the hash and pays tranche 1 exactly once", async () => {
    const mint = (await initMint()).body.mint as string;
    const id = await readyBatch();
    const res = await accept(id);
    expect(res.status).toBe(200);
    const batch = res.body.batch;
    expect(batch.status).toBe("accepted");
    expect(batch.anchor.hash).toBe(batch.manifestHash);
    expect(batch.anchor.authority).toBe(authority.publicKey.toBase58());
    expect(batch.payouts.t1).toMatchObject({ status: "confirmed", amountMinor: 292 });
    expect(await balanceOf(farmer, mint)).toBe(292n);

    const again = await accept(id);
    expect(again.status).toBe(200);
    expect(again.body.batch.anchor.signature).toBe(batch.anchor.signature);
    expect(again.body.batch.payouts.t1.signature).toBe(batch.payouts.t1.signature);
    expect(await balanceOf(farmer, mint)).toBe(292n);
  });

  it("two simultaneous accepts still pay and anchor once", async () => {
    const mint = (await initMint()).body.mint as string;
    const id = await readyBatch();
    const sentBefore = sim.sentCount;
    const results = await Promise.all([accept(id), accept(id)]);
    expect(results.map((r) => r.status).sort()).toEqual(expect.arrayContaining([200]));
    expect(await balanceOf(farmer, mint)).toBe(292n);
    expect(sim.sentCount - sentBefore).toBe(2); // one anchor, one payout
  });

  it("records a rejection and refuses to accept it afterwards", async () => {
    await initMint();
    const id = await readyBatch();
    const rejected = await request(app).post(`/api/batches/${id}/review`).set(auth(adminToken)).send({ decision: "reject", note: "photos unclear" });
    expect(rejected.status).toBe(200);
    expect(rejected.body.batch.status).toBe("rejected");
    expect(rejected.body.batch.review.note).toBe("photos unclear");
    expect((await accept(id)).status).toBe(409);
    expect((await request(app).get(`/api/proof/${id}`)).status).toBe(404);
  });

  it("keeps the unknown-outcome lock when anchoring times out, and does not resend", async () => {
    const flaky = new FlakyClient(sim);
    setChainRuntimeForTests({ client: flaky, authority, decimals: 2 });
    await initMint();
    const id = await readyBatch();
    flaky.failNext = "timeout";
    const first = await accept(id);
    expect(first.status).toBe(502);
    expect(first.body.error).toBe("anchor_outcome_unknown");
    expect(first.body.batch.status).toBe("accepted");
    const attempts = flaky.sendAttempts;
    const retry = await accept(id);
    expect(retry.status).toBe(409);
    expect(retry.body.error).toBe("anchor_in_progress_or_unknown");
    expect(flaky.sendAttempts).toBe(attempts);
  });

  it("does not resend a payout whose outcome is unknown", async () => {
    const flaky = new FlakyClient(sim);
    setChainRuntimeForTests({ client: flaky, authority, decimals: 2 });
    const mint = (await initMint()).body.mint as string;
    const id = await readyBatch();
    // the anchor succeeds, then the payout times out
    const original = flaky.send.bind(flaky);
    let calls = 0;
    flaky.send = async (tx, signers) => {
      calls += 1;
      if (calls === 2) flaky.failNext = "timeout";
      return original(tx, signers);
    };
    const first = await accept(id);
    expect(first.status).toBe(502);
    expect(first.body.error).toBe("payout_outcome_unknown");
    expect(first.body.batch.anchor).toBeTruthy();
    const attempts = flaky.sendAttempts;
    const retry = await accept(id);
    expect(retry.status).toBe(502);
    expect(retry.body.error).toBe("payout_outcome_unknown");
    expect(flaky.sendAttempts).toBe(attempts);
    expect(await balanceOf(farmer, mint)).toBe(0n);
  });
});

describe("public proof", () => {
  async function accepted(seed = "a") {
    const mint = (await initMint()).body.mint as string;
    const id = await readyBatch(seed);
    expect((await accept(id)).status).toBe(200);
    return { id, mint };
  }

  it("shows nothing for a batch that has not been accepted", async () => {
    const id = await readyBatch();
    expect((await request(app).get(`/api/proof/${id}`)).status).toBe(404);
    expect((await request(app).get(`/api/proof/${id}/manifest`)).status).toBe(404);
    expect((await request(app).get(`/api/proof/${id}/canonical`)).status).toBe(404);
    const page = await request(app).get(`/api/proof/${id}/view`);
    expect(page.status).toBe(404);
    expect(page.headers["content-type"]).toContain("text/html");
  });

  it("verifies an accepted batch against Solana without any sign-in", async () => {
    const { id } = await accepted();
    const res = await request(app).get(`/api/proof/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.verdict).toBe("intact");
    expect(res.body.anchor.chainStatus).toBe("match");
    expect(res.body.anchor.chainHash).toBe(res.body.anchor.recomputedHash);
    expect(res.body.photos.every((p: { matches: boolean }) => p.matches)).toBe(true);
    expect(res.body.payouts[0]).toMatchObject({ tranche: 1, status: "confirmed", amountDisplay: "2.92 ATMOS-TEST" });
    const text = JSON.stringify(res.body);
    expect(text).not.toContain("u_producer");
    expect(text).not.toContain(farmer.publicKey.toBase58()); // only a shortened wallet is public
  });

  it("lets anyone recompute the hash from the published canonical text", async () => {
    const { id } = await accepted();
    const proof = await request(app).get(`/api/proof/${id}`);
    const canonical = await request(app).get(`/api/proof/${id}/canonical`).buffer(true).parse((res, cb) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => cb(null, Buffer.concat(chunks)));
    });
    expect(createHash("sha256").update(canonical.body as Buffer).digest("hex")).toBe(proof.body.anchor.chainHash);
    const manifest = await request(app).get(`/api/proof/${id}/manifest`);
    expect(manifest.body.batchId).toBe(id);
  });

  it("renders a readable page with the verdict, escaped", async () => {
    const { id } = await accepted();
    const page = await request(app).get(`/api/proof/${id}/view`);
    expect(page.status).toBe(200);
    expect(page.headers["content-type"]).toContain("text/html");
    expect(page.text).toContain("INTACT");
    expect(page.text).toContain("explorer.solana.com/tx/");
    expect(page.text).toContain(`/api/proof/${id}/canonical`);
    expect(page.text).not.toMatch(/<script/i);
    expect(page.headers["content-security-policy"]).toBeTruthy();
  });

  it("catches a change made to the stored evidence after anchoring", async () => {
    const { id } = await accepted();
    const t = await request(app).post(`/api/demo/tamper/${id}`).set(auth(adminToken));
    expect(t.status).toBe(200);
    expect(t.body.batch.tamperActive).toBe(true);
    const proof = await request(app).get(`/api/proof/${id}`);
    expect(proof.body.verdict).toBe("tampered");
    expect(proof.body.anchor.chainStatus).toBe("mismatch");
    expect((await request(app).get(`/api/proof/${id}/view`)).text).toContain("CHANGED");

    const r = await request(app).post(`/api/demo/restore/${id}`).set(auth(adminToken));
    expect(r.body.batch.tamperActive).toBe(false);
    expect((await request(app).get(`/api/proof/${id}`)).body.verdict).toBe("intact");
  });

  it("catches a swapped photo even when the manifest is untouched", async () => {
    const { id } = await accepted();
    const store = (await import("../../src/lib/store")).getStore();
    const batch = (await store.get<{ photos: Array<{ sha256: string }> }>("batches", id))!;
    await store.put("photos", `${id}:${batch.photos[0]!.sha256}`, { mime: "image/jpeg", dataBase64: jpeg("swapped").toString("base64") });
    const proof = await request(app).get(`/api/proof/${id}`);
    expect(proof.body.verdict).toBe("tampered");
    expect(proof.body.photos[0].matches).toBe(false);
  });

  it("does not count an anchor written by a different signer", async () => {
    const { id } = await accepted();
    const impostor = Keypair.generate();
    sim.fund(impostor.publicKey, 1);
    const { anchorEvidence } = await import("../../src/lib/chain");
    const store = (await import("../../src/lib/store")).getStore();
    const batch = (await store.get<{ manifestHash: string; anchor: { signature: string } }>("batches", id))!;
    const forged = await anchorEvidence(sim, impostor, id, batch.manifestHash);
    await store.put("batches", id, { ...batch, anchor: { ...batch.anchor, signature: forged.signature } });
    const proof = await request(app).get(`/api/proof/${id}`);
    expect(proof.body.verdict).toBe("anchor_invalid");
    expect(proof.body.anchor.chainStatus).toBe("wrong_signer");
  });

  it("says so when Solana cannot be reached", async () => {
    const { id } = await accepted();
    setChainRuntimeForTests({
      client: Object.assign(Object.create(sim), {
        getMemoTx: async () => {
          throw new Error("rpc down");
        },
      }),
      authority,
      decimals: 2,
    });
    const proof = await request(app).get(`/api/proof/${id}`);
    expect(proof.status).toBe(200);
    expect(proof.body.verdict).toBe("chain_unavailable");
  });
});

describe("demo registry step", () => {
  it("is not reachable unless DEMO_MODE is on", async () => {
    vi.stubEnv("DEMO_MODE", "false");
    resetConfigForTests();
    const id = await readyBatch();
    for (const path of [`/api/demo/registry-issue/${id}`, `/api/demo/tamper/${id}`, `/api/demo/restore/${id}`]) {
      expect((await request(app).post(path).set(auth(adminToken))).status).toBe(404);
    }
  });

  it("needs an admin", async () => {
    const id = await readyBatch();
    expect((await request(app).post(`/api/demo/registry-issue/${id}`).set(auth(producerToken))).status).toBe(403);
  });

  it("will not issue before the evidence is anchored and tranche 1 is paid", async () => {
    await initMint();
    const id = await readyBatch();
    const res = await request(app).post(`/api/demo/registry-issue/${id}`).set(auth(adminToken)).send({});
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("not_anchored");
  });

  it("pays tranche 2 once, completing the total", async () => {
    const mint = (await initMint()).body.mint as string;
    const id = await readyBatch();
    await accept(id);
    const res = await request(app).post(`/api/demo/registry-issue/${id}`).set(auth(adminToken)).send({});
    expect(res.status).toBe(200);
    expect(res.body.batch.registry.simulated).toBe(true);
    expect(res.body.batch.payouts.t2).toMatchObject({ status: "confirmed", amountMinor: 293 });
    expect(await balanceOf(farmer, mint)).toBe(585n);
    const again = await request(app).post(`/api/demo/registry-issue/${id}`).set(auth(adminToken)).send({});
    expect(again.status).toBe(200);
    expect(await balanceOf(farmer, mint)).toBe(585n);
    const proof = await request(app).get(`/api/proof/${id}`);
    expect(proof.body.registry.simulated).toBe(true);
    expect(proof.body.payouts).toHaveLength(2);
    expect((await request(app).get(`/api/proof/${id}/view`)).text).toContain("simulated");
  });

  it("pays a smaller tranche 2 when the registry issues less, and refuses a different amount later", async () => {
    const mint = (await initMint()).body.mint as string;
    const id = await readyBatch();
    await accept(id);
    const res = await request(app).post(`/api/demo/registry-issue/${id}`).set(auth(adminToken)).send({ issuedFraction: 0.9 });
    expect(res.status).toBe(200);
    expect(res.body.batch.payouts.t2.amountMinor).toBe(234);
    expect(await balanceOf(farmer, mint)).toBe(526n);
    const other = await request(app).post(`/api/demo/registry-issue/${id}`).set(auth(adminToken)).send({ issuedFraction: 1 });
    expect(other.status).toBe(409);
    expect(await balanceOf(farmer, mint)).toBe(526n);
  });

  it("pays no second tranche when the registry issues half or less", async () => {
    const mint = (await initMint()).body.mint as string;
    const id = await readyBatch();
    await accept(id);
    const res = await request(app).post(`/api/demo/registry-issue/${id}`).set(auth(adminToken)).send({ issuedFraction: 0.5 });
    expect(res.status).toBe(200);
    expect(res.body.batch.payouts.t2).toBeUndefined();
    expect(await balanceOf(farmer, mint)).toBe(292n);
  });
});

describe("store safety", () => {
  it("refuses to run a public deployment without a database", async () => {
    setStoreForTests(undefined);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("JWT_SECRET", "e".repeat(48));
    resetConfigForTests();
    const res = await request(app).get(`/api/proof/b_${"0".repeat(16)}`);
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: "store_unavailable" });
  });
});

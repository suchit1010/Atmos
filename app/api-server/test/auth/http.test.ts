import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetConfigForTests } from "../../src/config";
import { issueTokens } from "../../src/lib/auth";
import { makeLimiter, requireAdmin, requireAuth } from "../../src/middleware/auth";
import app from "../../src/app";

const PHONE = "+919876543210";

beforeEach(() => {
  vi.stubEnv("JWT_SECRET", "c".repeat(48));
  resetConfigForTests();
});

afterEach(() => {
  vi.unstubAllEnvs();
  resetConfigForTests();
});

async function signIn(phone = PHONE) {
  vi.stubEnv("OTP_DEMO_MODE", "true");
  resetConfigForTests();
  const requested = await request(app).post("/api/auth/otp/request").send({ phone });
  const verified = await request(app)
    .post("/api/auth/otp/verify")
    .send({ phone, challenge: requested.body.challenge, code: requested.body.demoCode });
  return { requested, verified };
}

describe("basics", () => {
  it("serves the health check and a JSON 404", async () => {
    expect((await request(app).get("/api/healthz")).status).toBe(200);
    const missing = await request(app).get("/api/nope");
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: "not_found" });
  });

  it("sets security headers", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("OTP sign-in (demo)", () => {
  it("answers 501 when demo mode is off and there is no SMS provider", async () => {
    const res = await request(app).post("/api/auth/otp/request").send({ phone: PHONE });
    expect(res.status).toBe(501);
    expect(res.body).toEqual({ error: "sms_not_configured" });
  });

  it("returns the code only in demo mode, then signs in", async () => {
    const { requested, verified } = await signIn();
    expect(requested.status).toBe(200);
    expect(requested.body.demoCode).toMatch(/^\d{6}$/);
    expect(verified.status).toBe(200);
    expect(verified.body.user).toMatchObject({ phone: PHONE, role: "producer" });
    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${verified.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.role).toBe("producer");
    expect(me.body.id).toBe(verified.body.user.id);
  });

  it("accepts common Indian number formats and rejects others", async () => {
    vi.stubEnv("OTP_DEMO_MODE", "true");
    resetConfigForTests();
    for (const phone of ["9876543210", "+91 98765-43210", "09876543210"]) {
      expect((await request(app).post("/api/auth/otp/request").send({ phone })).status).toBe(200);
    }
    for (const phone of ["12345", "+14155550123", "5876543210", ""]) {
      expect((await request(app).post("/api/auth/otp/request").send({ phone })).status).toBe(400);
    }
  });

  it("rejects a wrong code, another phone's code, and a tampered challenge", async () => {
    vi.stubEnv("OTP_DEMO_MODE", "true");
    resetConfigForTests();
    const a = await request(app).post("/api/auth/otp/request").send({ phone: PHONE });
    const wrong = a.body.demoCode === "000000" ? "000001" : "000000";
    const send = (body: Record<string, unknown>) => request(app).post("/api/auth/otp/verify").send(body);

    expect((await send({ phone: PHONE, challenge: a.body.challenge, code: wrong })).status).toBe(401);

    const b = await request(app).post("/api/auth/otp/request").send({ phone: "+919876543211" });
    expect((await send({ phone: "+919876543211", challenge: a.body.challenge, code: b.body.demoCode })).status).toBe(401);
    expect((await send({ phone: PHONE, challenge: a.body.challenge, code: b.body.demoCode })).status).toBe(401);

    const tampered = `${a.body.challenge.slice(0, -4)}AAAA`;
    expect((await send({ phone: PHONE, challenge: tampered, code: a.body.demoCode })).status).toBe(401);
  });

  it("never issues an admin role from the public routes, even for an allow-listed phone", async () => {
    vi.stubEnv("ADMIN_PHONES", PHONE);
    const { verified } = await signIn();
    expect(verified.body.user.role).toBe("producer");
  });

  it("refreshes with a refresh token and rejects an access token", async () => {
    const { verified } = await signIn();
    const ok = await request(app).post("/api/auth/refresh").send({ refreshToken: verified.body.refreshToken });
    expect(ok.status).toBe(200);
    expect(ok.body.accessToken).toBeTruthy();
    const bad = await request(app).post("/api/auth/refresh").send({ refreshToken: verified.body.accessToken });
    expect(bad.status).toBe(401);
  });
});

describe("guards", () => {
  it("returns 401 without a token and for garbage", async () => {
    expect((await request(app).get("/api/auth/me")).status).toBe(401);
    expect((await request(app).get("/api/auth/me").set("Authorization", "Bearer nonsense")).status).toBe(401);
  });

  it("returns 403 for a producer on an admin-only route and 200 for an admin", async () => {
    const guarded = express();
    guarded.get("/admin", requireAuth, requireAdmin, (_req, res) => {
      res.json({ ok: true });
    });
    const producer = await issueTokens({ userId: "u_p", role: "producer" });
    const admin = await issueTokens({ userId: "u_a", role: "admin" });
    expect((await request(guarded).get("/admin")).status).toBe(401);
    expect((await request(guarded).get("/admin").set("Authorization", `Bearer ${producer.accessToken}`)).status).toBe(403);
    expect((await request(guarded).get("/admin").set("Authorization", `Bearer ${admin.accessToken}`)).status).toBe(200);
  });

  it("rate limits with a 429 JSON body when enabled", async () => {
    vi.stubEnv("RATE_LIMIT_FORCE", "true");
    resetConfigForTests();
    const limited = express();
    limited.get("/x", makeLimiter({ windowMs: 60_000, limit: 2 }), (_req, res) => {
      res.json({ ok: true });
    });
    expect((await request(limited).get("/x")).status).toBe(200);
    expect((await request(limited).get("/x")).status).toBe(200);
    const third = await request(limited).get("/x");
    expect(third.status).toBe(429);
    expect(third.body).toEqual({ error: "rate_limited" });
  });
});

describe("CORS", () => {
  it("denies a foreign origin in production when no origins are configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CORS_ORIGINS", "");
    vi.resetModules();
    const { default: prodApp } = await import("../../src/app");
    const denied = await request(prodApp).get("/api/healthz").set("Origin", "https://evil.example");
    expect(denied.status).toBe(403);
    expect(denied.body).toEqual({ error: "cors_denied" });
    expect((await request(prodApp).get("/api/healthz")).status).toBe(200);
  });

  it("allows a listed origin in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CORS_ORIGINS", "https://atmos.example");
    vi.resetModules();
    const { default: prodApp } = await import("../../src/app");
    const ok = await request(prodApp).get("/api/healthz").set("Origin", "https://atmos.example");
    expect(ok.status).toBe(200);
    expect(ok.headers["access-control-allow-origin"]).toBe("https://atmos.example");
  });
});

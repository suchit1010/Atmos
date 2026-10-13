import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetConfigForTests } from "../../src/config";
import {
  AuthError,
  deriveKey,
  extractToken,
  issueTokens,
  userIdFromPhone,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../src/lib/auth";

beforeEach(() => {
  vi.stubEnv("JWT_SECRET", "a".repeat(48));
  resetConfigForTests();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  resetConfigForTests();
});

describe("tokens", () => {
  it("verifies an access token and carries the claims", async () => {
    const { accessToken } = await issueTokens({ userId: "u_1", role: "producer", wallet: "W" });
    await expect(verifyAccessToken(accessToken)).resolves.toEqual({ userId: "u_1", role: "producer", wallet: "W" });
  });

  it("does not let a refresh token act as an access token, or the reverse", async () => {
    const { accessToken, refreshToken } = await issueTokens({ userId: "u_1", role: "producer" });
    await expect(verifyAccessToken(refreshToken)).rejects.toBeInstanceOf(AuthError);
    await expect(verifyRefreshToken(accessToken)).rejects.toBeInstanceOf(AuthError);
    await expect(verifyRefreshToken(refreshToken)).resolves.toMatchObject({ userId: "u_1" });
  });

  it("rejects an expired token", async () => {
    vi.useFakeTimers();
    const { accessToken } = await issueTokens({ userId: "u_1", role: "producer", accessTtlSeconds: 60 });
    vi.setSystemTime(Date.now() + 120_000);
    await expect(verifyAccessToken(accessToken)).rejects.toBeInstanceOf(AuthError);
  });

  it("rejects a token signed with another secret", async () => {
    const { accessToken } = await issueTokens({ userId: "u_1", role: "admin" });
    vi.stubEnv("JWT_SECRET", "b".repeat(48));
    resetConfigForTests();
    await expect(verifyAccessToken(accessToken)).rejects.toBeInstanceOf(AuthError);
  });

  it("rejects an unsigned alg:none token", async () => {
    const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString("base64url");
    const forged = `${b64({ alg: "none", typ: "JWT" })}.${b64({
      sub: "u_1",
      role: "admin",
      typ: "access",
      iss: "atmos",
      aud: "atmos-api",
      exp: Math.floor(Date.now() / 1000) + 600,
    })}.`;
    await expect(verifyAccessToken(forged)).rejects.toBeInstanceOf(AuthError);
  });

  it("rejects a wrong audience, a wrong issuer and an unknown role", async () => {
    const sign = (claims: Record<string, unknown>, aud: string, iss: string) =>
      new SignJWT({ typ: "access", ...claims })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject("u_1")
        .setIssuer(iss)
        .setAudience(aud)
        .setExpirationTime("5m")
        .sign(deriveKey("atmos-jwt"));
    await expect(verifyAccessToken(await sign({ role: "admin" }, "someone-else", "atmos"))).rejects.toBeInstanceOf(AuthError);
    await expect(verifyAccessToken(await sign({ role: "admin" }, "atmos-api", "evil"))).rejects.toBeInstanceOf(AuthError);
    await expect(verifyAccessToken(await sign({ role: "root" }, "atmos-api", "atmos"))).rejects.toBeInstanceOf(AuthError);
    await expect(verifyAccessToken(await sign({ role: "admin" }, "atmos-api", "atmos"))).resolves.toMatchObject({ role: "admin" });
  });

  it("does not put the phone number in a token", async () => {
    const { accessToken } = await issueTokens({ userId: userIdFromPhone("+919876543210"), role: "producer" });
    const payload = Buffer.from(accessToken.split(".")[1] ?? "", "base64url").toString();
    expect(payload).not.toContain("9876543210");
  });

  it("maps the same phone to the same pseudonymous id", () => {
    expect(userIdFromPhone("+919876543210")).toBe(userIdFromPhone("+919876543210"));
    expect(userIdFromPhone("+919876543210")).not.toBe(userIdFromPhone("+919876543211"));
    expect(userIdFromPhone("+919876543210")).toMatch(/^u_[0-9a-f]{24}$/);
  });

  it("extracts bearer tokens", () => {
    expect(extractToken("Bearer abc.def")).toBe("abc.def");
    expect(extractToken("bearer x")).toBe("x");
    expect(extractToken("Basic abc")).toBeNull();
    expect(extractToken(undefined)).toBeNull();
  });
});

import { Router, type IRouter } from "express";
import { z } from "zod";
import { getConfig } from "../config";
import { issueTokens, userIdFromPhone, verifyRefreshToken } from "../lib/auth";
import { OTP_WINDOW_SECONDS, checkChallenge, createChallenge, normalizeIndianPhone } from "../lib/otp";
import { authLimiter, otpLimiter, requireAuth } from "../middleware/auth";

const router: IRouter = Router();

const phoneField = z
  .string()
  .max(32)
  .transform((raw, ctx) => {
    const phone = normalizeIndianPhone(raw);
    if (!phone) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "invalid phone" });
      return z.NEVER;
    }
    return phone;
  });

const requestSchema = z.object({ phone: phoneField });
const verifySchema = z.object({
  phone: phoneField,
  challenge: z.string().min(10).max(2048),
  code: z.string().regex(/^\d{6}$/),
});
const refreshSchema = z.object({ refreshToken: z.string().min(10).max(4096) });

// POST /api/auth/otp/request
// Demo sign-in: with OTP_DEMO_MODE=true the code is returned in the response because
// no SMS provider is wired up. Without it the route answers 501.
router.post("/auth/otp/request", otpLimiter, async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_phone" });
    return;
  }
  const config = getConfig();
  if (!config.otp.demoMode && !config.otp.smsProviderConfigured) {
    res.status(501).json({ error: "sms_not_configured" });
    return;
  }
  const { challenge, code } = await createChallenge(parsed.data.phone);
  res.json({
    challenge,
    expiresInSeconds: OTP_WINDOW_SECONDS,
    ...(config.otp.demoMode
      ? { demoCode: code, note: "Demo mode: no SMS is sent, so the code is returned here." }
      : {}),
  });
});

// POST /api/auth/otp/verify
router.post("/auth/otp/verify", otpLimiter, async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request" });
    return;
  }
  const { phone, challenge, code } = parsed.data;
  if (!(await checkChallenge(challenge, phone, code))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  // Admin tokens are never issued here: they come only from scripts/admin-token.ts.
  const id = userIdFromPhone(phone);
  const tokens = await issueTokens({ userId: id, role: "producer" });
  res.json({ user: { id, phone, role: "producer" }, ...tokens });
});

// POST /api/auth/refresh
router.post("/auth/refresh", authLimiter, async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request" });
    return;
  }
  try {
    const claims = await verifyRefreshToken(parsed.data.refreshToken);
    const tokens = await issueTokens({
      userId: claims.userId,
      role: claims.role,
      ...(claims.wallet ? { wallet: claims.wallet } : {}),
    });
    res.json(tokens);
  } catch {
    res.status(401).json({ error: "unauthorized" });
  }
});

// GET /api/auth/me
router.get("/auth/me", authLimiter, requireAuth, (req, res) => {
  res.json({ id: req.user?.id, role: req.user?.role, wallet: req.user?.wallet ?? null });
});

export default router;

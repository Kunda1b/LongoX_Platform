import { Router, type IRouter, type Request, type Response } from "express";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@longox/db/prisma";
import { authMiddleware, signToken } from "../lib/auth";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

function generateTotpSecret(): string {
  return randomBytes(20).toString("base64url");
}

function generateTotpCode(
  secret: string,
  timestamp: number = Date.now(),
): string {
  const timeStep = Math.floor(timestamp / 30000);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(timeStep), 0);

  const key = Buffer.from(secret, "base64url");
  const hmac = createHash("sha1").update(key).update(timeBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1000000).padStart(6, "0");
}

function verifyTotpCode(secret: string, code: string): boolean {
  const now = Date.now();
  for (let i = -1; i <= 1; i++) {
    const expected = generateTotpCode(secret, now + i * 30000);
    if (expected === code) return true;
  }
  return false;
}

function generateTotpUri(
  secret: string,
  email: string,
  issuer: string = "LongoX",
): string {
  return `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

router.post(
  "/auth/mfa/setup",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;

    const existing = (await prisma.userMfa.findFirst({
      where: { userId, method: "totp" },
    })) as any;

    if (existing?.enabled) {
      res.status(400).json({ error: "MFA is already enabled" });
      return;
    }

    const secret = existing?.secret ?? generateTotpSecret();

    if (!existing) {
      await prisma.userMfa
        .create({
          data: {
            userId,
            method: "totp",
            secret,
            enabled: false,
          } as any,
        })
        .catch(() => {
          // Conflict (already exists) — ignore, matching onConflictDoNothing.
        });
    }

    const user = (await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })) as any;

    res.json({
      secret,
      uri: generateTotpUri(secret, user!.email),
      qrCode: `otpauth://totp/LongoX:${user!.email}?secret=${secret}&issuer=LongoX`,
    });
  },
);

router.post(
  "/auth/mfa/verify",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { code } = req.body as { code?: string };

    if (!code || !/^\d{6}$/.test(code)) {
      res.status(400).json({ error: "A valid 6-digit code is required" });
      return;
    }

    const mfa = (await prisma.userMfa.findFirst({
      where: { userId, method: "totp" },
    })) as any;

    if (!mfa) {
      res
        .status(400)
        .json({ error: "MFA not set up. Call /auth/mfa/setup first." });
      return;
    }

    if (!verifyTotpCode(mfa.secret, code)) {
      res.status(401).json({ error: "Invalid verification code" });
      return;
    }

    await prisma.userMfa.update({
      where: { id: mfa.id },
      data: { enabled: true, verifiedAt: new Date() },
    });

    res.json({ success: true, message: "MFA enabled successfully" });
  },
);

router.post(
  "/auth/mfa/challenge",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    const { userId, code } = req.body as { userId?: string; code?: string };

    if (!userId || !code) {
      res.status(400).json({ error: "userId and code are required" });
      return;
    }

    const mfa = (await prisma.userMfa.findFirst({
      where: { userId, method: "totp", enabled: true },
    })) as any;

    if (!mfa) {
      res.json({ verified: true });
      return;
    }

    const verified = verifyTotpCode(mfa.secret, code);
    res.json({ verified });
  },
);

router.delete(
  "/auth/mfa",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;

    await prisma.userMfa.deleteMany({
      where: { userId, method: "totp" },
    });

    res.json({ success: true, message: "MFA disabled" });
  },
);

router.get(
  "/auth/mfa/status",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;

    const mfa = (await prisma.userMfa.findFirst({
      where: { userId, method: "totp" },
    })) as any;

    res.json({
      enabled: mfa?.enabled ?? false,
      method: mfa?.method ?? null,
      verifiedAt: mfa?.verifiedAt
        ? mfa.verifiedAt instanceof Date
          ? mfa.verifiedAt.toISOString()
          : new Date(mfa.verifiedAt).toISOString()
        : null,
    });
  },
);

export default router;

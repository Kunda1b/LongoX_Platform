import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "@longox/db/prisma";
import {
  authMiddleware,
  getBearerToken,
  revokeToken,
  signToken,
} from "../lib/auth";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/email";
import { seedRoles, getSystemRoleId } from "@longox/shared-rbac";
import { RegisterUserBody, LoginUserBody } from "@longox/lib-api-zod";
import { validateRequest } from "../middleware/zod-validation";
import { buildVersionedPaths } from "../lib/api-versioning";
import {
  sendApiError,
  sendConflict,
  sendInternalError,
  sendNotFound,
  sendUnauthorized,
  sendValidationError,
} from "../middleware/error-handler";

const router: IRouter = Router();

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "workspace";
}

async function uniqueTenantSlug(base: string): Promise<string> {
  let slug = slugify(base);
  for (let attempt = 0; attempt < 100; attempt++) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt}`;
    const existing = (await prisma.tenant.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })) as any;
    if (!existing) return candidate;
  }
  return `${slug}-${Date.now()}`;
}

router.post(
  buildVersionedPaths("/auth/register"),
  validateRequest(RegisterUserBody),
  async (req, res): Promise<void> => {
  await seedRoles();

  const { name, email, password, organizationName } = req.body as {
    name: string;
    email: string;
    password: string;
    organizationName?: string;
  };

  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPassword = password.trim();
  const trimmedOrg = organizationName?.trim();

  const existingUser = (await prisma.user.findUnique({
    where: { email: trimmedEmail },
    select: { id: true },
  })) as any;

  if (existingUser) {
    sendConflict(res, "An account with this email already exists", req.correlationId ?? null);
    return;
  }

  const orgName = trimmedOrg || `${trimmedName}'s Workspace`;
  const slug = await uniqueTenantSlug(trimmedOrg || trimmedEmail.split("@")[0]);
  const passwordHash = await bcrypt.hash(trimmedPassword, 10);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const tenant = (await tx.tenant.create({
        data: {
          name: orgName,
          slug,
          planId: "free",
          status: "active",
        } as any,
      })) as any;

      const user = (await tx.user.create({
        data: {
          email: trimmedEmail,
          passwordHash,
          name: trimmedName,
          tenantId: tenant.id,
          role: "owner",
          status: "active",
          emailVerificationToken: verificationToken,
        } as any,
      })) as any;

      // Assign the owner role via the RBAC membership table
      const ownerRoleId = await getSystemRoleId("owner");
      if (ownerRoleId) {
        await tx.membership.create({
          data: {
            userId: String(user.id),
            roleId: ownerRoleId,
            tenantId: tenant.id,
          } as any,
        }).catch(() => {
          // Ignore unique constraint conflicts
        });
      }

      await tx.membership.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          roleId: ownerRoleId ?? undefined,
          status: "active",
        } as any,
      }).catch(() => {
        // Ignore unique constraint conflicts
      });

      await tx.userRegistration.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          email: trimmedEmail,
          organizationName: orgName,
          status: "completed",
          ipAddress: req.ip ?? null,
          userAgent: req.get("user-agent") ?? null,
        } as any,
      });

      await tx.auditLog.create({
        data: {
          actorId: String(user.id),
          action: "user.registered",
          targetType: "user",
          targetId: String(user.id),
          diffJson: { tenantId: tenant.id, email: trimmedEmail, actorType: "user" } as any,
        } as any,
      });

      return { tenant, user, verificationToken };
    });

    const authUser = {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      tenantId: result.user.tenantId ?? null,
      role: (result.user as any).role,
      emailVerifiedAt: null as string | null,
    };
    const token = signToken(authUser);

    // Fire-and-forget verification email
    sendVerificationEmail(result.user.email, result.user.name, result.verificationToken).catch(
      (err) => console.error("[Email] Failed to send verification email:", err),
    );

    res.status(201).json({
      token,
      user: authUser,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("unique") || message.includes("duplicate")) {
      sendConflict(res, "An account with this email already exists", req.correlationId ?? null);
      return;
    }
    sendInternalError(res, "Registration failed", req.correlationId ?? null);
  }
});

router.post(
  buildVersionedPaths("/auth/login"),
  validateRequest(LoginUserBody),
  async (req, res): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  const user = (await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  })) as any;
  if (!user) {
    sendUnauthorized(res, "Invalid email or password", req.correlationId ?? null);
    return;
  }

  if (user.status !== "active") {
    sendUnauthorized(res, "Account is disabled", req.correlationId ?? null);
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    sendUnauthorized(res, "Invalid email or password", req.correlationId ?? null);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const mfa = (await prisma.userMfa.findFirst({
    where: { userId: user.id, enabled: true },
  })) as any;

  const requiresMfa = !!mfa;

  // Look up canonical role from memberships → rbacRoles (fall back to users.role)
  const userRoleRow = (await prisma.membership.findFirst({
    where: {
      userId: String(user.id),
      ...(user.tenantId ? { tenantId: user.tenantId } : {}),
    } as any,
    include: { role: { select: { name: true } } } as any,
  })) as any;

  // For existing users without a membership entry, migrate them to owner on login
  let canonicalRole = userRoleRow?.role?.name ?? (user as any).role;
  if (!userRoleRow && ((user as any).role === "admin" || (user as any).role === "owner")) {
    const ownerRoleId = await getSystemRoleId("owner");
    if (ownerRoleId && user.tenantId) {
      await prisma.membership.create({
        data: { userId: String(user.id), roleId: ownerRoleId, tenantId: user.tenantId } as any,
      }).catch(() => {
        // Ignore unique constraint conflicts
      });
    }
    canonicalRole = "owner";
  }

  const authUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    tenantId: user.tenantId ?? null,
    role: canonicalRole,
  };
  const token = signToken(authUser);

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId,
      role: canonicalRole,
      emailVerifiedAt: user.emailVerifiedAt
        ? (user.emailVerifiedAt instanceof Date ? user.emailVerifiedAt.toISOString() : new Date(user.emailVerifiedAt).toISOString())
        : null,
      avatarUrl: null,
    },
    requiresMfa,
  });
});

router.post(["/auth/logout", "/api/auth/logout", "/api/v1/auth/logout"], authMiddleware, (req, res): void => {
  const token = getBearerToken(req);
  if (token) revokeToken(token);
  res.json({ message: "Logged out successfully" });
});

router.get(["/auth/me", "/api/auth/me", "/api/v1/auth/me"], authMiddleware, async (req, res): Promise<void> => {
  const user = (await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      tenantId: true,
      avatarUrl: true,
      lastLoginAt: true,
      createdAt: true,
    } as any,
  })) as any;

  if (!user) {
    sendNotFound(res, "User not found", req.correlationId ?? null);
    return;
  }

  res.json({
    ...user,
    role: (user as any).role,
    isActive: user.status === "active",
  });
});

// GET /api/auth/verify-email?token=...  (public)
router.get(
  ["/auth/verify-email", "/api/auth/verify-email", "/api/v1/auth/verify-email"],
  async (req, res): Promise<void> => {
    const token = req.query.token as string | undefined;
    if (!token) {
      sendValidationError(res, "Verification token is required", [], req.correlationId ?? null);
      return;
    }

    const user = (await prisma.user.findFirst({
      where: { emailVerificationToken: token } as any,
      select: { id: true, emailVerifiedAt: true } as any,
    })) as any;

    if (!user) {
      sendValidationError(res, "Invalid or expired verification link", [], req.correlationId ?? null);
      return;
    }

    if (user.emailVerifiedAt) {
      res.json({ message: "Email already verified" });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date(), emailVerificationToken: null } as any,
    });

    res.json({ message: "Email verified successfully" });
  },
);

// POST /api/auth/resend-verification  (authenticated)
router.post(
  ["/auth/resend-verification", "/api/auth/resend-verification", "/api/v1/auth/resend-verification"],
  authMiddleware,
  async (req, res): Promise<void> => {
    const user = (await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerifiedAt: true,
      } as any,
    })) as any;

    if (!user) {
      sendNotFound(res, "User not found", req.correlationId ?? null);
      return;
    }

    if (user.emailVerifiedAt) {
      sendValidationError(res, "Email is already verified", [], req.correlationId ?? null);
      return;
    }

    const newToken = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: newToken } as any,
    });

    sendVerificationEmail(user.email, user.name, newToken).catch((err) =>
      console.error("[Email] Failed to resend verification email:", err),
    );

    res.json({ message: "Verification email sent" });
  },
);

// POST /api/auth/forgot-password  (public)
router.post(
  ["/auth/forgot-password", "/api/auth/forgot-password", "/api/v1/auth/forgot-password"],
  async (req, res): Promise<void> => {
    const { email } = req.body as { email?: string };
    if (!email?.trim()) {
      sendValidationError(res, "Email is required", [{ field: "email", rule: "required" }], req.correlationId ?? null);
      return;
    }

    const user = (await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true, name: true, status: true } as any,
    })) as any;

    // Always respond with success to avoid email enumeration
    if (!user || user.status !== "active") {
      res.json({ message: "If that email exists, a reset link has been sent" });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetTokenExpiresAt: expiresAt,
      } as any,
    });

    sendPasswordResetEmail(user.email, user.name, resetToken).catch((err) =>
      console.error("[Email] Failed to send password reset email:", err),
    );

    res.json({ message: "If that email exists, a reset link has been sent" });
  },
);

// POST /api/auth/reset-password  (public)
router.post(
  ["/auth/reset-password", "/api/auth/reset-password", "/api/v1/auth/reset-password"],
  async (req, res): Promise<void> => {
    const { token, password } = req.body as { token?: string; password?: string };

    if (!token || !password?.trim()) {
      sendValidationError(
        res,
        "Token and new password are required",
        [],
        req.correlationId ?? null,
      );
      return;
    }

    if (password.trim().length < 8) {
      sendValidationError(
        res,
        "Password must be at least 8 characters",
        [{ field: "password", rule: "min_length", value: password.trim().length }],
        req.correlationId ?? null,
      );
      return;
    }

    const now = new Date();
    const user = (await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetTokenExpiresAt: { gt: now },
      } as any,
      select: { id: true, passwordResetTokenExpiresAt: true } as any,
    })) as any;

    if (!user) {
      sendValidationError(res, "Invalid or expired reset link", [], req.correlationId ?? null);
      return;
    }

    const passwordHash = await bcrypt.hash(password.trim(), 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
      } as any,
    });

    res.json({ message: "Password reset successfully" });
  },
);

// PATCH /api/auth/profile  (authenticated)
router.patch(
  ["/auth/profile", "/api/auth/profile", "/api/v1/auth/profile"],
  authMiddleware,
  async (req, res): Promise<void> => {
    const { name } = req.body as { name?: string };
    const trimmedName = name?.trim();

    if (!trimmedName) {
      sendValidationError(res, "Name is required", [{ field: "name", rule: "required" }], req.correlationId ?? null);
      return;
    }

    if (trimmedName.length < 2) {
      sendValidationError(
        res,
        "Name must be at least 2 characters",
        [{ field: "name", rule: "min_length", value: trimmedName.length }],
        req.correlationId ?? null,
      );
      return;
    }

    const updated = (await prisma.user.update({
      where: { id: req.user!.id },
      data: { name: trimmedName, updatedAt: new Date() } as any,
      select: {
        id: true,
        email: true,
        name: true,
        tenantId: true,
        avatarUrl: true,
      } as any,
    })) as any;

    if (!updated) {
      sendNotFound(res, "User not found", req.correlationId ?? null);
      return;
    }

    res.json({ user: { ...updated, role: (updated as any).role } });
  },
);

// POST /api/auth/avatar  (authenticated) — stores base64 data-URL avatar
router.post(
  ["/auth/avatar", "/api/auth/avatar", "/api/v1/auth/avatar"],
  authMiddleware,
  async (req, res): Promise<void> => {
    const { avatar } = req.body as { avatar?: string };

    if (!avatar) {
      sendValidationError(res, "avatar field is required", [{ field: "avatar", rule: "required" }], req.correlationId ?? null);
      return;
    }

    if (!avatar.startsWith("data:image/")) {
      sendValidationError(
        res,
        "avatar must be a base64 image data URL",
        [{ field: "avatar", rule: "format" }],
        req.correlationId ?? null,
      );
      return;
    }

    // Limit to ~2 MB of base64 (≈ 1.5 MB image)
    if (avatar.length > 2_800_000) {
      sendApiError(res, 413, {
        code: "PAYLOAD_TOO_LARGE",
        message: "Image too large — please use an image under 1.5 MB",
        details: [{ field: "avatar", rule: "max_size", value: avatar.length }],
        correlationId: req.correlationId ?? null,
      });
      return;
    }

    const updated = (await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl: avatar, updatedAt: new Date() } as any,
      select: { id: true, avatarUrl: true } as any,
    })) as any;

    if (!updated) {
      sendNotFound(res, "User not found", req.correlationId ?? null);
      return;
    }

    res.json({ avatarUrl: updated.avatarUrl });
  },
);

// DELETE /api/auth/avatar  (authenticated) — removes avatar
router.delete(
  ["/auth/avatar", "/api/auth/avatar", "/api/v1/auth/avatar"],
  authMiddleware,
  async (req, res): Promise<void> => {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl: null, updatedAt: new Date() } as any,
    });

    res.json({ avatarUrl: null });
  },
);

// PATCH /api/auth/password  (authenticated)
router.patch(
  ["/auth/password", "/api/auth/password", "/api/v1/auth/password"],
  authMiddleware,
  async (req, res): Promise<void> => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword?.trim() || !newPassword?.trim()) {
      sendValidationError(
        res,
        "Current password and new password are required",
        [
          { field: "currentPassword", rule: "required" },
          { field: "newPassword", rule: "required" },
        ],
        req.correlationId ?? null,
      );
      return;
    }

    if (newPassword.trim().length < 8) {
      sendValidationError(
        res,
        "New password must be at least 8 characters",
        [{ field: "newPassword", rule: "min_length", value: newPassword.trim().length }],
        req.correlationId ?? null,
      );
      return;
    }

    const user = (await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, passwordHash: true } as any,
    })) as any;

    if (!user) {
      sendNotFound(res, "User not found", req.correlationId ?? null);
      return;
    }

    const valid = await bcrypt.compare(currentPassword.trim(), user.passwordHash);
    if (!valid) {
      sendValidationError(
        res,
        "Current password is incorrect",
        [{ field: "currentPassword", rule: "invalid" }],
        req.correlationId ?? null,
      );
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword.trim(), 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, updatedAt: new Date() } as any,
    });

    res.json({ message: "Password updated successfully" });
  },
);

// GET /api/auth/notification-preferences  (authenticated)
router.get(
  ["/auth/notification-preferences", "/api/auth/notification-preferences", "/api/v1/auth/notification-preferences"],
  authMiddleware,
  async (req, res): Promise<void> => {
    const user = (await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { settings: true } as any,
    })) as any;

    if (!user) {
      sendNotFound(res, "User not found", req.correlationId ?? null);
      return;
    }

    const settings = ((user as any).settings as Record<string, unknown>) ?? {};
    const prefs = (settings.notifications as Record<string, boolean>) ?? {};

    res.json({
      emailWorkflowStatus: prefs.emailWorkflowStatus ?? true,
      emailExecutionFailures: prefs.emailExecutionFailures ?? true,
      emailWeeklyDigest: prefs.emailWeeklyDigest ?? false,
      inAppWorkflowStatus: prefs.inAppWorkflowStatus ?? true,
      inAppExecutionFailures: prefs.inAppExecutionFailures ?? true,
      inAppConnectorAlerts: prefs.inAppConnectorAlerts ?? true,
    });
  },
);

// PATCH /api/auth/notification-preferences  (authenticated)
router.patch(
  ["/auth/notification-preferences", "/api/auth/notification-preferences", "/api/v1/auth/notification-preferences"],
  authMiddleware,
  async (req, res): Promise<void> => {
    const incoming = req.body as Record<string, boolean>;

    const allowed = new Set([
      "emailWorkflowStatus",
      "emailExecutionFailures",
      "emailWeeklyDigest",
      "inAppWorkflowStatus",
      "inAppExecutionFailures",
      "inAppConnectorAlerts",
    ]);

    const sanitized: Record<string, boolean> = {};
    for (const key of allowed) {
      if (key in incoming) sanitized[key] = Boolean(incoming[key]);
    }

    const user = (await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { settings: true } as any,
    })) as any;

    if (!user) {
      sendNotFound(res, "User not found", req.correlationId ?? null);
      return;
    }

    const existingSettings = ((user as any).settings as Record<string, unknown>) ?? {};
    const existingPrefs = (existingSettings.notifications as Record<string, boolean>) ?? {};

    const merged = { ...existingPrefs, ...sanitized };

    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        settings: { ...existingSettings, notifications: merged } as any,
        updatedAt: new Date(),
      } as any,
    });

    res.json(merged);
  },
);

export default router;

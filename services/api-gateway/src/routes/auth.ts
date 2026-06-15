import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq, and, gt } from "drizzle-orm";
import crypto from "node:crypto";
import {
  db,
  usersTable,
  userMfaTable,
  tenantsTable,
  membershipsTable,
  userRegistrationsTable,
  auditLogTable,
} from "@longox/db";
import {
  authMiddleware,
  getBearerToken,
  revokeToken,
  signToken,
} from "../lib/auth";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/email";

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
    const [existing] = await db
      .select({ id: tenantsTable.id })
      .from(tenantsTable)
      .where(eq(tenantsTable.slug, candidate))
      .limit(1);
    if (!existing) return candidate;
  }
  return `${slug}-${Date.now()}`;
}

router.post(["/auth/register", "/api/auth/register"], async (req, res): Promise<void> => {
  const { name, email, password, organizationName } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    organizationName?: string;
  };

  const trimmedName = name?.trim();
  const trimmedEmail = email?.trim().toLowerCase();
  const trimmedPassword = password?.trim();
  const trimmedOrg = organizationName?.trim();

  if (!trimmedName || !trimmedEmail || !trimmedPassword) {
    res.status(400).json({ error: "Name, email, and password are required" });
    return;
  }

  if (trimmedPassword.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmedEmail)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  const [existingUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, trimmedEmail))
    .limit(1);

  if (existingUser) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const orgName = trimmedOrg || `${trimmedName}'s Workspace`;
  const slug = await uniqueTenantSlug(trimmedOrg || trimmedEmail.split("@")[0]);
  const passwordHash = await bcrypt.hash(trimmedPassword, 10);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  try {
    const result = await db.transaction(async (tx) => {
      const [tenant] = await tx
        .insert(tenantsTable)
        .values({
          name: orgName,
          slug,
          plan: "free",
          isActive: true,
        })
        .returning();

      const [user] = await tx
        .insert(usersTable)
        .values({
          email: trimmedEmail,
          passwordHash,
          name: trimmedName,
          tenantId: tenant.id,
          role: "admin",
          isActive: true,
          emailVerificationToken: verificationToken,
        })
        .returning();

      await tx.insert(membershipsTable).values({
        tenantId: tenant.id,
        userId: user.id,
        status: "active",
      });

      await tx.insert(userRegistrationsTable).values({
        userId: user.id,
        tenantId: tenant.id,
        email: trimmedEmail,
        organizationName: orgName,
        status: "completed",
        ipAddress: req.ip ?? null,
        userAgent: req.get("user-agent") ?? null,
      });

      await tx.insert(auditLogTable).values({
        tenantId: tenant.id,
        action: "user.registered",
        resourceType: "user",
        resourceId: String(user.id),
        actorType: "user",
        actorId: String(user.id),
        metadata: { tenantId: tenant.id, email: trimmedEmail },
      });

      return { tenant, user, verificationToken };
    });

    const authUser = {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      tenantId: result.user.tenantId ?? null,
      role: result.user.role,
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
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post(["/auth/login", "/api/auth/login"], async (req, res): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email?.trim() || !password?.trim()) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.trim().toLowerCase()))
    .limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (!user.isActive) {
    res.status(401).json({ error: "Account is disabled" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  await db
    .update(usersTable)
    .set({ lastLoginAt: new Date() })
    .where(eq(usersTable.id, user.id));

  const [mfa] = await db
    .select()
    .from(userMfaTable)
    .where(
      and(eq(userMfaTable.userId, user.id), eq(userMfaTable.enabled, true)),
    )
    .limit(1);

  const requiresMfa = !!mfa;

  const authUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    tenantId: user.tenantId ?? null,
    role: user.role,
  };
  const token = signToken(authUser);

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId,
      role: user.role,
    },
    requiresMfa,
  });
});

router.post(["/auth/logout", "/api/auth/logout"], authMiddleware, (req, res): void => {
  const token = getBearerToken(req);
  if (token) revokeToken(token);
  res.json({ message: "Logged out successfully" });
});

router.get(["/auth/me", "/api/auth/me"], authMiddleware, async (req, res): Promise<void> => {
  const [user] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      tenantId: usersTable.tenantId,
      isActive: usersTable.isActive,
      lastLoginAt: usersTable.lastLoginAt,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.id))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
});

// GET /api/auth/verify-email?token=...  (public)
router.get(
  ["/auth/verify-email", "/api/auth/verify-email"],
  async (req, res): Promise<void> => {
    const token = req.query.token as string | undefined;
    if (!token) {
      res.status(400).json({ error: "Verification token is required" });
      return;
    }

    const [user] = await db
      .select({ id: usersTable.id, emailVerifiedAt: usersTable.emailVerifiedAt })
      .from(usersTable)
      .where(eq(usersTable.emailVerificationToken, token))
      .limit(1);

    if (!user) {
      res.status(400).json({ error: "Invalid or expired verification link" });
      return;
    }

    if (user.emailVerifiedAt) {
      res.json({ message: "Email already verified" });
      return;
    }

    await db
      .update(usersTable)
      .set({ emailVerifiedAt: new Date(), emailVerificationToken: null })
      .where(eq(usersTable.id, user.id));

    res.json({ message: "Email verified successfully" });
  },
);

// POST /api/auth/resend-verification  (authenticated)
router.post(
  ["/auth/resend-verification", "/api/auth/resend-verification"],
  authMiddleware,
  async (req, res): Promise<void> => {
    const [user] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        emailVerifiedAt: usersTable.emailVerifiedAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.id))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.emailVerifiedAt) {
      res.status(400).json({ error: "Email is already verified" });
      return;
    }

    const newToken = crypto.randomBytes(32).toString("hex");
    await db
      .update(usersTable)
      .set({ emailVerificationToken: newToken })
      .where(eq(usersTable.id, user.id));

    sendVerificationEmail(user.email, user.name, newToken).catch((err) =>
      console.error("[Email] Failed to resend verification email:", err),
    );

    res.json({ message: "Verification email sent" });
  },
);

// POST /api/auth/forgot-password  (public)
router.post(
  ["/auth/forgot-password", "/api/auth/forgot-password"],
  async (req, res): Promise<void> => {
    const { email } = req.body as { email?: string };
    if (!email?.trim()) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const [user] = await db
      .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name, isActive: usersTable.isActive })
      .from(usersTable)
      .where(eq(usersTable.email, email.trim().toLowerCase()))
      .limit(1);

    // Always respond with success to avoid email enumeration
    if (!user || !user.isActive) {
      res.json({ message: "If that email exists, a reset link has been sent" });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db
      .update(usersTable)
      .set({ passwordResetToken: resetToken, passwordResetTokenExpiresAt: expiresAt })
      .where(eq(usersTable.id, user.id));

    sendPasswordResetEmail(user.email, user.name, resetToken).catch((err) =>
      console.error("[Email] Failed to send password reset email:", err),
    );

    res.json({ message: "If that email exists, a reset link has been sent" });
  },
);

// POST /api/auth/reset-password  (public)
router.post(
  ["/auth/reset-password", "/api/auth/reset-password"],
  async (req, res): Promise<void> => {
    const { token, password } = req.body as { token?: string; password?: string };

    if (!token || !password?.trim()) {
      res.status(400).json({ error: "Token and new password are required" });
      return;
    }

    if (password.trim().length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const now = new Date();
    const [user] = await db
      .select({ id: usersTable.id, passwordResetTokenExpiresAt: usersTable.passwordResetTokenExpiresAt })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.passwordResetToken, token),
          gt(usersTable.passwordResetTokenExpiresAt, now),
        ),
      )
      .limit(1);

    if (!user) {
      res.status(400).json({ error: "Invalid or expired reset link" });
      return;
    }

    const passwordHash = await bcrypt.hash(password.trim(), 10);

    await db
      .update(usersTable)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
      })
      .where(eq(usersTable.id, user.id));

    res.json({ message: "Password reset successfully" });
  },
);

export default router;


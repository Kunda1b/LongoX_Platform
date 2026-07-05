import { Router, type IRouter } from "express";
import crypto from "node:crypto";
import { prisma } from "@longox/db/prisma";
import { authMiddleware, signToken } from "../lib/auth";
import { authorize } from "@longox/shared-rbac";
import { sendInvitationEmail } from "../lib/email";

const router: IRouter = Router();

// ─── List pending invitations for the current workspace ──────────────────────

router.get(
  ["/invitations", "/api/invitations"],
  authMiddleware,
  authorize({ resource: "users", action: "read" }),
  async (req, res): Promise<void> => {
    const tenantId = req.user!.tenantId;
    if (!tenantId) {
      res.status(403).json({ error: "No workspace context" });
      return;
    }

    const rows = (await prisma.workspaceInvitation.findMany({
      where: { tenantId, status: "pending" },
      orderBy: { createdAt: "asc" },
      include: {
        role: { select: { name: true } },
      } as any,
    })) as any[];

    // Fetch invitedBy user names in a second query (no direct relation on invitation)
    const inviterIds = Array.from(
      new Set(rows.map((r) => r.invitedBy).filter(Boolean)),
    ) as string[];
    const inviters = inviterIds.length
      ? ((await prisma.user.findMany({
          where: { id: { in: inviterIds } },
          select: { id: true, name: true },
        })) as any[])
      : [];
    const inviterMap = new Map(inviters.map((u) => [u.id, u.name]));

    res.json(
      rows.map((r) => ({
        id: r.id,
        email: r.email,
        role: { id: r.roleId, name: r.role?.name ?? "" },
        status: r.status,
        invitedBy: inviterMap.get(r.invitedBy) ?? null,
        expiresAt:
          r.expiresAt instanceof Date
            ? r.expiresAt.toISOString()
            : new Date(r.expiresAt).toISOString(),
        createdAt:
          r.createdAt instanceof Date
            ? r.createdAt.toISOString()
            : new Date(r.createdAt).toISOString(),
      })),
    );
  },
);

// ─── Send an invitation ──────────────────────────────────────────────────────

router.post(
  ["/invitations", "/api/invitations"],
  authMiddleware,
  authorize({ resource: "users", action: "write" }),
  async (req, res): Promise<void> => {
    const tenantId = req.user!.tenantId;
    if (!tenantId) {
      res.status(403).json({ error: "No workspace context" });
      return;
    }

    const { email, roleId } = req.body as { email?: string; roleId?: string };
    const trimmedEmail = email?.trim().toLowerCase();

    if (!trimmedEmail || !roleId) {
      res.status(400).json({ error: "email and roleId are required" });
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      res.status(400).json({ error: "Invalid email address" });
      return;
    }

    // Check role exists and is a customer role (no platform roles via invite)
    const role = (await prisma.rbacRole.findUnique({
      where: { id: roleId },
      select: { id: true, name: true },
    })) as any;

    if (!role) {
      res.status(404).json({ error: "Role not found" });
      return;
    }

    const platformRoles = new Set(["platform_admin", "support", "finance"]);
    if (platformRoles.has(role.name.toLowerCase())) {
      res.status(403).json({ error: "Cannot invite users to platform roles" });
      return;
    }

    // Owner cannot be assigned via invite — only through workspace creation
    if (role.name.toLowerCase() === "owner") {
      res.status(403).json({
        error: "Cannot invite users as Owner. Transfer ownership instead.",
      });
      return;
    }

    // Check if user is already a member
    const existingMember = (await prisma.user.findFirst({
      where: { email: trimmedEmail, tenantId } as any,
      select: { id: true },
    })) as any;

    if (existingMember) {
      res
        .status(409)
        .json({ error: "This user is already a member of the workspace" });
      return;
    }

    // Cancel any existing pending invite for this email+tenant
    await prisma.workspaceInvitation.updateMany({
      where: {
        tenantId,
        email: trimmedEmail,
        status: "pending",
      },
      data: { status: "cancelled" },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = (await prisma.workspaceInvitation.create({
      data: {
        tenantId,
        email: trimmedEmail,
        roleId: role.id,
        invitedBy: req.user!.id,
        token,
        status: "pending",
        expiresAt,
      },
    })) as any;

    // Look up workspace name for email
    const tenant = (await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    })) as any;

    await prisma.auditLog.create({
      data: {
        actorId: String(req.user!.id),
        action: "invitation.sent",
        targetType: "invitation",
        targetId: String(invitation.id),
        diffJson: {
          email: trimmedEmail,
          roleId: role.id,
          roleName: role.name,
          tenantId,
          actorType: "user",
        } as any,
      } as any,
    });

    sendInvitationEmail(
      trimmedEmail,
      req.user!.name,
      tenant?.name ?? "your workspace",
      role.name,
      token,
    ).catch((err) =>
      console.error("[Email] Failed to send invitation email:", err),
    );

    res.status(201).json({
      id: invitation.id,
      email: invitation.email,
      role: { id: role.id, name: role.name },
      status: invitation.status,
      expiresAt:
        invitation.expiresAt instanceof Date
          ? invitation.expiresAt.toISOString()
          : new Date(invitation.expiresAt).toISOString(),
      createdAt:
        invitation.createdAt instanceof Date
          ? invitation.createdAt.toISOString()
          : new Date(invitation.createdAt).toISOString(),
    });
  },
);

// ─── Cancel an invitation ────────────────────────────────────────────────────

router.delete(
  ["/invitations/:id", "/api/invitations/:id"],
  authMiddleware,
  authorize({ resource: "users", action: "write" }),
  async (req, res): Promise<void> => {
    const tenantId = req.user!.tenantId;
    const id = String(req.params.id);

    const inv = (await prisma.workspaceInvitation.findFirst({
      where: { id, tenantId: tenantId! },
      select: { id: true },
    })) as any;

    if (!inv) {
      res.status(404).json({ error: "Invitation not found" });
      return;
    }

    await prisma.workspaceInvitation.update({
      where: { id },
      data: { status: "cancelled" },
    });

    res.status(204).end();
  },
);

// ─── Accept an invitation (public — no auth required yet) ────────────────────

router.get(
  ["/invitations/accept", "/api/invitations/accept"],
  async (req, res): Promise<void> => {
    const token = req.query.token as string | undefined;
    if (!token) {
      res.status(400).json({ error: "Invitation token is required" });
      return;
    }

    const now = new Date();
    const inv = (await prisma.workspaceInvitation.findFirst({
      where: { token },
    })) as any;

    if (!inv) {
      res.status(404).json({ error: "Invalid or expired invitation link" });
      return;
    }

    if (inv.status !== "pending") {
      res
        .status(400)
        .json({ error: `Invitation has already been ${inv.status}` });
      return;
    }

    if (inv.expiresAt < now) {
      await prisma.workspaceInvitation.update({
        where: { id: inv.id },
        data: { status: "expired" },
      });
      res.status(400).json({ error: "Invitation link has expired" });
      return;
    }

    // Check if user with this email already exists
    const existingUser = (await prisma.user.findUnique({
      where: { email: inv.email },
    })) as any;

    const role = (await prisma.rbacRole.findUnique({
      where: { id: inv.roleId },
      select: { id: true, name: true },
    })) as any;

    const tenant = (await prisma.tenant.findUnique({
      where: { id: inv.tenantId },
      select: { name: true, slug: true },
    })) as any;

    if (existingUser) {
      // User exists — add them to the workspace
      if (existingUser.tenantId === inv.tenantId) {
        res
          .status(409)
          .json({ error: "You are already a member of this workspace" });
        return;
      }

      await prisma.$transaction(async (tx: any) => {
        // Update user's tenantId if they don't have one
        if (!existingUser.tenantId) {
          await tx.user.update({
            where: { id: existingUser.id },
            data: {
              tenantId: inv.tenantId,
              role: role?.name ?? "viewer",
              updatedAt: new Date(),
            } as any,
          });
        }

        // Assign role (userRolesTable → membership)
        await tx.membership
          .create({
            data: {
              userId: String(existingUser.id),
              roleId: inv.roleId,
              tenantId: inv.tenantId,
            } as any,
          })
          .catch(() => {
            // Ignore unique-constraint conflicts (onConflictDoNothing)
          });

        // Add to memberships
        await tx.membership
          .create({
            data: {
              tenantId: inv.tenantId,
              userId: existingUser.id,
              roleId: inv.roleId,
              invitedBy: inv.invitedBy,
              status: "active",
            } as any,
          })
          .catch(() => {
            // Ignore unique-constraint conflicts (onConflictDoNothing)
          });

        // Mark invitation as accepted
        await tx.workspaceInvitation.update({
          where: { id: inv.id },
          data: { status: "accepted", acceptedAt: new Date() },
        });

        await tx.auditLog.create({
          data: {
            actorId: String(existingUser.id),
            action: "invitation.accepted",
            targetType: "invitation",
            targetId: String(inv.id),
            diffJson: {
              email: inv.email,
              roleId: inv.roleId,
              tenantId: inv.tenantId,
              actorType: "user",
            } as any,
          } as any,
        });
      });

      const authUser = {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        tenantId: inv.tenantId,
        role: role?.name ?? existingUser.role,
      };
      const jwtToken = signToken(authUser);

      res.json({
        message: "Invitation accepted",
        token: jwtToken,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          tenantId: inv.tenantId,
          role: role?.name ?? existingUser.role,
          emailVerifiedAt: existingUser.emailVerifiedAt
            ? existingUser.emailVerifiedAt instanceof Date
              ? existingUser.emailVerifiedAt.toISOString()
              : new Date(existingUser.emailVerifiedAt).toISOString()
            : null,
          avatarUrl: existingUser.avatarUrl ?? null,
        },
        workspace: tenant,
      });
    } else {
      // User does not exist — return invitation details so frontend can show registration form
      res.json({
        requiresRegistration: true,
        email: inv.email,
        role: role?.name ?? "viewer",
        workspace: tenant,
        token,
      });
    }
  },
);

// ─── Accept invitation after registration (called after new user registers) ──

router.post(
  ["/invitations/accept", "/api/invitations/accept"],
  authMiddleware,
  async (req, res): Promise<void> => {
    const { token } = req.body as { token?: string };
    if (!token) {
      res.status(400).json({ error: "token is required" });
      return;
    }

    const now = new Date();
    const inv = (await prisma.workspaceInvitation.findFirst({
      where: { token },
    })) as any;

    if (!inv || inv.status !== "pending" || inv.expiresAt < now) {
      res.status(400).json({ error: "Invalid or expired invitation" });
      return;
    }

    if (inv.email !== req.user!.email) {
      res.status(403).json({
        error: "This invitation was sent to a different email address",
      });
      return;
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { id: req.user!.id },
        data: { tenantId: inv.tenantId, updatedAt: new Date() } as any,
      });

      await tx.membership
        .create({
          data: {
            userId: String(req.user!.id),
            roleId: inv.roleId,
            tenantId: inv.tenantId,
          } as any,
        })
        .catch(() => {
          // Ignore unique-constraint conflicts (onConflictDoNothing)
        });

      await tx.membership
        .create({
          data: {
            tenantId: inv.tenantId,
            userId: req.user!.id,
            roleId: inv.roleId,
            invitedBy: inv.invitedBy,
            status: "active",
          } as any,
        })
        .catch(() => {
          // Ignore unique-constraint conflicts (onConflictDoNothing)
        });

      await tx.workspaceInvitation.update({
        where: { id: inv.id },
        data: { status: "accepted", acceptedAt: new Date() },
      });
    });

    const role = (await prisma.rbacRole.findUnique({
      where: { id: inv.roleId },
      select: { name: true },
    })) as any;

    const authUser = {
      id: req.user!.id,
      email: req.user!.email,
      name: req.user!.name,
      tenantId: inv.tenantId,
      role: role?.name ?? "viewer",
    };
    const jwtToken = signToken(authUser);

    res.json({
      token: jwtToken,
      user: { ...authUser, emailVerifiedAt: null, avatarUrl: null },
    });
  },
);

export default router;

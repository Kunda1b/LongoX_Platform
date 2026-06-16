import { Router, type IRouter } from "express";
import crypto from "node:crypto";
import { eq, and } from "drizzle-orm";
import {
  db,
  workspaceInvitationsTable,
  usersTable,
  tenantsTable,
  membershipsTable,
  userRolesTable,
  rolesTable,
  auditLogTable,
} from "@longox/db";
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

    const rows = await db
      .select({
        id: workspaceInvitationsTable.id,
        email: workspaceInvitationsTable.email,
        roleId: workspaceInvitationsTable.roleId,
        roleName: rolesTable.name,
        status: workspaceInvitationsTable.status,
        expiresAt: workspaceInvitationsTable.expiresAt,
        createdAt: workspaceInvitationsTable.createdAt,
        invitedByName: usersTable.name,
      })
      .from(workspaceInvitationsTable)
      .innerJoin(rolesTable, eq(workspaceInvitationsTable.roleId, rolesTable.id))
      .innerJoin(usersTable, eq(workspaceInvitationsTable.invitedBy, usersTable.id))
      .where(
        and(
          eq(workspaceInvitationsTable.tenantId, tenantId),
          eq(workspaceInvitationsTable.status, "pending"),
        ),
      )
      .orderBy(workspaceInvitationsTable.createdAt);

    res.json(
      rows.map((r) => ({
        id: r.id,
        email: r.email,
        role: { id: r.roleId, name: r.roleName },
        status: r.status,
        invitedBy: r.invitedByName,
        expiresAt: r.expiresAt.toISOString(),
        createdAt: r.createdAt.toISOString(),
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

    const { email, roleId } = req.body as { email?: string; roleId?: number };
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
    const [role] = await db
      .select({ id: rolesTable.id, name: rolesTable.name })
      .from(rolesTable)
      .where(eq(rolesTable.id, roleId))
      .limit(1);

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
      res.status(403).json({ error: "Cannot invite users as Owner. Transfer ownership instead." });
      return;
    }

    // Check if user is already a member
    const [existingMember] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(and(eq(usersTable.email, trimmedEmail), eq(usersTable.tenantId, tenantId)))
      .limit(1);

    if (existingMember) {
      res.status(409).json({ error: "This user is already a member of the workspace" });
      return;
    }

    // Cancel any existing pending invite for this email+tenant
    await db
      .update(workspaceInvitationsTable)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(workspaceInvitationsTable.tenantId, tenantId),
          eq(workspaceInvitationsTable.email, trimmedEmail),
          eq(workspaceInvitationsTable.status, "pending"),
        ),
      );

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const [invitation] = await db
      .insert(workspaceInvitationsTable)
      .values({
        tenantId,
        email: trimmedEmail,
        roleId: role.id,
        invitedBy: req.user!.id,
        token,
        status: "pending",
        expiresAt,
      })
      .returning();

    // Look up workspace name for email
    const [tenant] = await db
      .select({ name: tenantsTable.name })
      .from(tenantsTable)
      .where(eq(tenantsTable.id, tenantId))
      .limit(1);

    await db.insert(auditLogTable).values({
      tenantId,
      action: "invitation.sent",
      resourceType: "invitation",
      resourceId: String(invitation.id),
      actorType: "user",
      actorId: String(req.user!.id),
      metadata: { email: trimmedEmail, roleId: role.id, roleName: role.name },
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
      expiresAt: invitation.expiresAt.toISOString(),
      createdAt: invitation.createdAt.toISOString(),
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
    const id = Number(req.params.id);

    const [inv] = await db
      .select({ id: workspaceInvitationsTable.id })
      .from(workspaceInvitationsTable)
      .where(
        and(
          eq(workspaceInvitationsTable.id, id),
          eq(workspaceInvitationsTable.tenantId, tenantId!),
        ),
      )
      .limit(1);

    if (!inv) {
      res.status(404).json({ error: "Invitation not found" });
      return;
    }

    await db
      .update(workspaceInvitationsTable)
      .set({ status: "cancelled" })
      .where(eq(workspaceInvitationsTable.id, id));

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
    const [inv] = await db
      .select()
      .from(workspaceInvitationsTable)
      .where(eq(workspaceInvitationsTable.token, token))
      .limit(1);

    if (!inv) {
      res.status(404).json({ error: "Invalid or expired invitation link" });
      return;
    }

    if (inv.status !== "pending") {
      res.status(400).json({ error: `Invitation has already been ${inv.status}` });
      return;
    }

    if (inv.expiresAt < now) {
      await db
        .update(workspaceInvitationsTable)
        .set({ status: "expired" })
        .where(eq(workspaceInvitationsTable.id, inv.id));
      res.status(400).json({ error: "Invitation link has expired" });
      return;
    }

    // Check if user with this email already exists
    const [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, inv.email))
      .limit(1);

    const [role] = await db
      .select({ id: rolesTable.id, name: rolesTable.name })
      .from(rolesTable)
      .where(eq(rolesTable.id, inv.roleId))
      .limit(1);

    const [tenant] = await db
      .select({ name: tenantsTable.name, slug: tenantsTable.slug })
      .from(tenantsTable)
      .where(eq(tenantsTable.id, inv.tenantId))
      .limit(1);

    if (existingUser) {
      // User exists — add them to the workspace
      if (existingUser.tenantId === inv.tenantId) {
        res.status(409).json({ error: "You are already a member of this workspace" });
        return;
      }

      await db.transaction(async (tx) => {
        // Update user's tenantId if they don't have one
        if (!existingUser.tenantId) {
          await tx
            .update(usersTable)
            .set({ tenantId: inv.tenantId, role: role?.name ?? "viewer", updatedAt: new Date() })
            .where(eq(usersTable.id, existingUser.id));
        }

        // Assign role
        await tx
          .insert(userRolesTable)
          .values({
            userId: String(existingUser.id),
            roleId: inv.roleId,
            tenantId: inv.tenantId,
          })
          .onConflictDoNothing();

        // Add to memberships
        await tx
          .insert(membershipsTable)
          .values({
            tenantId: inv.tenantId,
            userId: existingUser.id,
            roleId: inv.roleId,
            invitedBy: inv.invitedBy,
            status: "active",
          })
          .onConflictDoNothing();

        // Mark invitation as accepted
        await tx
          .update(workspaceInvitationsTable)
          .set({ status: "accepted", acceptedAt: new Date() })
          .where(eq(workspaceInvitationsTable.id, inv.id));

        await tx.insert(auditLogTable).values({
          tenantId: inv.tenantId,
          action: "invitation.accepted",
          resourceType: "invitation",
          resourceId: String(inv.id),
          actorType: "user",
          actorId: String(existingUser.id),
          metadata: { email: inv.email, roleId: inv.roleId },
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
          emailVerifiedAt: existingUser.emailVerifiedAt?.toISOString() ?? null,
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
    const [inv] = await db
      .select()
      .from(workspaceInvitationsTable)
      .where(eq(workspaceInvitationsTable.token, token))
      .limit(1);

    if (!inv || inv.status !== "pending" || inv.expiresAt < now) {
      res.status(400).json({ error: "Invalid or expired invitation" });
      return;
    }

    if (inv.email !== req.user!.email) {
      res.status(403).json({ error: "This invitation was sent to a different email address" });
      return;
    }

    await db.transaction(async (tx) => {
      await tx
        .update(usersTable)
        .set({ tenantId: inv.tenantId, updatedAt: new Date() })
        .where(eq(usersTable.id, req.user!.id));

      await tx
        .insert(userRolesTable)
        .values({ userId: String(req.user!.id), roleId: inv.roleId, tenantId: inv.tenantId })
        .onConflictDoNothing();

      await tx
        .insert(membershipsTable)
        .values({
          tenantId: inv.tenantId,
          userId: req.user!.id,
          roleId: inv.roleId,
          invitedBy: inv.invitedBy,
          status: "active",
        })
        .onConflictDoNothing();

      await tx
        .update(workspaceInvitationsTable)
        .set({ status: "accepted", acceptedAt: new Date() })
        .where(eq(workspaceInvitationsTable.id, inv.id));
    });

    const [role] = await db
      .select({ name: rolesTable.name })
      .from(rolesTable)
      .where(eq(rolesTable.id, inv.roleId))
      .limit(1);

    const authUser = {
      id: req.user!.id,
      email: req.user!.email,
      name: req.user!.name,
      tenantId: inv.tenantId,
      role: role?.name ?? "viewer",
    };
    const jwtToken = signToken(authUser);

    res.json({ token: jwtToken, user: { ...authUser, emailVerifiedAt: null, avatarUrl: null } });
  },
);

export default router;

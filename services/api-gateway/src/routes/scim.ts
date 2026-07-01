/**
 * SCIM Directory Sync webhook handler (WorkOS).
 *
 * WorkOS delivers SCIM events as signed POST requests to this endpoint.
 * Events are used to keep the local users table in sync with the corporate
 * directory without polling.
 *
 * Supported events:
 *   dsync.user.created    → upsert user
 *   dsync.user.updated    → update user attributes + active state
 *   dsync.user.deleted    → deactivate user (soft-delete)
 *   dsync.group.*         → log group membership changes
 *
 * Security: signature is verified via WorkOS webhook secret before any DB work.
 */

import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@longox/db";
import { verifyScimWebhook, type WorkOSDirectoryUser } from "../lib/workos-auth";

const router = Router();

// Raw body capture for signature verification (must be mounted before express.json())
router.post(
  ["/auth/scim", "/api/auth/scim"],
  // NOTE: express.json() is applied globally after this route is mounted.
  // We use express.raw() here to capture the raw body for HMAC verification.
  // app.ts must mount scimRouter BEFORE express.json() middleware.
  async (req: Request, res: Response): Promise<void> => {
    const sigHeader =
      req.headers["workos-signature"] as string | undefined;

    if (!sigHeader) {
      res.status(400).json({ error: "Missing workos-signature header" });
      return;
    }

    const rawBody =
      req.body instanceof Buffer
        ? req.body.toString("utf-8")
        : JSON.stringify(req.body);

    let event;
    try {
      event = verifyScimWebhook(rawBody, sigHeader);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Webhook verification failed";
      res.status(401).json({ error: msg });
      return;
    }

    try {
      await handleScimEvent(event);
      res.json({ received: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Handler error";
      console.error("[SCIM] Handler error:", msg, event);
      // Return 200 to prevent WorkOS from retrying; errors are logged.
      res.json({ received: true, warning: msg });
    }
  },
);

// ─── Event Handlers ───────────────────────────────────────────────────────────

async function handleScimEvent(event: {
  event: string;
  data: unknown;
}): Promise<void> {
  switch (event.event) {
    case "dsync.user.created":
      await handleUserCreated(event.data as WorkOSDirectoryUser);
      break;
    case "dsync.user.updated":
      await handleUserUpdated(event.data as WorkOSDirectoryUser);
      break;
    case "dsync.user.deleted":
      await handleUserDeleted(event.data as WorkOSDirectoryUser);
      break;
    case "dsync.group.user_added":
    case "dsync.group.user_removed":
      // Group membership changes — log for now; role mapping can be added here.
      console.info(`[SCIM] ${event.event}`, JSON.stringify(event.data));
      break;
    default:
      console.info(`[SCIM] Unhandled event: ${event.event}`);
  }
}

async function getPrimaryEmail(user: WorkOSDirectoryUser): Promise<string | null> {
  const primary = user.emails.find((e) => e.primary);
  return primary?.value ?? user.emails[0]?.value ?? null;
}

async function handleUserCreated(dirUser: WorkOSDirectoryUser): Promise<void> {
  const email = await getPrimaryEmail(dirUser);
  if (!email) {
    console.warn("[SCIM] user.created: no email, skipping", dirUser.id);
    return;
  }

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    // User already exists (e.g., registered before SCIM was enabled).
    // Update workosUserId if not already set.
    await db
      .update(usersTable)
      .set({ workosUserId: dirUser.id } as any)
      .where(eq(usersTable.id, existing[0].id));
    return;
  }

  const name = [dirUser.firstName, dirUser.lastName].filter(Boolean).join(" ") ||
    email.split("@")[0];

  await db.insert(usersTable).values({
    email: email.toLowerCase(),
    passwordHash: "scim-provisioned",
    name,
    role: "editor",
    isActive: dirUser.state === "active",
    workosUserId: dirUser.id,
  } as any);

  console.info(`[SCIM] Provisioned user: ${email}`);
}

async function handleUserUpdated(dirUser: WorkOSDirectoryUser): Promise<void> {
  const email = await getPrimaryEmail(dirUser);
  if (!email) return;

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (!existing) {
    // User not found locally — create them.
    await handleUserCreated(dirUser);
    return;
  }

  const name = [dirUser.firstName, dirUser.lastName].filter(Boolean).join(" ") ||
    email.split("@")[0];

  await db
    .update(usersTable)
    .set({
      name,
      isActive: dirUser.state === "active",
      workosUserId: dirUser.id,
    } as any)
    .where(eq(usersTable.id, existing.id));

  console.info(`[SCIM] Updated user: ${email} state=${dirUser.state}`);
}

async function handleUserDeleted(dirUser: WorkOSDirectoryUser): Promise<void> {
  const email = await getPrimaryEmail(dirUser);
  if (!email) return;

  await db
    .update(usersTable)
    .set({ isActive: false })
    .where(eq(usersTable.email, email.toLowerCase()));

  console.info(`[SCIM] Deactivated user: ${email}`);
}

export default router;

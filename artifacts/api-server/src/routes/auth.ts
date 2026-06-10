import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";
import { db, usersTable, userMfaTable } from "@autoflow/db";
import { signToken } from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email?.trim() || !password?.trim()) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable)
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

  await db.update(usersTable).set({ lastLoginAt: new Date() }).where(eq(usersTable.id, user.id));

  const [mfa] = await db.select().from(userMfaTable)
    .where(and(eq(userMfaTable.userId, user.id), eq(userMfaTable.enabled, true)))
    .limit(1);

  const requiresMfa = !!mfa;

  const authUser = { id: user.id, email: user.email, name: user.name, tenantId: user.tenantId ?? null, role: user.role };
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

router.post("/auth/logout", (_req, res): void => {
  res.json({ message: "Logged out successfully" });
});

export default router;

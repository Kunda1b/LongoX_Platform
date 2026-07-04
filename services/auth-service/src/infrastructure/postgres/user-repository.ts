import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, tenantsTable } from "@longox/db";
import type { UserRepository } from "../../domain/user/user-repository";
import type {
  UserRecord,
  UserProfile,
} from "../../domain/user/user.entity";

let seeded = false;

async function ensureSeedUser(): Promise<void> {
  if (seeded) return;
  seeded = true;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable);
  if (count > 0) return;

  const [tenant] = await db.select().from(tenantsTable).limit(1);
  const tenantId = tenant?.id ?? undefined;

  const hash = await bcrypt.hash("admin123", 10);
  await db.insert(usersTable).values([
    {
      email: "admin@longox.io",
      passwordHash: hash,
      name: "Admin User",
      tenantId,
      role: "admin",
    },
    {
      email: "editor@longox.io",
      passwordHash: hash,
      name: "Editor User",
      tenantId,
      role: "editor",
    },
    {
      email: "viewer@longox.io",
      passwordHash: hash,
      name: "Viewer User",
      tenantId,
      role: "viewer",
    },
  ]);
}

export class PostgresUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    await ensureSeedUser();
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.trim().toLowerCase()))
      .limit(1);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId ?? null,
      role: user.role,
      passwordHash: user.passwordHash,
      isActive: user.isActive,
    };
  }

  async findById(id: string): Promise<UserRecord | null> {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId ?? null,
      role: user.role,
      passwordHash: user.passwordHash,
      isActive: user.isActive,
    };
  }

  async findProfileById(id: string): Promise<UserProfile | null> {
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
      .where(eq(usersTable.id, id))
      .limit(1);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId ?? null,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt ?? null,
      createdAt: user.createdAt,
    };
  }

  async updateLastLogin(id: string): Promise<void> {
    await db
      .update(usersTable)
      .set({ lastLoginAt: new Date() })
      .where(eq(usersTable.id, id));
  }

  async isActive(id: string): Promise<boolean> {
    const [user] = await db
      .select({ isActive: usersTable.isActive })
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
    return Boolean(user?.isActive);
  }
}

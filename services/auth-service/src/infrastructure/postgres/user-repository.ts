/**
 * Prisma-based user repository for auth-service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 */

import bcrypt from "bcryptjs";
import { prisma } from "@longox/db/prisma";
import type { UserRepository } from "../../domain/user/user-repository";
import type {
  UserRecord,
  UserProfile,
} from "../../domain/user/user.entity";

let seeded = false;

async function ensureSeedUser(): Promise<void> {
  if (seeded) return;
  seeded = true;

  const count = await prisma.user.count();
  if (count > 0) return;

  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: "Default Workspace",
        slug: "default",
        planId: "starter",
      } as any,
    });
  }

  const hash = await bcrypt.hash("admin123", 10);
  const seedUsers = [
    { email: "admin@longox.io", name: "Admin User", role: "admin" },
    { email: "editor@longox.io", name: "Editor User", role: "editor" },
    { email: "viewer@longox.io", name: "Viewer User", role: "viewer" },
  ];

  for (const u of seedUsers) {
    await prisma.user.create({
      data: {
        email: u.email,
        passwordHash: hash,
        name: u.name,
        status: "active",
      } as any,
    });
  }
}

export class PostgresUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    await ensureSeedUser();
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: (user as any).tenantId ?? null,
      role: (user as any).role ?? "viewer",
      passwordHash: user.passwordHash,
      isActive: user.status === "active",
    };
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: (user as any).tenantId ?? null,
      role: (user as any).role ?? "viewer",
      passwordHash: user.passwordHash,
      isActive: user.status === "active",
    };
  }

  async findProfileById(id: string): Promise<UserProfile | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: (user as any).role ?? "viewer",
      tenantId: (user as any).tenantId ?? null,
      isActive: user.status === "active",
      lastLoginAt: user.lastLoginAt ?? null,
      createdAt: user.createdAt,
    };
  }

  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async isActive(id: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { status: true },
    });
    return user?.status === "active";
  }
}

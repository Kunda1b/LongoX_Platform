import { pgTable, text, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const rolesTable = pgTable("roles", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  description: text("description"),
  tenantId: text("tenant_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const permissionsTable = pgTable("permissions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  resource: text("resource").notNull(),
  action: text("action").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const rolePermissionsTable = pgTable(
  "role_permissions",
  {
    roleId: text("role_id").notNull(),
    permissionId: text("permission_id").notNull(),
  },
  (t) => [unique().on(t.roleId, t.permissionId)],
);

export const userRolesTable = pgTable("user_roles", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull(),
  roleId: text("role_id").notNull(),
  tenantId: text("tenant_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type RoleRecord = typeof rolesTable.$inferSelect;
export type PermissionRecord = typeof permissionsTable.$inferSelect;
export type UserRoleRecord = typeof userRolesTable.$inferSelect;

import { pgTable, text, serial } from "drizzle-orm/pg-core";
export const rbacPermissionsTable = pgTable("rbac_permissions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description"),
  group: text("group").notNull(),
});

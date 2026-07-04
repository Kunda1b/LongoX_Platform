import { pgTable, text } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
export const rbacPermissionsTable = pgTable("rbac_permissions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  code: text("code").notNull().unique(),
  description: text("description"),
  group: text("group").notNull(),
});

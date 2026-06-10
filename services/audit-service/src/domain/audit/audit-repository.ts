import type { AuditEntry, AuditLogFilter } from "./audit-entry.entity";

export interface AuditRepository {
  findAll(filter: AuditLogFilter): Promise<AuditEntry[]>;
}

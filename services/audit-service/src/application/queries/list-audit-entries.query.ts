import type { AuditRepository } from "../../domain/audit/audit-repository";
import type {
  AuditEntry,
  AuditLogFilter,
} from "../../domain/audit/audit-entry.entity";

export class ListAuditEntriesQuery {
  constructor(private readonly repository: AuditRepository) {}

  async execute(filter: AuditLogFilter): Promise<AuditEntry[]> {
    return this.repository.findAll(filter);
  }
}

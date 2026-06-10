export interface AuditEntry {
  id: number;
  actorType: string;
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogFilter {
  resourceType?: string;
  resourceId?: string;
  action?: string;
  limit?: number;
}

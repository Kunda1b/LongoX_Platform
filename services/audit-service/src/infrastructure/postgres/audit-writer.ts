import { db, auditLogTable } from "@longox/db";

export interface AuditContext {
  tenantId: string;
  actorType: string;
  actorId?: string | null;
  correlationId?: string | null;
}

export interface WriteAuditParams {
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown> | null;
  context: AuditContext;
}

export function actorFromUser(user?: {
  id: string;
  role?: string;
}): { actorType: string; actorId: string | null } {
  if (!user) {
    return { actorType: "system", actorId: null };
  }
  return { actorType: "user", actorId: String(user.id) };
}

export async function writeAuditEntry(params: WriteAuditParams): Promise<void> {
  const { action, resourceType, resourceId, metadata, context } = params;

  await db.insert(auditLogTable).values({
    tenantId: context.tenantId,
    actorType: context.actorType,
    actorId: context.actorId ?? null,
    action,
    resourceType,
    resourceId,
    metadata: metadata ?? null,
    correlationId: context.correlationId ?? null,
  } as any);
}

/** @deprecated Use writeAuditEntry with AuditContext instead */
export async function writeAudit(
  action: string,
  resourceType: string,
  resourceId: string,
  metadata?: Record<string, unknown>,
  actorType = "system",
  actorId?: string,
  tenantId?: string,
  correlationId?: string,
): Promise<void> {
  if (tenantId == null) {
    console.warn(
      `[Audit] Missing tenantId for action=${action} resource=${resourceType}/${resourceId}`,
    );
    return;
  }

  await writeAuditEntry({
    action,
    resourceType,
    resourceId,
    metadata,
    context: {
      tenantId,
      actorType,
      actorId: actorId ?? null,
      correlationId: correlationId ?? null,
    },
  });
}

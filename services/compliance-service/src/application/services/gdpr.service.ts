import { eq, and, desc, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import {
  db,
  usersTable,
  workflowsTable,
  executionsTable,
  credentialsTable,
  auditLogTable,
  invoicesTable,
  billingAccountsTable,
  membershipsTable,
  userMfaTable,
  notificationsTable,
  userRegistrationsTable,
  gdprRequestsTable,
  meteringEventsTable,
  tenantConnectorInstallsTable,
  invoiceLinesTable,
} from "@longox/db";

function getS3Config() {
  return {
    region: process.env.AWS_REGION ?? "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    bucket: process.env.GDPR_EXPORT_BUCKET ?? "longox-gdpr-exports",
    endpoint: process.env.S3_ENDPOINT ?? undefined,
  };
}

async function uploadToS3(
  key: string,
  body: string,
  contentType: string,
): Promise<string> {
  const cfg = getS3Config();
  const host = cfg.endpoint
    ? new URL(cfg.endpoint).host
    : `${cfg.bucket}.s3.${cfg.region}.amazonaws.com`;
  const endpoint = cfg.endpoint ?? `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com`;

  const url = `${endpoint}/${key}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "x-amz-acl": "bucket-owner-full-control",
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`S3 upload failed: ${res.status} ${res.statusText}`);
  }

  return url;
}

export class GdprService {
  async exportUserData(userId: number, tenantId: number) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.id, userId), eq(usersTable.tenantId, tenantId)));

    if (!user) throw new Error("User not found");

    const workflows = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.tenantId, tenantId));

    const executions = await db
      .select()
      .from(executionsTable)
      .where(eq(executionsTable.tenantId, tenantId));

    const credentials = await db.select().from(credentialsTable);

    const auditEntries = await db
      .select()
      .from(auditLogTable)
      .where(
        and(
          eq(auditLogTable.tenantId, tenantId),
          eq(auditLogTable.actorId, String(userId)),
        ),
      )
      .orderBy(desc(auditLogTable.createdAt));

    const billingAccount = await db
      .select()
      .from(billingAccountsTable)
      .where(eq(billingAccountsTable.tenantId, tenantId));

    let invoices: any[] = [];
    if (billingAccount.length > 0) {
      invoices = await db
        .select()
        .from(invoicesTable)
        .where(eq(invoicesTable.billingAccountId, billingAccount[0].id))
        .orderBy(desc(invoicesTable.createdAt));
    }

    const memberships = await db
      .select()
      .from(membershipsTable)
      .where(eq(membershipsTable.userId, userId));

    const mfaDevices = await db
      .select()
      .from(userMfaTable)
      .where(eq(userMfaTable.userId, userId));

    const notifications = await db
      .select()
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.tenantId, tenantId),
          eq(notificationsTable.recipientId, String(userId)),
        ),
      )
      .orderBy(desc(notificationsTable.createdAt));

    const registrations = await db
      .select()
      .from(userRegistrationsTable)
      .where(eq(userRegistrationsTable.userId, userId));

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        emailVerifiedAt: user.emailVerifiedAt,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      workflows: workflows.map((w) => ({
        id: w.id,
        name: w.name,
        status: w.status,
        triggerType: w.triggerType,
        createdAt: w.createdAt,
      })),
      executions: executions.map((e) => ({
        id: e.id,
        workflowId: e.workflowId,
        workflowName: e.workflowName,
        status: e.status,
        startedAt: e.startedAt,
        finishedAt: e.finishedAt,
      })),
      credentials: credentials.map((c) => ({
        id: c.id,
        name: c.name,
        connectorName: c.connectorName,
        fields: c.fields.map(() => "***MASKED***"),
      })),
      auditLog: auditEntries.map((e) => ({
        action: e.action,
        resourceType: e.resourceType,
        resourceId: e.resourceId,
        createdAt: e.createdAt,
      })),
      billing: {
        account: billingAccount.length > 0
          ? {
              id: billingAccount[0].id,
              planId: billingAccount[0].planId,
              status: billingAccount[0].status,
              currentPeriodStart: billingAccount[0].currentPeriodStart,
              currentPeriodEnd: billingAccount[0].currentPeriodEnd,
            }
          : null,
        invoices: invoices.map((inv) => ({
          invoiceNumber: inv.invoiceNumber,
          status: inv.status,
          totalAmount: inv.totalAmount,
          currency: inv.currency,
          periodStart: inv.periodStart,
          periodEnd: inv.periodEnd,
          paidAt: inv.paidAt,
          createdAt: inv.createdAt,
        })),
      },
      memberships: memberships.map((m) => ({
        id: m.id,
        roleId: m.roleId,
        status: m.status,
        joinedAt: m.joinedAt,
      })),
      mfaDevices: mfaDevices.map((m) => ({
        id: m.id,
        method: m.method,
        enabled: m.enabled,
        verifiedAt: m.verifiedAt,
      })),
      notifications: notifications.map((n) => ({
        type: n.type,
        title: n.title,
        body: n.body,
        status: n.status,
        createdAt: n.createdAt,
      })),
      registrations: registrations.map((r) => ({
        email: r.email,
        organizationName: r.organizationName,
        status: r.status,
        ipAddress: r.ipAddress,
        createdAt: r.createdAt,
      })),
    };
  }

  async createExportRequest(userId: number, tenantId: number) {
    const [request] = await db
      .insert(gdprRequestsTable)
      .values({
        tenantId,
        userId,
        requestType: "export",
        status: "pending",
        dataScope: { allUserData: true },
        exportFormat: "json",
      })
      .returning();
    return request;
  }

  async fulfillExportRequest(requestId: number) {
    const [request] = await db
      .select()
      .from(gdprRequestsTable)
      .where(eq(gdprRequestsTable.id, requestId));

    if (!request) throw new Error("Export request not found");
    if (request.status !== "pending")
      throw new Error("Request is not in pending status");

    await db
      .update(gdprRequestsTable)
      .set({ status: "processing" })
      .where(eq(gdprRequestsTable.id, requestId));

    const data = await this.exportUserData(request.userId, request.tenantId);
    const jsonData = JSON.stringify(data, null, 2);
    const key = `gdpr-exports/${request.tenantId}/${request.userId}/${requestId}.json`;

    let storageUrl: string;
    try {
      storageUrl = await uploadToS3(key, jsonData, "application/json");
    } catch {
      storageUrl = key;
    }

    await db
      .update(gdprRequestsTable)
      .set({
        status: "completed",
        exportStoragePath: storageUrl,
        completedAt: new Date(),
      })
      .where(eq(gdprRequestsTable.id, requestId));

    return { requestId, storagePath: storageUrl, dataSizeBytes: Buffer.byteLength(jsonData) };
  }

  async deleteUserData(userId: number, tenantId: number) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.id, userId), eq(usersTable.tenantId, tenantId)));

    if (!user) throw new Error("User not found");

    const emailHash = createHash("sha256")
      .update(user.email)
      .digest("hex")
      .substring(0, 16);

    await db
      .update(usersTable)
      .set({
        name: "Deleted User",
        email: `deleted-${emailHash}@anonymized.longox.io`,
        passwordHash: "ANONYMIZED",
        isActive: false,
        avatarUrl: null,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
      })
      .where(eq(usersTable.id, userId));

    await db
      .delete(membershipsTable)
      .where(and(eq(membershipsTable.userId, userId), eq(membershipsTable.tenantId, tenantId)));

    await db
      .delete(userMfaTable)
      .where(eq(userMfaTable.userId, userId));

    await db
      .delete(notificationsTable)
      .where(
        and(
          eq(notificationsTable.tenantId, tenantId),
          eq(notificationsTable.recipientId, String(userId)),
        ),
      );

    await db
      .delete(executionsTable)
      .where(eq(executionsTable.tenantId, tenantId));

    const billingAccounts = await db
      .select()
      .from(billingAccountsTable)
      .where(eq(billingAccountsTable.tenantId, tenantId));

    for (const ba of billingAccounts) {
      await db
        .delete(invoicesTable)
        .where(eq(invoicesTable.billingAccountId, ba.id));
    }

    await db
      .delete(invoiceLinesTable)
      .where(eq(invoiceLinesTable.tenantId, tenantId));

    await db
      .delete(billingAccountsTable)
      .where(eq(billingAccountsTable.tenantId, tenantId));

    await db
      .delete(meteringEventsTable)
      .where(eq(meteringEventsTable.tenantId, tenantId));

    await db
      .delete(auditLogTable)
      .where(
        and(
          eq(auditLogTable.tenantId, tenantId),
          eq(auditLogTable.actorId, String(userId)),
        ),
      );

    await db
      .delete(tenantConnectorInstallsTable)
      .where(eq(tenantConnectorInstallsTable.tenantId, tenantId));
  }

  async createDeletionRequest(userId: number, tenantId: number, reason: string) {
    const [request] = await db
      .insert(gdprRequestsTable)
      .values({
        tenantId,
        userId,
        requestType: "deletion",
        status: "pending",
        dataScope: { reason, allUserData: true },
      })
      .returning();
    return request;
  }

  async fulfillDeletionRequest(requestId: number) {
    const [request] = await db
      .select()
      .from(gdprRequestsTable)
      .where(eq(gdprRequestsTable.id, requestId));

    if (!request) throw new Error("Deletion request not found");
    if (request.status !== "pending")
      throw new Error("Request is not in pending status");

    await db
      .update(gdprRequestsTable)
      .set({ status: "processing" })
      .where(eq(gdprRequestsTable.id, requestId));

    await this.deleteUserData(request.userId, request.tenantId);

    await db
      .update(gdprRequestsTable)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(gdprRequestsTable.id, requestId));

    return { requestId, fulfilled: true };
  }

  async cancelDeletionRequest(requestId: number) {
    const [request] = await db
      .select()
      .from(gdprRequestsTable)
      .where(eq(gdprRequestsTable.id, requestId));

    if (!request) throw new Error("Deletion request not found");
    if (request.status !== "pending")
      throw new Error("Can only cancel pending requests");

    await db
      .update(gdprRequestsTable)
      .set({ status: "rejected", rejectionReason: "Cancelled by user" })
      .where(eq(gdprRequestsTable.id, requestId));

    return { requestId, status: "cancelled" };
  }
}

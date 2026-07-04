/**
 * GDPR request service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3. Uses the following
 * Prisma delegates: `prisma.user`, `prisma.workflow`, `prisma.workflowExecution`,
 * `prisma.credential`, `prisma.auditLog`, `prisma.invoice`, `prisma.billingAccount`,
 * `prisma.membership`, `prisma.userMfa`, `prisma.notification`, `prisma.userRegistration`,
 * `prisma.gdprRequest`, `prisma.meteringEvent`, `prisma.tenantConnectorInstall`,
 * `prisma.invoiceLine`. `as any` casts handle legacy columns (e.g. `tenantId`,
 * `actorType`, `resourceType`) that aren't part of the canonical Prisma schema.
 */

import { createHash } from "node:crypto";
import { prisma } from "@longox/db/prisma";

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
  async exportUserData(userId: string, tenantId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId } as any,
    });

    if (!user) throw new Error("User not found");

    const workflows = await prisma.workflow.findMany({
      where: { tenantId } as any,
    });

    const executions = await prisma.workflowExecution.findMany({
      where: { tenantId } as any,
    });

    const credentials = await prisma.credential.findMany();

    const auditEntries = await prisma.auditLog.findMany({
      where: { tenantId, actorId: String(userId) } as any,
      orderBy: { createdAt: "desc" } as any,
    });

    const billingAccount = await prisma.billingAccount.findMany({
      where: { tenantId } as any,
    });

    let invoices: any[] = [];
    if (billingAccount.length > 0) {
      invoices = await prisma.invoice.findMany({
        where: { billingAccountId: billingAccount[0].id } as any,
        orderBy: { createdAt: "desc" },
      });
    }

    const memberships = await prisma.membership.findMany({
      where: { userId } as any,
    });

    const mfaDevices = await prisma.userMfa.findMany({
      where: { userId } as any,
    });

    const notifications = await prisma.notification.findMany({
      where: { tenantId, recipientId: String(userId) } as any,
      orderBy: { createdAt: "desc" },
    });

    const registrations = await prisma.userRegistration.findMany({
      where: { userId } as any,
    });

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: (user as any).id,
        email: (user as any).email,
        name: (user as any).name,
        role: (user as any).role,
        isActive: (user as any).isActive,
        emailVerifiedAt: (user as any).emailVerifiedAt,
        lastLoginAt: (user as any).lastLoginAt,
        createdAt: (user as any).createdAt,
      },
      workflows: workflows.map((w: any) => ({
        id: w.id,
        name: w.name,
        status: w.status,
        triggerType: w.triggerType,
        createdAt: w.createdAt,
      })),
      executions: executions.map((e: any) => ({
        id: e.id,
        workflowId: e.workflowId,
        workflowName: e.workflowName,
        status: e.status,
        startedAt: e.startedAt,
        finishedAt: e.finishedAt,
      })),
      credentials: credentials.map((c: any) => ({
        id: c.id,
        name: c.name,
        connectorName: c.connectorName,
        fields: (c.fields ?? []).map(() => "***MASKED***"),
      })),
      auditLog: auditEntries.map((e: any) => ({
        action: e.action,
        resourceType: e.resourceType ?? e.targetType,
        resourceId: e.resourceId ?? e.targetId,
        createdAt: e.createdAt ?? e.occurredAt,
      })),
      billing: {
        account: billingAccount.length > 0
          ? {
              id: (billingAccount[0] as any).id,
              planId: (billingAccount[0] as any).planId,
              status: (billingAccount[0] as any).status,
              currentPeriodStart: (billingAccount[0] as any).currentPeriodStart,
              currentPeriodEnd: (billingAccount[0] as any).currentPeriodEnd,
            }
          : null,
        invoices: invoices.map((inv: any) => ({
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
      memberships: memberships.map((m: any) => ({
        id: m.id,
        roleId: m.roleId,
        status: m.status,
        joinedAt: m.joinedAt,
      })),
      mfaDevices: mfaDevices.map((m: any) => ({
        id: m.id,
        method: m.method,
        enabled: m.enabled,
        verifiedAt: m.verifiedAt,
      })),
      notifications: notifications.map((n: any) => ({
        type: n.type,
        title: n.title,
        body: n.body,
        status: n.status,
        createdAt: n.createdAt,
      })),
      registrations: registrations.map((r: any) => ({
        email: r.email,
        organizationName: r.organizationName,
        status: r.status,
        ipAddress: r.ipAddress,
        createdAt: r.createdAt,
      })),
    };
  }

  async createExportRequest(userId: string, tenantId: string) {
    const request = await prisma.gdprRequest.create({
      data: {
        tenantId,
        userId,
        requestType: "export",
        status: "pending",
        dataScope: { allUserData: true },
        exportFormat: "json",
      } as any,
    });
    return request;
  }

  async fulfillExportRequest(requestId: string) {
    const request = await prisma.gdprRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new Error("Export request not found");
    if (request.status !== "pending")
      throw new Error("Request is not in pending status");

    await prisma.gdprRequest.update({
      where: { id: requestId },
      data: { status: "processing" } as any,
    });

    const data = await this.exportUserData(request.userId, request.tenantId);
    const jsonData = JSON.stringify(data, null, 2);
    const key = `gdpr-exports/${request.tenantId}/${request.userId}/${requestId}.json`;

    let storageUrl: string;
    try {
      storageUrl = await uploadToS3(key, jsonData, "application/json");
    } catch {
      storageUrl = key;
    }

    await prisma.gdprRequest.update({
      where: { id: requestId },
      data: {
        status: "completed",
        exportStoragePath: storageUrl,
        completedAt: new Date(),
      } as any,
    });

    return { requestId, storagePath: storageUrl, dataSizeBytes: Buffer.byteLength(jsonData) };
  }

  async deleteUserData(userId: string, tenantId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId } as any,
    });

    if (!user) throw new Error("User not found");

    const emailHash = createHash("sha256")
      .update((user as any).email)
      .digest("hex")
      .substring(0, 16);

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: "Deleted User",
        email: `deleted-${emailHash}@anonymized.longox.io`,
        passwordHash: "ANONYMIZED",
        isActive: false,
        avatarUrl: null,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
      } as any,
    });

    await prisma.membership.deleteMany({
      where: { userId, tenantId } as any,
    });

    await prisma.userMfa.deleteMany({
      where: { userId } as any,
    });

    await prisma.notification.deleteMany({
      where: { tenantId, recipientId: String(userId) } as any,
    });

    await prisma.workflowExecution.deleteMany({
      where: { tenantId } as any,
    });

    const billingAccounts = await prisma.billingAccount.findMany({
      where: { tenantId } as any,
    });

    for (const ba of billingAccounts) {
      await prisma.invoice.deleteMany({
        where: { billingAccountId: ba.id } as any,
      });
    }

    await prisma.invoiceLine.deleteMany({
      where: { tenantId } as any,
    });

    await prisma.billingAccount.deleteMany({
      where: { tenantId } as any,
    });

    await prisma.meteringEvent.deleteMany({
      where: { tenantId } as any,
    });

    await prisma.auditLog.deleteMany({
      where: { tenantId, actorId: String(userId) } as any,
    });

    await prisma.tenantConnectorInstall.deleteMany({
      where: { tenantId } as any,
    });
  }

  async createDeletionRequest(userId: string, tenantId: string, reason: string) {
    const request = await prisma.gdprRequest.create({
      data: {
        tenantId,
        userId,
        requestType: "deletion",
        status: "pending",
        dataScope: { reason, allUserData: true },
      } as any,
    });
    return request;
  }

  async fulfillDeletionRequest(requestId: string) {
    const request = await prisma.gdprRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new Error("Deletion request not found");
    if (request.status !== "pending")
      throw new Error("Request is not in pending status");

    await prisma.gdprRequest.update({
      where: { id: requestId },
      data: { status: "processing" } as any,
    });

    await this.deleteUserData(request.userId, request.tenantId);

    await prisma.gdprRequest.update({
      where: { id: requestId },
      data: {
        status: "completed",
        completedAt: new Date(),
      } as any,
    });

    return { requestId, fulfilled: true };
  }

  async cancelDeletionRequest(requestId: string) {
    const request = await prisma.gdprRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new Error("Deletion request not found");
    if (request.status !== "pending")
      throw new Error("Can only cancel pending requests");

    await prisma.gdprRequest.update({
      where: { id: requestId },
      data: { status: "rejected", rejectionReason: "Cancelled by user" } as any,
    });

    return { requestId, status: "cancelled" };
  }
}

import { db, searchIndexTable } from "@longox/db";
import { eq, and, sql } from "drizzle-orm";
import type { PlatformEvent } from "@longox/shared-events";

export class SearchIndexProjection {
  async handleEvent(event: PlatformEvent): Promise<void> {
    switch (event.type) {
      case "workflow.created":
      case "workflow.updated":
      case "workflow.published":
        await this.indexWorkflow(event);
        break;
      case "workflow.deleted":
        await this.removeDocument("workflow", event.aggregateId);
        break;
      case "template.published":
      case "template.installed":
        await this.indexTemplate(event);
        break;
      case "dashboard.created":
      case "dashboard.published":
        await this.indexDashboard(event);
        break;
      case "connector.installed":
        await this.indexConnector(event);
        break;
      case "user.created":
        await this.indexUser(event);
        break;
      case "ai.run.completed":
        await this.indexAiRun(event);
        break;
    }
  }

  private async indexWorkflow(event: PlatformEvent): Promise<void> {
    const title = (event.payload.name as string) ?? "Untitled Workflow";
    const content = [
      title,
      (event.payload.description as string) ?? "",
      JSON.stringify(event.payload.tags ?? []),
    ]
      .filter(Boolean)
      .join(" ");

    await this.upsertDocument({
      documentId: `workflow-${event.aggregateId}`,
      documentType: "workflow",
      tenantId: event.metadata.tenantId as string | undefined,
      title,
      content,
      metadata: {
        status: event.payload.status,
        version: event.payload.version,
        nodeCount: event.payload.nodeCount,
      },
    });
  }

  private async indexTemplate(event: PlatformEvent): Promise<void> {
    const title = (event.payload.name as string) ?? "Untitled Template";
    const content = [
      title,
      (event.payload.description as string) ?? "",
      (event.payload.category as string) ?? "",
    ]
      .filter(Boolean)
      .join(" ");

    await this.upsertDocument({
      documentId: `template-${event.aggregateId}`,
      documentType: "template",
      tenantId: event.metadata.tenantId as string | undefined,
      title,
      content,
      metadata: {
        category: event.payload.category,
        industry: event.payload.industry,
      },
    });
  }

  private async indexDashboard(event: PlatformEvent): Promise<void> {
    const title = (event.payload.name as string) ?? "Untitled Dashboard";
    const content = [title, (event.payload.description as string) ?? ""]
      .filter(Boolean)
      .join(" ");

    await this.upsertDocument({
      documentId: `dashboard-${event.aggregateId}`,
      documentType: "dashboard",
      tenantId: event.metadata.tenantId as string | undefined,
      title,
      content,
      metadata: {
        status: event.payload.status,
      },
    });
  }

  private async indexConnector(event: PlatformEvent): Promise<void> {
    const title = (event.payload.name as string) ?? "Untitled Connector";
    const content = [
      title,
      (event.payload.description as string) ?? "",
      (event.payload.category as string) ?? "",
    ]
      .filter(Boolean)
      .join(" ");

    await this.upsertDocument({
      documentId: `connector-${event.aggregateId}`,
      documentType: "connector",
      tenantId: event.metadata.tenantId as string | undefined,
      title,
      content,
      metadata: {
        category: event.payload.category,
        version: event.payload.version,
      },
    });
  }

  private async indexUser(event: PlatformEvent): Promise<void> {
    const name = (event.payload.name as string) ?? "Unknown User";
    const email = (event.payload.email as string) ?? "";

    await this.upsertDocument({
      documentId: `user-${event.aggregateId}`,
      documentType: "user",
      tenantId: event.metadata.tenantId as string | undefined,
      title: name,
      content: `${name} ${email}`,
      metadata: { email },
    });
  }

  private async indexAiRun(event: PlatformEvent): Promise<void> {
    const model = (event.payload.model as string) ?? "unknown";
    const provider = (event.payload.provider as string) ?? "unknown";

    await this.upsertDocument({
      documentId: `ai-run-${event.aggregateId}`,
      documentType: "ai_run",
      tenantId: event.metadata.tenantId as string | undefined,
      title: `AI Run: ${provider}/${model}`,
      content: JSON.stringify(event.payload),
      metadata: {
        provider,
        model,
        cost: event.payload.cost,
        tokens: event.payload.totalTokens,
      },
    });
  }

  private async upsertDocument(doc: {
    documentId: string;
    documentType: string;
    tenantId?: string;
    title: string;
    content: string;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    try {
      const compositeId = `${doc.documentType}-${doc.documentId}`;
      const [existing] = await db
        .select()
        .from(searchIndexTable)
        .where(eq(searchIndexTable.resourceId, compositeId))
        .limit(1);

      if (existing) {
        await db
          .update(searchIndexTable)
          .set({
            title: doc.title,
            content: doc.content,
            metadata: doc.metadata,
            updatedAt: new Date(),
          })
          .where(eq(searchIndexTable.id, existing.id));
      } else {
        await db.insert(searchIndexTable).values({
          resourceType: doc.documentType,
          resourceId: compositeId,
          tenantId: doc.tenantId,
          title: doc.title,
          content: doc.content,
          metadata: doc.metadata,
        } as any);
      }
    } catch (err) {
      console.error("[SearchIndexProjection] Failed to upsert document:", err);
    }
  }

  private async removeDocument(
    documentType: string,
    documentId: string,
  ): Promise<void> {
    try {
      const compositeId = `${documentType}-${documentId}`;
      await db
        .delete(searchIndexTable)
        .where(eq(searchIndexTable.resourceId, compositeId));
    } catch (err) {
      console.error("[SearchIndexProjection] Failed to remove document:", err);
    }
  }
}

export const searchIndexProjection = new SearchIndexProjection();

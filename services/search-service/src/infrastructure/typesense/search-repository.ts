import type { SearchRepository } from "../../domain/search/search-repository";
import type {
  SearchResult,
  SearchableType,
} from "../../domain/search/search-result.entity";
import {
  searchDocuments,
  indexDocument,
  deleteDocument,
  indexDocuments,
} from "./typesense-client";

export class TypesenseSearchRepository implements SearchRepository {
  async search(
    query: string,
    types: SearchableType[],
    limitPerType: number
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    const searchPromises = types.map(async (type) => {
      const collection = this.getCollectionName(type);
      const searchResult = await searchDocuments(
        collection,
        query,
        {
          queryBy: this.getQueryFields(type),
          limit: limitPerType,
          filterBy: [],
        }
      );

      return searchResult.hits.map((hit: any) => ({
        id: parseInt(hit.document.id?.toString() ?? "0", 10),
        type: type.slice(0, -1), // Remove 's' from plural
        title: hit.document.name?.toString() ?? hit.document.title?.toString() ?? "",
        description: hit.document.description?.toString() ?? null,
        url: this.getUrl(type, hit.document.id?.toString() ?? ""),
        metadata: this.extractMetadata(type, hit.document),
        score: hit.text_match_info?.score ?? 0,
      }));
    });

    const searchResults = await Promise.all(searchPromises);
    for (const typeResults of searchResults) {
      results.push(...typeResults);
    }

    return results;
  }

  private getCollectionName(type: SearchableType): string {
    switch (type) {
      case "workflows":
        return "workflows";
      case "apps":
        return "connectors"; // Apps are stored in connectors collection
      case "templates":
        return "workflows"; // Templates are stored in workflows collection
      case "connectors":
        return "connectors";
      default:
        return "workflows";
    }
  }

  private getQueryFields(type: SearchableType): string[] {
    switch (type) {
      case "workflows":
        return ["name", "description"];
      case "apps":
        return ["name", "description"];
      case "templates":
        return ["name", "description"];
      case "connectors":
        return ["name", "description"];
      default:
        return ["name", "description"];
    }
  }

  private getUrl(type: SearchableType, id: string): string {
    switch (type) {
      case "workflows":
        return `/workflows/${id}`;
      case "apps":
        return `/apps/${id}`;
      case "templates":
        return `/templates`;
      case "connectors":
        return `/connectors`;
      default:
        return `/`;
    }
  }

  private extractMetadata(
    type: SearchableType,
    document: Record<string, unknown>
  ): Record<string, unknown> {
    switch (type) {
      case "workflows":
        return {
          status: document.status,
          triggerType: document.triggerType,
          tenantId: document.tenantId,
        };
      case "apps":
      case "connectors":
        return {
          category: document.category,
          isInstalled: document.isInstalled,
        };
      case "templates":
        return {
          category: document.category,
          tenantId: document.tenantId,
        };
      default:
        return {};
    }
  }

  // ─── Index Management ────────────────────────────────────────────────────────

  async indexWorkflow(workflow: {
    id: string;
    name: string;
    description?: string;
    status: string;
    triggerType: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<void> {
    await indexDocument("workflows", {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description ?? "",
      status: workflow.status,
      triggerType: workflow.triggerType,
      tenantId: workflow.tenantId,
      createdAt: workflow.createdAt.getTime(),
      updatedAt: workflow.updatedAt.getTime(),
    });
  }

  async indexExecution(execution: {
    id: string;
    workflowId: string;
    workflowName: string;
    status: string;
    tenantId: string;
    startedAt: Date;
    completedAt?: Date;
    durationMs?: number;
    error?: string;
  }): Promise<void> {
    await indexDocument("executions", {
      id: execution.id,
      workflowId: execution.workflowId,
      workflowName: execution.workflowName,
      status: execution.status,
      tenantId: execution.tenantId,
      startedAt: execution.startedAt.getTime(),
      completedAt: execution.completedAt?.getTime() ?? 0,
      durationMs: execution.durationMs ?? 0,
      error: execution.error ?? "",
    });
  }

  async indexAuditLog(log: {
    id: string;
    action: string;
    resource: string;
    resourceId: string;
    tenantId: string;
    userId: string;
    details: string;
    timestamp: Date;
  }): Promise<void> {
    await indexDocument("audit_logs", {
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      tenantId: log.tenantId,
      userId: log.userId,
      details: log.details,
      timestamp: log.timestamp.getTime(),
    });
  }

  async indexConnector(connector: {
    id: string;
    name: string;
    description?: string;
    category: string;
    isInstalled: boolean;
    createdAt: Date;
  }): Promise<void> {
    await indexDocument("connectors", {
      id: connector.id,
      name: connector.name,
      description: connector.description ?? "",
      category: connector.category,
      isInstalled: connector.isInstalled,
      createdAt: connector.createdAt.getTime(),
    });
  }

  async indexPrompt(prompt: {
    id: string;
    name: string;
    content: string;
    model: string;
    tenantId: string;
    createdAt: Date;
  }): Promise<void> {
    await indexDocument("prompts", {
      id: prompt.id,
      name: prompt.name,
      content: prompt.content,
      model: prompt.model,
      tenantId: prompt.tenantId,
      createdAt: prompt.createdAt.getTime(),
    });
  }

  async deleteFromIndex(
    collection: string,
    documentId: string
  ): Promise<void> {
    await deleteDocument(collection, documentId);
  }

  async bulkIndex(
    collection: string,
    documents: Array<Record<string, unknown>>
  ): Promise<void> {
    await indexDocuments(collection, documents);
  }

  // ─── Search Variations ───────────────────────────────────────────────────────

  async searchExecutions(
    query: string,
    tenantId: string,
    filters?: {
      status?: string;
      workflowId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 20
  ): Promise<SearchResult[]> {
    const filterBy: string[] = [`tenantId:=${tenantId}`];

    if (filters?.status) {
      filterBy.push(`status:=${filters.status}`);
    }
    if (filters?.workflowId) {
      filterBy.push(`workflowId:=${filters.workflowId}`);
    }
    if (filters?.startDate) {
      filterBy.push(`startedAt:>=${filters.startDate.getTime()}`);
    }
    if (filters?.endDate) {
      filterBy.push(`startedAt:<=${filters.endDate.getTime()}`);
    }

    const searchResult = await searchDocuments("executions", query, {
      queryBy: ["workflowName", "error"],
      filterBy,
      limit,
      sort_by: ["startedAt:desc"],
    });

    return searchResult.hits.map((hit: any) => ({
      id: parseInt(hit.document.id?.toString() ?? "0", 10),
      type: "execution",
      title: hit.document.workflowName?.toString() ?? "",
      description: hit.document.error?.toString() ?? null,
      url: `/executions/${hit.document.id}`,
      metadata: {
        status: hit.document.status,
        workflowId: hit.document.workflowId,
        durationMs: hit.document.durationMs,
        startedAt: hit.document.startedAt,
      },
      score: hit.text_match_info?.score ?? 0,
    }));
  }

  async searchAuditLogs(
    query: string,
    tenantId: string,
    filters?: {
      action?: string;
      resource?: string;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 20
  ): Promise<SearchResult[]> {
    const filterBy: string[] = [`tenantId:=${tenantId}`];

    if (filters?.action) {
      filterBy.push(`action:=${filters.action}`);
    }
    if (filters?.resource) {
      filterBy.push(`resource:=${filters.resource}`);
    }
    if (filters?.userId) {
      filterBy.push(`userId:=${filters.userId}`);
    }
    if (filters?.startDate) {
      filterBy.push(`timestamp:>=${filters.startDate.getTime()}`);
    }
    if (filters?.endDate) {
      filterBy.push(`timestamp:<=${filters.endDate.getTime()}`);
    }

    const searchResult = await searchDocuments("audit_logs", query, {
      queryBy: ["action", "resource", "details"],
      filterBy,
      limit,
      sort_by: ["timestamp:desc"],
    });

    return searchResult.hits.map((hit: any) => ({
      id: parseInt(hit.document.id?.toString() ?? "0", 10),
      type: "audit_log",
      title: `${hit.document.action} ${hit.document.resource}`,
      description: hit.document.details?.toString() ?? null,
      url: `/audit-logs/${hit.document.id}`,
      metadata: {
        action: hit.document.action,
        resource: hit.document.resource,
        resourceId: hit.document.resourceId,
        userId: hit.document.userId,
        timestamp: hit.document.timestamp,
      },
      score: hit.text_match_info?.score ?? 0,
    }));
  }

  async searchAiPrompts(
    query: string,
    tenantId: string,
    filters?: {
      model?: string;
    },
    limit: number = 20
  ): Promise<SearchResult[]> {
    const filterBy: string[] = [`tenantId:=${tenantId}`];

    if (filters?.model) {
      filterBy.push(`model:=${filters.model}`);
    }

    const searchResult = await searchDocuments("prompts", query, {
      queryBy: ["name", "content"],
      filterBy,
      limit,
      sort_by: ["createdAt:desc"],
    });

    return searchResult.hits.map((hit: any) => ({
      id: parseInt(hit.document.id?.toString() ?? "0", 10),
      type: "prompt",
      title: hit.document.name?.toString() ?? "",
      description: hit.document.content?.toString()?.substring(0, 200) ?? null,
      url: `/prompts/${hit.document.id}`,
      metadata: {
        model: hit.document.model,
        createdAt: hit.document.createdAt,
      },
      score: hit.text_match_info?.score ?? 0,
    }));
  }
}

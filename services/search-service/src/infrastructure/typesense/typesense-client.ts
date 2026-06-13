import Typesense from "typesense";
import { withSpan } from "@longox/shared-observability";

export interface TypesenseConfig {
  nodes: Array<{
    host: string;
    port: number;
    protocol: string;
  }>;
  apiKey: string;
  connectionTimeoutSeconds?: number;
  timeoutSeconds?: number;
}

let client: Typesense.SearchClient | null = null;

export function getTypesenseClient(config?: TypesenseConfig): Typesense.SearchClient {
  if (client) return client;

  const nodes = config?.nodes ?? [
    {
      host: process.env.TYPESENSE_HOST ?? "localhost",
      port: parseInt(process.env.TYPESENSE_PORT ?? "8108", 10),
      protocol: process.env.TYPESENSE_PROTOCOL ?? "http",
    },
  ];

  client = new Typesense.SearchClient({
    nodes,
    apiKey: config?.apiKey ?? process.env.TYPESENSE_API_KEY ?? "",
    connectionTimeoutSeconds: config?.connectionTimeoutSeconds ?? 10,
    timeoutSeconds: config?.timeoutSeconds ?? 30,
  });

  return client;
}

export async function ensureCollectionsExist(): Promise<void> {
  const client = getTypesenseClient();

  const collections = [
    {
      name: "workflows",
      fields: [
        { name: "id", type: "int32", facet: false },
        { name: "name", type: "string", facet: true },
        { name: "description", type: "string", facet: false },
        { name: "status", type: "string", facet: true },
        { name: "triggerType", type: "string", facet: true },
        { name: "tenantId", type: "int32", facet: true },
        { name: "createdAt", type: "int64", facet: false },
        { name: "updatedAt", type: "int64", facet: false },
      ],
      default_sorting_field: "createdAt",
    },
    {
      name: "executions",
      fields: [
        { name: "id", type: "int32", facet: false },
        { name: "workflowId", type: "int32", facet: true },
        { name: "workflowName", type: "string", facet: true },
        { name: "status", type: "string", facet: true },
        { name: "tenantId", type: "int32", facet: true },
        { name: "startedAt", type: "int64", facet: false },
        { name: "completedAt", type: "int64", facet: false },
        { name: "durationMs", type: "int32", facet: false },
        { name: "error", type: "string", facet: false },
      ],
      default_sorting_field: "startedAt",
    },
    {
      name: "prompts",
      fields: [
        { name: "id", type: "int32", facet: false },
        { name: "name", type: "string", facet: true },
        { name: "content", type: "string", facet: false },
        { name: "model", type: "string", facet: true },
        { name: "tenantId", type: "int32", facet: true },
        { name: "createdAt", type: "int64", facet: false },
      ],
      default_sorting_field: "createdAt",
    },
    {
      name: "audit_logs",
      fields: [
        { name: "id", type: "int32", facet: false },
        { name: "action", type: "string", facet: true },
        { name: "resource", type: "string", facet: true },
        { name: "resourceId", type: "string", facet: true },
        { name: "tenantId", type: "int32", facet: true },
        { name: "userId", type: "int32", facet: true },
        { name: "details", type: "string", facet: false },
        { name: "timestamp", type: "int64", facet: false },
      ],
      default_sorting_field: "timestamp",
    },
    {
      name: "connectors",
      fields: [
        { name: "id", type: "int32", facet: false },
        { name: "name", type: "string", facet: true },
        { name: "description", type: "string", facet: false },
        { name: "category", type: "string", facet: true },
        { name: "isInstalled", type: "bool", facet: true },
        { name: "createdAt", type: "int64", facet: false },
      ],
      default_sorting_field: "createdAt",
    },
  ];

  for (const collectionDef of collections) {
    try {
      await client.collections(collectionDef.name).retrieve();
    } catch {
      await client.collections().create(collectionDef);
    }
  }
}

export async function indexDocument(
  collection: string,
  document: Record<string, unknown>
): Promise<void> {
  await withSpan(`typesense.index.${collection}`, async (span) => {
    span.setAttributes({
      "typesense.collection": collection,
      "typesense.document_id": document.id?.toString() ?? "unknown",
    });

    const client = getTypesenseClient();
    await client.collections(collection).documents().upsert(document);
  });
}

export async function indexDocuments(
  collection: string,
  documents: Array<Record<string, unknown>>
): Promise<void> {
  await withSpan(`typesense.bulk_index.${collection}`, async (span) => {
    span.setAttributes({
      "typesense.collection": collection,
      "typesense.document_count": documents.length,
    });

    const client = getTypesenseClient();
    await client.collections(collection).documents().import(documents);
  });
}

export async function deleteDocument(
  collection: string,
  documentId: string
): Promise<void> {
  await withSpan(`typesense.delete.${collection}`, async (span) => {
    span.setAttributes({
      "typesense.collection": collection,
      "typesense.document_id": documentId,
    });

    const client = getTypesenseClient();
    await client.collections(collection).documents(documentId).delete();
  });
}

export async function searchDocuments(
  collection: string,
  query: string,
  options: {
    queryBy?: string[];
    filterBy?: string[];
    sort_by?: string[];
    limit?: number;
    offset?: number;
    facetBy?: string[];
    maxFacetValues?: number;
  } = {}
): Promise<Typesense.SearchResult> {
  return withSpan(`typesense.search.${collection}`, async (span) => {
    span.setAttributes({
      "typesense.collection": collection,
      "typesense.query": query,
      "typesense.limit": options.limit ?? 10,
    });

    const client = getTypesenseClient();
    const searchParams: Typesense.SearchParams = {
      q: query,
      query_by: options.queryBy?.join(",") ?? "*",
      limit: options.limit ?? 10,
      offset: options.offset ?? 0,
    };

    if (options.filterBy) {
      searchParams.filter_by = options.filterBy.join(" && ");
    }
    if (options.sort_by) {
      searchParams.sort_by = options.sort_by.join(",");
    }
    if (options.facetBy) {
      searchParams.facet_by = options.facetBy.join(",");
    }
    if (options.maxFacetValues) {
      searchParams.max_facet_values = options.maxFacetValues;
    }

    return client.collections(collection).documents().search(searchParams);
  });
}

export async function deleteCollection(collection: string): Promise<void> {
  const client = getTypesenseClient();
  await client.collections(collection).delete();
}

import type { ActionContext, ActionResult } from "@longox/connector-runtime";

const NOTION_API = "https://api.notion.com/v1";

interface NotionResponse {
  object?: string;
  results?: unknown[];
  id?: string;
  url?: string;
  [key: string]: unknown;
}

async function notionRequest(
  token: string,
  path: string,
  method: string,
  body?: unknown,
): Promise<NotionResponse> {
  const response = await fetch(`${NOTION_API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Notion API error: ${response.status} ${text}`);
  }
  return response.json() as Promise<NotionResponse>;
}

export async function createPage(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const token = (context.auth.credentials.accessToken as string) ?? (context.auth.credentials.apiKey as string) ?? "";
  const parentType = String(context.config.parentType ?? "database");
  const parentId = String(context.config.parentId ?? "");
  const title = String(context.config.title ?? "");
  const properties = (context.config.properties ?? {}) as Record<string, unknown>;
  const children = context.config.children as unknown[] | undefined;

  if (!token) return { success: false, data: {}, error: "Notion API token required", durationMs: Date.now() - start };
  if (!parentId) return { success: false, data: {}, error: "parentId required", durationMs: Date.now() - start };

  const notionProperties: Record<string, unknown> = { ...properties };
  if (title && !notionProperties.title) {
    notionProperties.title = {
      title: [{ type: "text", text: { content: title } }],
    };
  }

  try {
    const data = await notionRequest(token, "/pages", "POST", {
      parent: { [parentType]: parentId },
      properties: notionProperties,
      children,
    });
    return {
      success: true,
      data: { id: data.id, url: data.url, createdTime: data.created_time as string ?? new Date().toISOString() },
      error: null,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return { success: false, data: {}, error: err instanceof Error ? err.message : String(err), durationMs: Date.now() - start };
  }
}

export async function updatePage(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const token = (context.auth.credentials.accessToken as string) ?? (context.auth.credentials.apiKey as string) ?? "";
  const pageId = String(context.config.pageId ?? "");
  const properties = (context.config.properties ?? {}) as Record<string, unknown>;
  const archived = context.config.archived as boolean | undefined;

  if (!token) return { success: false, data: {}, error: "Notion API token required", durationMs: Date.now() - start };
  if (!pageId) return { success: false, data: {}, error: "pageId required", durationMs: Date.now() - start };

  try {
    const body: Record<string, unknown> = { properties };
    if (archived !== undefined) body.archived = archived;
    const data = await notionRequest(token, `/pages/${pageId}`, "PATCH", body);
    return {
      success: true,
      data: { id: data.id, url: data.url, updatedTime: data.last_edited_time as string ?? new Date().toISOString() },
      error: null,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return { success: false, data: {}, error: err instanceof Error ? err.message : String(err), durationMs: Date.now() - start };
  }
}

export async function queryDatabase(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const token = (context.auth.credentials.accessToken as string) ?? (context.auth.credentials.apiKey as string) ?? "";
  const databaseId = String(context.config.databaseId ?? "");
  const filter = context.config.filter as Record<string, unknown> | undefined;
  const sorts = context.config.sorts as unknown[] | undefined;
  const pageSize = Number(context.config.pageSize ?? 100);

  if (!token) return { success: false, data: {}, error: "Notion API token required", durationMs: Date.now() - start };
  if (!databaseId) return { success: false, data: {}, error: "databaseId required", durationMs: Date.now() - start };

  try {
    const body: Record<string, unknown> = { page_size: Math.min(pageSize, 100) };
    if (filter) body.filter = filter;
    if (sorts) body.sorts = sorts;
    const data = await notionRequest(token, `/databases/${databaseId}/query`, "POST", body);
    return {
      success: true,
      data: {
        results: data.results ?? [],
        hasMore: data.has_more ?? false,
        nextCursor: data.next_cursor ?? null,
      },
      error: null,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return { success: false, data: {}, error: err instanceof Error ? err.message : String(err), durationMs: Date.now() - start };
  }
}

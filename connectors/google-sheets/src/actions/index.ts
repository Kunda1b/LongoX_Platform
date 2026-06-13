import type { ActionContext, ActionResult } from "@longox/connector-runtime";

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

async function sheetsRequest(
  accessToken: string,
  path: string,
  method: string,
  body?: unknown,
): Promise<Record<string, unknown>> {
  const response = await fetch(`${SHEETS_API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Sheets API error: ${response.status} ${text}`);
  }
  return response.json() as Promise<Record<string, unknown>>;
}

export async function readRange(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const token = context.auth.credentials.accessToken as string;
  const spreadsheetId = String(context.config.spreadsheetId ?? "");
  const range = String(context.config.range ?? "");
  const majorDimension = String(context.config.majorDimension ?? "ROWS");

  if (!token) return { success: false, data: {}, error: "Access token required", durationMs: Date.now() - start };
  if (!spreadsheetId) return { success: false, data: {}, error: "spreadsheetId required", durationMs: Date.now() - start };
  if (!range) return { success: false, data: {}, error: "range required", durationMs: Date.now() - start };

  try {
    const data = await sheetsRequest(
      token,
      `/${spreadsheetId}/values/${encodeURIComponent(range)}?majorDimension=${majorDimension}`,
      "GET",
    );
    return {
      success: true,
      data: { values: data.values ?? [], range: data.range ?? range },
      error: null,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return { success: false, data: {}, error: err instanceof Error ? err.message : String(err), durationMs: Date.now() - start };
  }
}

export async function writeRange(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const token = context.auth.credentials.accessToken as string;
  const spreadsheetId = String(context.config.spreadsheetId ?? "");
  const range = String(context.config.range ?? "");
  const values = context.config.values as unknown[];
  const valueInputOption = String(context.config.valueInputOption ?? "USER_ENTERED");

  if (!token) return { success: false, data: {}, error: "Access token required", durationMs: Date.now() - start };
  if (!spreadsheetId) return { success: false, data: {}, error: "spreadsheetId required", durationMs: Date.now() - start };
  if (!range) return { success: false, data: {}, error: "range required", durationMs: Date.now() - start };
  if (!Array.isArray(values)) return { success: false, data: {}, error: "values must be an array", durationMs: Date.now() - start };

  try {
    const data = await sheetsRequest(
      token,
      `/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=${valueInputOption}`,
      "PUT",
      { values: values.map(v => Array.isArray(v) ? v : [v]) },
    );
    return {
      success: true,
      data: { updatedCells: data.updatedCells as number, updatedRange: data.updatedRange as string },
      error: null,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return { success: false, data: {}, error: err instanceof Error ? err.message : String(err), durationMs: Date.now() - start };
  }
}

export async function appendRow(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const token = context.auth.credentials.accessToken as string;
  const spreadsheetId = String(context.config.spreadsheetId ?? "");
  const range = String(context.config.range ?? "");
  const values = context.config.values as unknown[];
  const valueInputOption = String(context.config.valueInputOption ?? "USER_ENTERED");

  if (!token) return { success: false, data: {}, error: "Access token required", durationMs: Date.now() - start };
  if (!spreadsheetId) return { success: false, data: {}, error: "spreadsheetId required", durationMs: Date.now() - start };
  if (!Array.isArray(values)) return { success: false, data: {}, error: "values must be an array", durationMs: Date.now() - start };

  try {
    const data = await sheetsRequest(
      token,
      `/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=${valueInputOption}&insertDataOption=INSERT_ROWS`,
      "POST",
      { values: values.map(v => Array.isArray(v) ? v : [v]) },
    );
    return {
      success: true,
      data: { appendedRange: data.tableRange ?? data.updates?.updatedRange, updatedCells: (data as any).updates?.updatedCells ?? 0 },
      error: null,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return { success: false, data: {}, error: err instanceof Error ? err.message : String(err), durationMs: Date.now() - start };
  }
}

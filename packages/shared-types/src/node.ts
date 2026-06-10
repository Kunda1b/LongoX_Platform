export type NodeFamily =
  | "trigger"
  | "action"
  | "logic"
  | "ai"
  | "data"
  | "human"
  | "utility"
  | "boundary";

export interface NodeTypeDefinition {
  id: string;
  family: NodeFamily;
  name: string;
  description: string;
  icon: string;
  category: string;
  configSchema: Record<string, unknown>;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  defaultConfig: Record<string, unknown>;
}

export const NODE_TYPE_REGISTRY: Record<string, NodeTypeDefinition> = {
  "trigger.manual": {
    id: "trigger.manual",
    family: "trigger",
    name: "Manual Trigger",
    description: "Start a workflow manually",
    icon: "play",
    category: "trigger",
    configSchema: {},
    inputSchema: {},
    outputSchema: { triggeredAt: "string", payload: "object" },
    defaultConfig: {},
  },
  "trigger.webhook": {
    id: "trigger.webhook",
    family: "trigger",
    name: "Webhook",
    description: "Trigger via incoming webhook",
    icon: "webhook",
    category: "trigger",
    configSchema: { path: "string", method: "string" },
    inputSchema: {},
    outputSchema: { body: "object", headers: "object", query: "object" },
    defaultConfig: { method: "POST" },
  },
  "trigger.schedule": {
    id: "trigger.schedule",
    family: "trigger",
    name: "Schedule",
    description: "Run on a cron schedule",
    icon: "clock",
    category: "trigger",
    configSchema: { cron: "string", timezone: "string" },
    inputSchema: {},
    outputSchema: { triggeredAt: "string" },
    defaultConfig: { cron: "0 0 * * *", timezone: "UTC" },
  },
  "action.http": {
    id: "action.http",
    family: "action",
    name: "HTTP Request",
    description: "Make an HTTP request",
    icon: "globe",
    category: "action",
    configSchema: {
      url: "string",
      method: "string",
      headers: "object",
      body: "object",
    },
    inputSchema: {},
    outputSchema: { statusCode: "number", body: "object", headers: "object" },
    defaultConfig: { method: "GET" },
  },
  "action.slack": {
    id: "action.slack",
    family: "action",
    name: "Send Slack Message",
    description: "Post a message to Slack",
    icon: "message-square",
    category: "action",
    configSchema: { channel: "string", text: "string" },
    inputSchema: {},
    outputSchema: { ts: "string", ok: "boolean" },
    defaultConfig: { channel: "#general" },
  },
  "action.send_email": {
    id: "action.send_email",
    family: "action",
    name: "Send Email",
    description: "Send an email notification",
    icon: "mail",
    category: "action",
    configSchema: { to: "string", subject: "string", body: "string" },
    inputSchema: {},
    outputSchema: { messageId: "string", accepted: "boolean" },
    defaultConfig: {},
  },
  "action.db_query": {
    id: "action.db_query",
    family: "action",
    name: "Database Query",
    description: "Run a SQL query",
    icon: "database",
    category: "action",
    configSchema: { connection: "string", query: "string" },
    inputSchema: {},
    outputSchema: { rows: "array", rowCount: "number" },
    defaultConfig: {},
  },
  "logic.if": {
    id: "logic.if",
    family: "logic",
    name: "Condition",
    description: "Branch based on a condition",
    icon: "git-branch",
    category: "logic",
    configSchema: { field: "string", operator: "string", value: "string" },
    inputSchema: {},
    outputSchema: { branch: "string", evaluated: "boolean" },
    defaultConfig: { operator: "eq" },
  },
  "logic.delay": {
    id: "logic.delay",
    family: "logic",
    name: "Delay",
    description: "Wait before proceeding",
    icon: "timer",
    category: "logic",
    configSchema: { duration: "number", unit: "string" },
    inputSchema: {},
    outputSchema: { delayedMs: "number", resumedAt: "string" },
    defaultConfig: { duration: 1, unit: "seconds" },
  },
  "logic.loop": {
    id: "logic.loop",
    family: "logic",
    name: "Loop",
    description: "Iterate over items",
    icon: "repeat",
    category: "logic",
    configSchema: { iterations: "number" },
    inputSchema: {},
    outputSchema: { iterations: "number", completed: "boolean" },
    defaultConfig: { iterations: 5 },
  },
  "ai.prompt": {
    id: "ai.prompt",
    family: "ai",
    name: "AI Prompt",
    description: "Send a prompt to an LLM",
    icon: "sparkles",
    category: "ai",
    configSchema: {
      model: "string",
      systemPrompt: "string",
      maxTokens: "number",
    },
    inputSchema: {},
    outputSchema: { result: "string", modelUsed: "string" },
    defaultConfig: { model: "gpt-4o-mini", maxTokens: 1024 },
  },
  "ai.classify": {
    id: "ai.classify",
    family: "ai",
    name: "AI Classify",
    description: "Classify input into categories",
    icon: "tags",
    category: "ai",
    configSchema: { model: "string", categories: "string" },
    inputSchema: {},
    outputSchema: { category: "string", confidence: "number" },
    defaultConfig: { model: "gpt-4o-mini", categories: "CategoryA,CategoryB" },
  },
  "ai.summarize": {
    id: "ai.summarize",
    family: "ai",
    name: "AI Summarize",
    description: "Summarize input text",
    icon: "align-left",
    category: "ai",
    configSchema: { model: "string", maxWords: "number" },
    inputSchema: {},
    outputSchema: { summary: "string", wordCount: "number" },
    defaultConfig: { model: "gpt-4o-mini", maxWords: 100 },
  },
  "data.transform": {
    id: "data.transform",
    family: "data",
    name: "Transform",
    description: "Transform data shape",
    icon: "shuffle",
    category: "data",
    configSchema: { mapping: "object" },
    inputSchema: {},
    outputSchema: { transformed: "boolean" },
    defaultConfig: {},
  },
};

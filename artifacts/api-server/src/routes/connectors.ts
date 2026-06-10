import { Router, type IRouter } from "express";
import { eq, like, and, sql, desc } from "drizzle-orm";
import { db, connectorsTable, connectorActionsTable, connectorTriggersTable, connectorExecutionsTable } from "@autoflow/db";
import {
  ListConnectorsQueryParams,
  GetConnectorParams,
  InstallConnectorParams,
} from "@autoflow/api-zod";

const router: IRouter = Router();

// ─── Connector seed data ──────────────────────────────────────────────────────

type ActionSeed = {
  actionId: string; name: string; description: string;
  inputSchema: Record<string, unknown>; outputSchema: Record<string, unknown>;
};
type TriggerSeed = {
  triggerId: string; triggerType: string; name: string; description: string;
  config?: Record<string, unknown>; pollingInterval?: number;
};
type ConnectorSeed = {
  name: string; displayName?: string; version: string; sdkVersion: string;
  category: string; description: string; icon: string; color: string; author: string;
  permissions: string[]; capabilities: {
    actions: boolean; pollingTriggers: boolean; webhookTriggers: boolean;
    oauth2: boolean; apiKey: boolean; batching: boolean; pagination: boolean; fileUpload: boolean;
  };
  authType: string; authConfig: Record<string, unknown>;
  certificationLevel: string; rateLimit: { requestsPerMinute: number; burst: number };
  isInstalled: boolean; isFeatured: boolean;
  actionCount: number; triggerCount: number; installCount: number; rating: number;
  healthStatus: Record<string, unknown>;
  actions: ActionSeed[]; triggers: TriggerSeed[];
};

const CONNECTOR_SEEDS: ConnectorSeed[] = [
  {
    name: "HubSpot", displayName: "HubSpot CRM", version: "3.2.1", sdkVersion: "1.0",
    category: "crm", author: "HubSpot", color: "#FF7A59",
    description: "Connect to HubSpot CRM to manage contacts, deals, companies, and marketing campaigns across your organization.",
    icon: "H", certificationLevel: "official", authType: "oauth2",
    isInstalled: true, isFeatured: true, actionCount: 8, triggerCount: 4,
    installCount: 42300, rating: 4.8,
    permissions: ["contacts:read", "contacts:write", "deals:read", "deals:write", "marketing:write"],
    capabilities: { actions: true, pollingTriggers: true, webhookTriggers: true, oauth2: true, apiKey: false, batching: true, pagination: true, fileUpload: false },
    authConfig: { authorizationUrl: "https://app.hubspot.com/oauth/authorize", tokenUrl: "https://api.hubapi.com/oauth/v1/token", scopes: ["contacts", "deals", "forms"], refreshStrategy: "automatic" },
    rateLimit: { requestsPerMinute: 100, burst: 10 },
    healthStatus: { oauthFailureRate: 0.001, apiErrorRate: 0.002, avgLatencyMs: 145, availability: 99.98 },
    actions: [
      { actionId: "create_contact", name: "Create Contact", description: "Create a new contact in HubSpot CRM",
        inputSchema: { type: "object", properties: { email: { type: "string", format: "email", description: "Contact email" }, firstName: { type: "string" }, lastName: { type: "string" }, phone: { type: "string" }, company: { type: "string" } }, required: ["email"] },
        outputSchema: { type: "object", properties: { id: { type: "string" }, email: { type: "string" }, createdAt: { type: "string" } } } },
      { actionId: "update_contact", name: "Update Contact", description: "Update an existing contact's properties",
        inputSchema: { type: "object", properties: { contactId: { type: "string", description: "HubSpot contact ID" }, email: { type: "string" }, firstName: { type: "string" }, lastName: { type: "string" }, phone: { type: "string" } }, required: ["contactId"] },
        outputSchema: { type: "object", properties: { id: { type: "string" }, updatedAt: { type: "string" } } } },
      { actionId: "get_contact", name: "Get Contact", description: "Retrieve a contact by email or ID",
        inputSchema: { type: "object", properties: { email: { type: "string" }, contactId: { type: "string" } } },
        outputSchema: { type: "object", properties: { id: { type: "string" }, email: { type: "string" }, firstName: { type: "string" }, lastName: { type: "string" } } } },
      { actionId: "create_deal", name: "Create Deal", description: "Create a new deal in the CRM pipeline",
        inputSchema: { type: "object", properties: { dealName: { type: "string", description: "Name of the deal" }, amount: { type: "number" }, stage: { type: "string" }, closeDate: { type: "string", format: "date" } }, required: ["dealName"] },
        outputSchema: { type: "object", properties: { dealId: { type: "string" }, stage: { type: "string" }, amount: { type: "number" } } } },
      { actionId: "update_deal_stage", name: "Update Deal Stage", description: "Move a deal to a new pipeline stage",
        inputSchema: { type: "object", properties: { dealId: { type: "string" }, stage: { type: "string" } }, required: ["dealId", "stage"] },
        outputSchema: { type: "object", properties: { dealId: { type: "string" }, stage: { type: "string" } } } },
      { actionId: "send_email", name: "Send Marketing Email", description: "Send a marketing email to a contact via HubSpot",
        inputSchema: { type: "object", properties: { contactId: { type: "string" }, emailId: { type: "string", description: "Email template ID" } }, required: ["contactId", "emailId"] },
        outputSchema: { type: "object", properties: { messageId: { type: "string" }, status: { type: "string" } } } },
      { actionId: "add_note", name: "Add Note", description: "Add a note to a contact, deal or company",
        inputSchema: { type: "object", properties: { associatedId: { type: "string" }, associatedType: { type: "string", enum: ["contact", "deal", "company"] }, note: { type: "string" } }, required: ["associatedId", "associatedType", "note"] },
        outputSchema: { type: "object", properties: { noteId: { type: "string" } } } },
      { actionId: "search_contacts", name: "Search Contacts", description: "Search contacts with filters and pagination",
        inputSchema: { type: "object", properties: { query: { type: "string" }, limit: { type: "number", default: 10 } } },
        outputSchema: { type: "object", properties: { contacts: { type: "array" }, total: { type: "number" } } } },
    ],
    triggers: [
      { triggerId: "new_contact", triggerType: "webhook", name: "New Contact Created", description: "Fires when a new contact is created in HubSpot", config: { event: "contact.creation" } },
      { triggerId: "deal_stage_changed", triggerType: "webhook", name: "Deal Stage Changed", description: "Fires when a deal moves to a new pipeline stage", config: { event: "deal.propertyChange.dealstage" } },
      { triggerId: "form_submitted", triggerType: "webhook", name: "Form Submitted", description: "Fires when a HubSpot form is submitted", config: { event: "form.submission" } },
      { triggerId: "contact_updated", triggerType: "polling", name: "Contact Updated", description: "Polls for recently updated contacts", config: {}, pollingInterval: 300 },
    ],
  },
  {
    name: "Slack", displayName: "Slack Messaging", version: "2.1.0", sdkVersion: "1.0",
    category: "communication", author: "Slack Technologies", color: "#4A154B",
    description: "Send messages, create channels, and respond to events in Slack. The leading team communication platform.",
    icon: "S", certificationLevel: "official", authType: "oauth2",
    isInstalled: false, isFeatured: true, actionCount: 6, triggerCount: 3,
    installCount: 38900, rating: 4.9,
    permissions: ["channels:read", "channels:write", "chat:write", "files:write", "users:read"],
    capabilities: { actions: true, pollingTriggers: false, webhookTriggers: true, oauth2: true, apiKey: false, batching: false, pagination: true, fileUpload: true },
    authConfig: { authorizationUrl: "https://slack.com/oauth/v2/authorize", tokenUrl: "https://slack.com/api/oauth.v2.access", scopes: ["channels:read", "chat:write", "files:write"], refreshStrategy: "automatic" },
    rateLimit: { requestsPerMinute: 50, burst: 5 },
    healthStatus: { oauthFailureRate: 0.0005, apiErrorRate: 0.001, avgLatencyMs: 98, availability: 99.99 },
    actions: [
      { actionId: "send_message", name: "Send Message", description: "Send a message to a Slack channel",
        inputSchema: { type: "object", properties: { channel: { type: "string", description: "Channel ID or name" }, text: { type: "string", description: "Message text" }, blocks: { type: "array", description: "Block Kit blocks" } }, required: ["channel", "text"] },
        outputSchema: { type: "object", properties: { ts: { type: "string" }, channel: { type: "string" } } } },
      { actionId: "send_dm", name: "Send Direct Message", description: "Send a direct message to a Slack user",
        inputSchema: { type: "object", properties: { userId: { type: "string", description: "User ID" }, text: { type: "string" } }, required: ["userId", "text"] },
        outputSchema: { type: "object", properties: { ts: { type: "string" }, channel: { type: "string" } } } },
      { actionId: "create_channel", name: "Create Channel", description: "Create a new Slack channel",
        inputSchema: { type: "object", properties: { name: { type: "string", description: "Channel name (lowercase, no spaces)" }, isPrivate: { type: "boolean", default: false } }, required: ["name"] },
        outputSchema: { type: "object", properties: { channelId: { type: "string" }, name: { type: "string" } } } },
      { actionId: "invite_user", name: "Invite User to Channel", description: "Invite a user to an existing channel",
        inputSchema: { type: "object", properties: { channelId: { type: "string" }, userId: { type: "string" } }, required: ["channelId", "userId"] },
        outputSchema: { type: "object", properties: { success: { type: "boolean" } } } },
      { actionId: "upload_file", name: "Upload File", description: "Upload a file to a Slack channel",
        inputSchema: { type: "object", properties: { channelId: { type: "string" }, filename: { type: "string" }, content: { type: "string" } }, required: ["channelId", "filename"] },
        outputSchema: { type: "object", properties: { fileId: { type: "string" }, permalink: { type: "string" } } } },
      { actionId: "get_user_info", name: "Get User Info", description: "Retrieve information about a Slack user",
        inputSchema: { type: "object", properties: { userId: { type: "string" } }, required: ["userId"] },
        outputSchema: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, email: { type: "string" } } } },
    ],
    triggers: [
      { triggerId: "new_message", triggerType: "webhook", name: "New Message in Channel", description: "Fires when a new message is posted in a monitored channel", config: { event: "message" } },
      { triggerId: "mention", triggerType: "webhook", name: "Bot Mentioned", description: "Fires when the bot is @mentioned", config: { event: "app_mention" } },
      { triggerId: "user_joined", triggerType: "webhook", name: "User Joined Channel", description: "Fires when a user joins a channel", config: { event: "member_joined_channel" } },
    ],
  },
  {
    name: "Stripe", displayName: "Stripe Payments", version: "5.0.0", sdkVersion: "1.0",
    category: "payments", author: "Stripe", color: "#635BFF",
    description: "Accept payments, manage subscriptions, and handle refunds using Stripe's comprehensive payments infrastructure.",
    icon: "St", certificationLevel: "official", authType: "apikey",
    isInstalled: true, isFeatured: true, actionCount: 7, triggerCount: 3,
    installCount: 29400, rating: 4.9,
    permissions: ["charges:write", "customers:write", "subscriptions:write", "refunds:write"],
    capabilities: { actions: true, pollingTriggers: false, webhookTriggers: true, oauth2: false, apiKey: true, batching: true, pagination: true, fileUpload: false },
    authConfig: { keyHeader: "Authorization", keyPrefix: "Bearer sk_" },
    rateLimit: { requestsPerMinute: 100, burst: 10 },
    healthStatus: { oauthFailureRate: 0, apiErrorRate: 0.001, avgLatencyMs: 120, availability: 99.99 },
    actions: [
      { actionId: "create_customer", name: "Create Customer", description: "Create a new Stripe customer",
        inputSchema: { type: "object", properties: { email: { type: "string" }, name: { type: "string" }, phone: { type: "string" }, metadata: { type: "object" } }, required: ["email"] },
        outputSchema: { type: "object", properties: { customerId: { type: "string" }, email: { type: "string" } } } },
      { actionId: "create_charge", name: "Create Charge", description: "Create a one-time payment charge",
        inputSchema: { type: "object", properties: { amount: { type: "number", description: "Amount in cents" }, currency: { type: "string", default: "usd" }, customerId: { type: "string" }, description: { type: "string" } }, required: ["amount", "currency"] },
        outputSchema: { type: "object", properties: { chargeId: { type: "string" }, status: { type: "string" }, amount: { type: "number" } } } },
      { actionId: "create_subscription", name: "Create Subscription", description: "Subscribe a customer to a price/plan",
        inputSchema: { type: "object", properties: { customerId: { type: "string" }, priceId: { type: "string" }, trialDays: { type: "number" } }, required: ["customerId", "priceId"] },
        outputSchema: { type: "object", properties: { subscriptionId: { type: "string" }, status: { type: "string" }, currentPeriodEnd: { type: "string" } } } },
      { actionId: "refund_charge", name: "Refund Charge", description: "Refund a previous charge (full or partial)",
        inputSchema: { type: "object", properties: { chargeId: { type: "string" }, amount: { type: "number", description: "Amount to refund in cents (omit for full refund)" } }, required: ["chargeId"] },
        outputSchema: { type: "object", properties: { refundId: { type: "string" }, status: { type: "string" }, amount: { type: "number" } } } },
      { actionId: "list_invoices", name: "List Invoices", description: "List invoices for a customer",
        inputSchema: { type: "object", properties: { customerId: { type: "string" }, limit: { type: "number", default: 10 } }, required: ["customerId"] },
        outputSchema: { type: "object", properties: { invoices: { type: "array" }, hasMore: { type: "boolean" } } } },
      { actionId: "cancel_subscription", name: "Cancel Subscription", description: "Cancel an active subscription",
        inputSchema: { type: "object", properties: { subscriptionId: { type: "string" }, immediately: { type: "boolean", default: false } }, required: ["subscriptionId"] },
        outputSchema: { type: "object", properties: { subscriptionId: { type: "string" }, status: { type: "string" } } } },
      { actionId: "update_customer", name: "Update Customer", description: "Update a customer's billing details",
        inputSchema: { type: "object", properties: { customerId: { type: "string" }, email: { type: "string" }, name: { type: "string" }, phone: { type: "string" } }, required: ["customerId"] },
        outputSchema: { type: "object", properties: { customerId: { type: "string" }, updatedAt: { type: "string" } } } },
    ],
    triggers: [
      { triggerId: "payment_succeeded", triggerType: "webhook", name: "Payment Succeeded", description: "Fires when a payment is successfully processed", config: { event: "payment_intent.succeeded" } },
      { triggerId: "payment_failed", triggerType: "webhook", name: "Payment Failed", description: "Fires when a payment attempt fails", config: { event: "payment_intent.payment_failed" } },
      { triggerId: "subscription_created", triggerType: "webhook", name: "Subscription Created", description: "Fires when a new subscription is created", config: { event: "customer.subscription.created" } },
    ],
  },
  {
    name: "OpenAI", displayName: "OpenAI GPT & DALL-E", version: "1.4.0", sdkVersion: "1.0",
    category: "ai", author: "OpenAI", color: "#74AA9C",
    description: "Integrate GPT models, DALL-E image generation, and Whisper transcription into your automation workflows.",
    icon: "AI", certificationLevel: "official", authType: "apikey",
    isInstalled: true, isFeatured: true, actionCount: 4, triggerCount: 0,
    installCount: 51200, rating: 4.7,
    permissions: ["completions:write", "embeddings:write", "images:write", "audio:write"],
    capabilities: { actions: true, pollingTriggers: false, webhookTriggers: false, oauth2: false, apiKey: true, batching: true, pagination: false, fileUpload: true },
    authConfig: { keyHeader: "Authorization", keyPrefix: "Bearer" },
    rateLimit: { requestsPerMinute: 60, burst: 10 },
    healthStatus: { oauthFailureRate: 0, apiErrorRate: 0.003, avgLatencyMs: 850, availability: 99.95 },
    actions: [
      { actionId: "chat_completion", name: "Chat Completion", description: "Generate a response using GPT-4 or GPT-3.5",
        inputSchema: { type: "object", properties: { model: { type: "string", default: "gpt-4o", enum: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"] }, messages: { type: "array", description: "Array of message objects" }, temperature: { type: "number", default: 0.7, minimum: 0, maximum: 2 }, maxTokens: { type: "number" } }, required: ["model", "messages"] },
        outputSchema: { type: "object", properties: { content: { type: "string" }, model: { type: "string" }, usage: { type: "object" } } } },
      { actionId: "create_embedding", name: "Create Embedding", description: "Generate a vector embedding for semantic search",
        inputSchema: { type: "object", properties: { input: { type: "string", description: "Text to embed" }, model: { type: "string", default: "text-embedding-3-small" } }, required: ["input"] },
        outputSchema: { type: "object", properties: { embedding: { type: "array" }, dimensions: { type: "number" } } } },
      { actionId: "generate_image", name: "Generate Image", description: "Generate an image using DALL-E 3",
        inputSchema: { type: "object", properties: { prompt: { type: "string" }, size: { type: "string", default: "1024x1024", enum: ["256x256", "512x512", "1024x1024", "1792x1024"] }, quality: { type: "string", default: "standard" }, n: { type: "number", default: 1 } }, required: ["prompt"] },
        outputSchema: { type: "object", properties: { url: { type: "string" }, revisedPrompt: { type: "string" } } } },
      { actionId: "transcribe_audio", name: "Transcribe Audio", description: "Transcribe audio to text using Whisper",
        inputSchema: { type: "object", properties: { audioUrl: { type: "string", description: "URL to audio file" }, language: { type: "string", description: "Optional language hint (ISO-639-1)" } }, required: ["audioUrl"] },
        outputSchema: { type: "object", properties: { text: { type: "string" }, language: { type: "string" } } } },
    ],
    triggers: [],
  },
  {
    name: "PostgreSQL", displayName: "PostgreSQL Database", version: "2.0.0", sdkVersion: "1.0",
    category: "database", author: "FlowCraft", color: "#336791",
    description: "Query, insert, update and delete records in any PostgreSQL database. Supports connection pooling and SSL.",
    icon: "Pg", certificationLevel: "official", authType: "apikey",
    isInstalled: false, isFeatured: false, actionCount: 5, triggerCount: 2,
    installCount: 18700, rating: 4.6,
    permissions: ["database:read", "database:write"],
    capabilities: { actions: true, pollingTriggers: true, webhookTriggers: false, oauth2: false, apiKey: true, batching: true, pagination: true, fileUpload: false },
    authConfig: { keyHeader: "X-Connection-String" },
    rateLimit: { requestsPerMinute: 200, burst: 20 },
    healthStatus: { oauthFailureRate: 0, apiErrorRate: 0.001, avgLatencyMs: 22, availability: 99.99 },
    actions: [
      { actionId: "execute_query", name: "Execute Query", description: "Run a raw SQL query and return results",
        inputSchema: { type: "object", properties: { query: { type: "string", description: "SQL query to execute" }, params: { type: "array", description: "Query parameters for parameterized queries" } }, required: ["query"] },
        outputSchema: { type: "object", properties: { rows: { type: "array" }, rowCount: { type: "number" } } } },
      { actionId: "insert_row", name: "Insert Row", description: "Insert a new row into a table",
        inputSchema: { type: "object", properties: { table: { type: "string" }, data: { type: "object", description: "Column → value mapping" } }, required: ["table", "data"] },
        outputSchema: { type: "object", properties: { id: { type: "string" }, inserted: { type: "object" } } } },
      { actionId: "update_row", name: "Update Row", description: "Update rows matching conditions",
        inputSchema: { type: "object", properties: { table: { type: "string" }, where: { type: "object" }, data: { type: "object" } }, required: ["table", "where", "data"] },
        outputSchema: { type: "object", properties: { rowCount: { type: "number" } } } },
      { actionId: "delete_row", name: "Delete Row", description: "Delete rows matching conditions",
        inputSchema: { type: "object", properties: { table: { type: "string" }, where: { type: "object" } }, required: ["table", "where"] },
        outputSchema: { type: "object", properties: { rowCount: { type: "number" } } } },
      { actionId: "list_tables", name: "List Tables", description: "List all tables in the connected database",
        inputSchema: { type: "object", properties: { schema: { type: "string", default: "public" } } },
        outputSchema: { type: "object", properties: { tables: { type: "array" } } } },
    ],
    triggers: [
      { triggerId: "new_row", triggerType: "polling", name: "New Row Added", description: "Polls for newly inserted rows in a table", config: { orderColumn: "created_at" }, pollingInterval: 60 },
      { triggerId: "row_updated", triggerType: "polling", name: "Row Updated", description: "Polls for recently updated rows", config: { orderColumn: "updated_at" }, pollingInterval: 60 },
    ],
  },
  {
    name: "GitHub", displayName: "GitHub", version: "2.3.0", sdkVersion: "1.0",
    category: "development", author: "GitHub", color: "#24292e",
    description: "Automate your GitHub workflows — create issues, open PRs, add comments, and respond to repository events.",
    icon: "GH", certificationLevel: "verified", authType: "oauth2",
    isInstalled: false, isFeatured: true, actionCount: 6, triggerCount: 4,
    installCount: 22100, rating: 4.8,
    permissions: ["repo:read", "repo:write", "issues:write", "pull_requests:write"],
    capabilities: { actions: true, pollingTriggers: false, webhookTriggers: true, oauth2: true, apiKey: true, batching: false, pagination: true, fileUpload: false },
    authConfig: { authorizationUrl: "https://github.com/login/oauth/authorize", tokenUrl: "https://github.com/login/oauth/access_token", scopes: ["repo", "issues", "pull_requests"] },
    rateLimit: { requestsPerMinute: 60, burst: 10 },
    healthStatus: { oauthFailureRate: 0.002, apiErrorRate: 0.001, avgLatencyMs: 185, availability: 99.96 },
    actions: [
      { actionId: "create_issue", name: "Create Issue", description: "Create a new GitHub issue in a repository",
        inputSchema: { type: "object", properties: { owner: { type: "string" }, repo: { type: "string" }, title: { type: "string" }, body: { type: "string" }, labels: { type: "array" }, assignees: { type: "array" } }, required: ["owner", "repo", "title"] },
        outputSchema: { type: "object", properties: { number: { type: "number" }, url: { type: "string" }, state: { type: "string" } } } },
      { actionId: "create_pr", name: "Create Pull Request", description: "Open a pull request between branches",
        inputSchema: { type: "object", properties: { owner: { type: "string" }, repo: { type: "string" }, title: { type: "string" }, head: { type: "string" }, base: { type: "string" }, body: { type: "string" } }, required: ["owner", "repo", "title", "head", "base"] },
        outputSchema: { type: "object", properties: { number: { type: "number" }, url: { type: "string" } } } },
      { actionId: "add_comment", name: "Add Comment", description: "Add a comment to an issue or pull request",
        inputSchema: { type: "object", properties: { owner: { type: "string" }, repo: { type: "string" }, issueNumber: { type: "number" }, body: { type: "string" } }, required: ["owner", "repo", "issueNumber", "body"] },
        outputSchema: { type: "object", properties: { commentId: { type: "number" }, url: { type: "string" } } } },
      { actionId: "merge_pr", name: "Merge Pull Request", description: "Merge a pull request (squash, merge or rebase)",
        inputSchema: { type: "object", properties: { owner: { type: "string" }, repo: { type: "string" }, prNumber: { type: "number" }, mergeMethod: { type: "string", enum: ["merge", "squash", "rebase"], default: "merge" } }, required: ["owner", "repo", "prNumber"] },
        outputSchema: { type: "object", properties: { sha: { type: "string" }, merged: { type: "boolean" } } } },
      { actionId: "create_branch", name: "Create Branch", description: "Create a new git branch from a ref",
        inputSchema: { type: "object", properties: { owner: { type: "string" }, repo: { type: "string" }, branch: { type: "string" }, fromBranch: { type: "string", default: "main" } }, required: ["owner", "repo", "branch"] },
        outputSchema: { type: "object", properties: { ref: { type: "string" }, sha: { type: "string" } } } },
      { actionId: "star_repo", name: "Star Repository", description: "Star a GitHub repository",
        inputSchema: { type: "object", properties: { owner: { type: "string" }, repo: { type: "string" } }, required: ["owner", "repo"] },
        outputSchema: { type: "object", properties: { starred: { type: "boolean" } } } },
    ],
    triggers: [
      { triggerId: "new_issue", triggerType: "webhook", name: "Issue Opened", description: "Fires when a new issue is opened", config: { event: "issues", action: "opened" } },
      { triggerId: "pr_opened", triggerType: "webhook", name: "Pull Request Opened", description: "Fires when a new PR is opened", config: { event: "pull_request", action: "opened" } },
      { triggerId: "push_event", triggerType: "webhook", name: "Code Pushed", description: "Fires when code is pushed to a branch", config: { event: "push" } },
      { triggerId: "release_published", triggerType: "webhook", name: "Release Published", description: "Fires when a new release is published", config: { event: "release", action: "published" } },
    ],
  },
  {
    name: "Salesforce", displayName: "Salesforce CRM", version: "4.1.0", sdkVersion: "1.0",
    category: "crm", author: "Salesforce", color: "#00A1E0",
    description: "Connect to Salesforce to manage leads, opportunities, contacts, and run SOQL queries against your CRM data.",
    icon: "SF", certificationLevel: "verified", authType: "oauth2",
    isInstalled: false, isFeatured: false, actionCount: 6, triggerCount: 3,
    installCount: 14800, rating: 4.5,
    permissions: ["leads:write", "opportunities:write", "contacts:read", "tasks:write"],
    capabilities: { actions: true, pollingTriggers: true, webhookTriggers: true, oauth2: true, apiKey: false, batching: true, pagination: true, fileUpload: false },
    authConfig: { authorizationUrl: "https://login.salesforce.com/services/oauth2/authorize", tokenUrl: "https://login.salesforce.com/services/oauth2/token", scopes: ["api", "refresh_token"], refreshStrategy: "automatic" },
    rateLimit: { requestsPerMinute: 100, burst: 10 },
    healthStatus: { oauthFailureRate: 0.003, apiErrorRate: 0.002, avgLatencyMs: 210, availability: 99.94 },
    actions: [
      { actionId: "create_lead", name: "Create Lead", description: "Create a new Salesforce lead record",
        inputSchema: { type: "object", properties: { firstName: { type: "string" }, lastName: { type: "string" }, email: { type: "string" }, company: { type: "string" }, phone: { type: "string" }, leadSource: { type: "string" } }, required: ["lastName", "company"] },
        outputSchema: { type: "object", properties: { id: { type: "string" }, success: { type: "boolean" } } } },
      { actionId: "update_opportunity", name: "Update Opportunity", description: "Update an opportunity's stage or amount",
        inputSchema: { type: "object", properties: { opportunityId: { type: "string" }, stageName: { type: "string" }, amount: { type: "number" }, closeDate: { type: "string" } }, required: ["opportunityId"] },
        outputSchema: { type: "object", properties: { id: { type: "string" }, success: { type: "boolean" } } } },
      { actionId: "get_contact", name: "Get Contact", description: "Retrieve a contact by ID or email",
        inputSchema: { type: "object", properties: { contactId: { type: "string" }, email: { type: "string" } } },
        outputSchema: { type: "object", properties: { id: { type: "string" }, firstName: { type: "string" }, lastName: { type: "string" }, email: { type: "string" } } } },
      { actionId: "search_records", name: "Search Records (SOQL)", description: "Run a SOQL query against your Salesforce org",
        inputSchema: { type: "object", properties: { query: { type: "string", description: "SOQL query string" } }, required: ["query"] },
        outputSchema: { type: "object", properties: { records: { type: "array" }, totalSize: { type: "number" } } } },
      { actionId: "create_task", name: "Create Task", description: "Create a task associated with a record",
        inputSchema: { type: "object", properties: { subject: { type: "string" }, whoId: { type: "string", description: "Contact or Lead ID" }, whatId: { type: "string", description: "Opportunity or Account ID" }, dueDate: { type: "string" }, priority: { type: "string", enum: ["High", "Normal", "Low"] } }, required: ["subject"] },
        outputSchema: { type: "object", properties: { id: { type: "string" } } } },
      { actionId: "convert_lead", name: "Convert Lead", description: "Convert a lead to a contact and opportunity",
        inputSchema: { type: "object", properties: { leadId: { type: "string" }, convertedStatus: { type: "string" }, opportunityName: { type: "string" } }, required: ["leadId", "convertedStatus"] },
        outputSchema: { type: "object", properties: { contactId: { type: "string" }, opportunityId: { type: "string" }, accountId: { type: "string" } } } },
    ],
    triggers: [
      { triggerId: "new_lead", triggerType: "polling", name: "New Lead Created", description: "Polls for newly created leads", config: {}, pollingInterval: 300 },
      { triggerId: "opportunity_updated", triggerType: "polling", name: "Opportunity Updated", description: "Polls for recently updated opportunities", config: {}, pollingInterval: 300 },
      { triggerId: "contact_created", triggerType: "webhook", name: "Contact Created", description: "Fires when a new contact is created via Apex trigger", config: {} },
    ],
  },
  {
    name: "Twilio", displayName: "Twilio Communications", version: "1.8.0", sdkVersion: "1.0",
    category: "communication", author: "Twilio", color: "#F22F46",
    description: "Send SMS, make voice calls, and send WhatsApp messages using Twilio's programmable communications platform.",
    icon: "Tw", certificationLevel: "verified", authType: "apikey",
    isInstalled: false, isFeatured: false, actionCount: 4, triggerCount: 2,
    installCount: 11200, rating: 4.6,
    permissions: ["sms:write", "calls:write", "whatsapp:write"],
    capabilities: { actions: true, pollingTriggers: false, webhookTriggers: true, oauth2: false, apiKey: true, batching: false, pagination: false, fileUpload: false },
    authConfig: { keyHeader: "Authorization", keyPrefix: "Basic" },
    rateLimit: { requestsPerMinute: 100, burst: 10 },
    healthStatus: { oauthFailureRate: 0, apiErrorRate: 0.002, avgLatencyMs: 180, availability: 99.95 },
    actions: [
      { actionId: "send_sms", name: "Send SMS", description: "Send an SMS message to a phone number",
        inputSchema: { type: "object", properties: { to: { type: "string", description: "Recipient phone number (E.164 format)" }, from: { type: "string", description: "Your Twilio number" }, body: { type: "string" } }, required: ["to", "from", "body"] },
        outputSchema: { type: "object", properties: { sid: { type: "string" }, status: { type: "string" } } } },
      { actionId: "make_call", name: "Make Voice Call", description: "Initiate an outbound voice call",
        inputSchema: { type: "object", properties: { to: { type: "string" }, from: { type: "string" }, twimlUrl: { type: "string", description: "TwiML instructions URL" } }, required: ["to", "from", "twimlUrl"] },
        outputSchema: { type: "object", properties: { callSid: { type: "string" }, status: { type: "string" } } } },
      { actionId: "send_whatsapp", name: "Send WhatsApp Message", description: "Send a WhatsApp message via Twilio",
        inputSchema: { type: "object", properties: { to: { type: "string", description: "WhatsApp number (whatsapp:+1...)" }, from: { type: "string" }, body: { type: "string" }, mediaUrl: { type: "string" } }, required: ["to", "from", "body"] },
        outputSchema: { type: "object", properties: { sid: { type: "string" }, status: { type: "string" } } } },
      { actionId: "get_call_status", name: "Get Call Status", description: "Check the status of an outbound call",
        inputSchema: { type: "object", properties: { callSid: { type: "string" } }, required: ["callSid"] },
        outputSchema: { type: "object", properties: { status: { type: "string" }, duration: { type: "string" } } } },
    ],
    triggers: [
      { triggerId: "incoming_sms", triggerType: "webhook", name: "Incoming SMS", description: "Fires when an SMS is received on your Twilio number", config: { event: "sms.received" } },
      { triggerId: "call_status_changed", triggerType: "webhook", name: "Call Status Changed", description: "Fires on call status updates (ringing, answered, completed)", config: { event: "call.statusCallback" } },
    ],
  },
  {
    name: "Google Sheets", displayName: "Google Sheets", version: "2.5.0", sdkVersion: "1.0",
    category: "data", author: "Google", color: "#0F9D58",
    description: "Read and write data to Google Sheets. Append rows, update cells, and trigger workflows from spreadsheet changes.",
    icon: "GS", certificationLevel: "official", authType: "oauth2",
    isInstalled: false, isFeatured: true, actionCount: 5, triggerCount: 2,
    installCount: 31400, rating: 4.7,
    permissions: ["spreadsheets:read", "spreadsheets:write"],
    capabilities: { actions: true, pollingTriggers: true, webhookTriggers: false, oauth2: true, apiKey: false, batching: true, pagination: true, fileUpload: false },
    authConfig: { authorizationUrl: "https://accounts.google.com/o/oauth2/auth", tokenUrl: "https://oauth2.googleapis.com/token", scopes: ["https://www.googleapis.com/auth/spreadsheets"], refreshStrategy: "automatic" },
    rateLimit: { requestsPerMinute: 60, burst: 5 },
    healthStatus: { oauthFailureRate: 0.001, apiErrorRate: 0.001, avgLatencyMs: 165, availability: 99.97 },
    actions: [
      { actionId: "append_row", name: "Append Row", description: "Append a new row to the end of a sheet",
        inputSchema: { type: "object", properties: { spreadsheetId: { type: "string" }, sheetName: { type: "string", default: "Sheet1" }, values: { type: "array", description: "Array of cell values" } }, required: ["spreadsheetId", "values"] },
        outputSchema: { type: "object", properties: { updatedRange: { type: "string" }, updatedRows: { type: "number" } } } },
      { actionId: "update_cell", name: "Update Cell", description: "Update a specific cell or range",
        inputSchema: { type: "object", properties: { spreadsheetId: { type: "string" }, range: { type: "string", description: "A1 notation range (e.g. Sheet1!B2)" }, value: { type: "string" } }, required: ["spreadsheetId", "range", "value"] },
        outputSchema: { type: "object", properties: { updatedRange: { type: "string" } } } },
      { actionId: "get_sheet_data", name: "Get Sheet Data", description: "Retrieve all data from a sheet or range",
        inputSchema: { type: "object", properties: { spreadsheetId: { type: "string" }, range: { type: "string", description: "Optional A1 notation range" } }, required: ["spreadsheetId"] },
        outputSchema: { type: "object", properties: { values: { type: "array" }, rowCount: { type: "number" } } } },
      { actionId: "create_sheet", name: "Create Sheet", description: "Add a new sheet tab to a spreadsheet",
        inputSchema: { type: "object", properties: { spreadsheetId: { type: "string" }, title: { type: "string" } }, required: ["spreadsheetId", "title"] },
        outputSchema: { type: "object", properties: { sheetId: { type: "number" }, title: { type: "string" } } } },
      { actionId: "delete_row", name: "Delete Row", description: "Delete a specific row from a sheet",
        inputSchema: { type: "object", properties: { spreadsheetId: { type: "string" }, sheetName: { type: "string" }, rowIndex: { type: "number", description: "1-based row index" } }, required: ["spreadsheetId", "rowIndex"] },
        outputSchema: { type: "object", properties: { deleted: { type: "boolean" } } } },
    ],
    triggers: [
      { triggerId: "new_row", triggerType: "polling", name: "New Row Added", description: "Polls for newly appended rows in the spreadsheet", config: {}, pollingInterval: 300 },
      { triggerId: "spreadsheet_updated", triggerType: "polling", name: "Spreadsheet Updated", description: "Polls for any changes to the spreadsheet", config: {}, pollingInterval: 600 },
    ],
  },
  {
    name: "Jira", displayName: "Jira Software", version: "3.0.0", sdkVersion: "1.0",
    category: "development", author: "Atlassian", color: "#0052CC",
    description: "Create and update Jira issues, transition tickets through workflows, and respond to sprint and project events.",
    icon: "Ji", certificationLevel: "verified", authType: "oauth2",
    isInstalled: false, isFeatured: false, actionCount: 5, triggerCount: 3,
    installCount: 16200, rating: 4.5,
    permissions: ["issues:write", "projects:read", "sprints:read", "comments:write"],
    capabilities: { actions: true, pollingTriggers: false, webhookTriggers: true, oauth2: true, apiKey: true, batching: false, pagination: true, fileUpload: true },
    authConfig: { authorizationUrl: "https://auth.atlassian.com/authorize", tokenUrl: "https://auth.atlassian.com/oauth/token", scopes: ["read:jira-work", "write:jira-work"], refreshStrategy: "automatic" },
    rateLimit: { requestsPerMinute: 100, burst: 10 },
    healthStatus: { oauthFailureRate: 0.002, apiErrorRate: 0.003, avgLatencyMs: 225, availability: 99.93 },
    actions: [
      { actionId: "create_issue", name: "Create Issue", description: "Create a new Jira issue (bug, story, task)",
        inputSchema: { type: "object", properties: { projectKey: { type: "string" }, summary: { type: "string" }, issueType: { type: "string", enum: ["Bug", "Story", "Task", "Epic"], default: "Task" }, description: { type: "string" }, assignee: { type: "string" }, priority: { type: "string" } }, required: ["projectKey", "summary"] },
        outputSchema: { type: "object", properties: { key: { type: "string" }, id: { type: "string" }, url: { type: "string" } } } },
      { actionId: "update_issue", name: "Update Issue", description: "Update fields on a Jira issue",
        inputSchema: { type: "object", properties: { issueKey: { type: "string" }, summary: { type: "string" }, description: { type: "string" }, priority: { type: "string" }, assignee: { type: "string" } }, required: ["issueKey"] },
        outputSchema: { type: "object", properties: { key: { type: "string" }, updated: { type: "boolean" } } } },
      { actionId: "transition_issue", name: "Transition Issue", description: "Move a Jira issue to a new workflow status",
        inputSchema: { type: "object", properties: { issueKey: { type: "string" }, transitionName: { type: "string", description: "Target status name (e.g. In Progress, Done)" } }, required: ["issueKey", "transitionName"] },
        outputSchema: { type: "object", properties: { key: { type: "string" }, status: { type: "string" } } } },
      { actionId: "add_comment", name: "Add Comment", description: "Add a comment to an issue",
        inputSchema: { type: "object", properties: { issueKey: { type: "string" }, body: { type: "string" } }, required: ["issueKey", "body"] },
        outputSchema: { type: "object", properties: { commentId: { type: "string" } } } },
      { actionId: "get_issue", name: "Get Issue", description: "Retrieve full details of a Jira issue",
        inputSchema: { type: "object", properties: { issueKey: { type: "string" } }, required: ["issueKey"] },
        outputSchema: { type: "object", properties: { key: { type: "string" }, summary: { type: "string" }, status: { type: "string" }, assignee: { type: "string" } } } },
    ],
    triggers: [
      { triggerId: "issue_created", triggerType: "webhook", name: "Issue Created", description: "Fires when a new issue is created in a project", config: { event: "jira:issue_created" } },
      { triggerId: "issue_updated", triggerType: "webhook", name: "Issue Updated", description: "Fires when an issue is updated or transitioned", config: { event: "jira:issue_updated" } },
      { triggerId: "sprint_started", triggerType: "webhook", name: "Sprint Started", description: "Fires when a sprint begins", config: { event: "sprint_started" } },
    ],
  },
  {
    name: "SendGrid", displayName: "SendGrid Email", version: "1.5.0", sdkVersion: "1.0",
    category: "communication", author: "Twilio SendGrid", color: "#1A82E2",
    description: "Send transactional and marketing emails at scale using SendGrid's reliable email delivery infrastructure.",
    icon: "SG", certificationLevel: "verified", authType: "apikey",
    isInstalled: false, isFeatured: false, actionCount: 3, triggerCount: 0,
    installCount: 9800, rating: 4.6,
    permissions: ["mail:send", "contacts:write", "lists:write"],
    capabilities: { actions: true, pollingTriggers: false, webhookTriggers: false, oauth2: false, apiKey: true, batching: true, pagination: false, fileUpload: true },
    authConfig: { keyHeader: "Authorization", keyPrefix: "Bearer" },
    rateLimit: { requestsPerMinute: 100, burst: 10 },
    healthStatus: { oauthFailureRate: 0, apiErrorRate: 0.001, avgLatencyMs: 95, availability: 99.98 },
    actions: [
      { actionId: "send_email", name: "Send Transactional Email", description: "Send a transactional email to one or more recipients",
        inputSchema: { type: "object", properties: { to: { type: "string", description: "Recipient email" }, from: { type: "string" }, subject: { type: "string" }, htmlContent: { type: "string" }, textContent: { type: "string" } }, required: ["to", "from", "subject"] },
        outputSchema: { type: "object", properties: { messageId: { type: "string" }, accepted: { type: "boolean" } } } },
      { actionId: "send_template", name: "Send Template Email", description: "Send a SendGrid dynamic template email",
        inputSchema: { type: "object", properties: { to: { type: "string" }, from: { type: "string" }, templateId: { type: "string" }, dynamicData: { type: "object" } }, required: ["to", "from", "templateId"] },
        outputSchema: { type: "object", properties: { messageId: { type: "string" } } } },
      { actionId: "add_contact", name: "Add Contact to List", description: "Add or update a contact in a SendGrid marketing list",
        inputSchema: { type: "object", properties: { email: { type: "string" }, firstName: { type: "string" }, lastName: { type: "string" }, listIds: { type: "array" } }, required: ["email"] },
        outputSchema: { type: "object", properties: { jobId: { type: "string" } } } },
    ],
    triggers: [],
  },
  {
    name: "MongoDB", displayName: "MongoDB Atlas", version: "1.3.0", sdkVersion: "1.0",
    category: "database", author: "MongoDB", color: "#47A248",
    description: "Read and write documents in MongoDB Atlas. Supports complex queries, aggregation pipelines, and change stream polling.",
    icon: "Mg", certificationLevel: "community", authType: "apikey",
    isInstalled: false, isFeatured: false, actionCount: 4, triggerCount: 2,
    installCount: 6400, rating: 4.2,
    permissions: ["database:read", "database:write"],
    capabilities: { actions: true, pollingTriggers: true, webhookTriggers: false, oauth2: false, apiKey: true, batching: true, pagination: true, fileUpload: false },
    authConfig: { keyHeader: "X-Connection-String" },
    rateLimit: { requestsPerMinute: 200, burst: 20 },
    healthStatus: { oauthFailureRate: 0, apiErrorRate: 0.003, avgLatencyMs: 35, availability: 99.92 },
    actions: [
      { actionId: "insert_document", name: "Insert Document", description: "Insert a new document into a collection",
        inputSchema: { type: "object", properties: { database: { type: "string" }, collection: { type: "string" }, document: { type: "object" } }, required: ["database", "collection", "document"] },
        outputSchema: { type: "object", properties: { insertedId: { type: "string" } } } },
      { actionId: "find_documents", name: "Find Documents", description: "Query documents with a filter",
        inputSchema: { type: "object", properties: { database: { type: "string" }, collection: { type: "string" }, filter: { type: "object" }, limit: { type: "number", default: 10 }, sort: { type: "object" } }, required: ["database", "collection"] },
        outputSchema: { type: "object", properties: { documents: { type: "array" }, count: { type: "number" } } } },
      { actionId: "update_document", name: "Update Document", description: "Update documents matching a filter",
        inputSchema: { type: "object", properties: { database: { type: "string" }, collection: { type: "string" }, filter: { type: "object" }, update: { type: "object" }, upsert: { type: "boolean" } }, required: ["database", "collection", "filter", "update"] },
        outputSchema: { type: "object", properties: { modifiedCount: { type: "number" }, matchedCount: { type: "number" } } } },
      { actionId: "delete_document", name: "Delete Document", description: "Delete documents matching a filter",
        inputSchema: { type: "object", properties: { database: { type: "string" }, collection: { type: "string" }, filter: { type: "object" }, deleteMany: { type: "boolean", default: false } }, required: ["database", "collection", "filter"] },
        outputSchema: { type: "object", properties: { deletedCount: { type: "number" } } } },
    ],
    triggers: [
      { triggerId: "new_document", triggerType: "polling", name: "New Document Added", description: "Polls for newly inserted documents", config: { sortField: "_id" }, pollingInterval: 60 },
      { triggerId: "document_changed", triggerType: "polling", name: "Document Changed", description: "Polls for recently updated documents", config: { sortField: "updatedAt" }, pollingInterval: 120 },
    ],
  },
  {
    name: "Airtable", displayName: "Airtable", version: "1.2.0", sdkVersion: "1.0",
    category: "data", author: "Airtable", color: "#FF5A5F",
    description: "Create, read, update and delete records in Airtable bases. Great for managing structured data without a database.",
    icon: "At", certificationLevel: "community", authType: "apikey",
    isInstalled: false, isFeatured: false, actionCount: 4, triggerCount: 2,
    installCount: 7900, rating: 4.3,
    permissions: ["bases:read", "records:write"],
    capabilities: { actions: true, pollingTriggers: true, webhookTriggers: false, oauth2: false, apiKey: true, batching: true, pagination: true, fileUpload: true },
    authConfig: { keyHeader: "Authorization", keyPrefix: "Bearer" },
    rateLimit: { requestsPerMinute: 5, burst: 5 },
    healthStatus: { oauthFailureRate: 0, apiErrorRate: 0.004, avgLatencyMs: 280, availability: 99.88 },
    actions: [
      { actionId: "create_record", name: "Create Record", description: "Create a new record in an Airtable table",
        inputSchema: { type: "object", properties: { baseId: { type: "string" }, tableName: { type: "string" }, fields: { type: "object", description: "Field name → value mapping" } }, required: ["baseId", "tableName", "fields"] },
        outputSchema: { type: "object", properties: { id: { type: "string" }, createdTime: { type: "string" } } } },
      { actionId: "update_record", name: "Update Record", description: "Update fields on an existing record",
        inputSchema: { type: "object", properties: { baseId: { type: "string" }, tableName: { type: "string" }, recordId: { type: "string" }, fields: { type: "object" } }, required: ["baseId", "tableName", "recordId", "fields"] },
        outputSchema: { type: "object", properties: { id: { type: "string" }, updated: { type: "boolean" } } } },
      { actionId: "get_records", name: "Get Records", description: "List or filter records from a table",
        inputSchema: { type: "object", properties: { baseId: { type: "string" }, tableName: { type: "string" }, filterFormula: { type: "string" }, maxRecords: { type: "number", default: 100 } }, required: ["baseId", "tableName"] },
        outputSchema: { type: "object", properties: { records: { type: "array" }, offset: { type: "string" } } } },
      { actionId: "delete_record", name: "Delete Record", description: "Delete a record from an Airtable table",
        inputSchema: { type: "object", properties: { baseId: { type: "string" }, tableName: { type: "string" }, recordId: { type: "string" } }, required: ["baseId", "tableName", "recordId"] },
        outputSchema: { type: "object", properties: { id: { type: "string" }, deleted: { type: "boolean" } } } },
    ],
    triggers: [
      { triggerId: "new_record", triggerType: "polling", name: "New Record Created", description: "Polls for newly created records in a table", config: {}, pollingInterval: 300 },
      { triggerId: "record_updated", triggerType: "polling", name: "Record Updated", description: "Polls for recently modified records", config: {}, pollingInterval: 300 },
    ],
  },
  {
    name: "Notion", displayName: "Notion", version: "1.4.0", sdkVersion: "1.0",
    category: "data", author: "Notion Labs", color: "#000000",
    description: "Create and update Notion pages, query databases, and build wikis. Connect Notion to your automation workflows.",
    icon: "No", certificationLevel: "verified", authType: "oauth2",
    isInstalled: false, isFeatured: false, actionCount: 4, triggerCount: 2,
    installCount: 8800, rating: 4.4,
    permissions: ["pages:write", "databases:write", "blocks:read"],
    capabilities: { actions: true, pollingTriggers: true, webhookTriggers: false, oauth2: true, apiKey: true, batching: false, pagination: true, fileUpload: true },
    authConfig: { authorizationUrl: "https://api.notion.com/v1/oauth/authorize", tokenUrl: "https://api.notion.com/v1/oauth/token", scopes: ["read_content", "update_content"] },
    rateLimit: { requestsPerMinute: 3, burst: 3 },
    healthStatus: { oauthFailureRate: 0.001, apiErrorRate: 0.003, avgLatencyMs: 310, availability: 99.90 },
    actions: [
      { actionId: "create_page", name: "Create Page", description: "Create a new Notion page in a parent page or database",
        inputSchema: { type: "object", properties: { parentId: { type: "string", description: "Parent page or database ID" }, title: { type: "string" }, content: { type: "string", description: "Page body text" } }, required: ["parentId", "title"] },
        outputSchema: { type: "object", properties: { id: { type: "string" }, url: { type: "string" } } } },
      { actionId: "update_page", name: "Update Page", description: "Update properties or content of a Notion page",
        inputSchema: { type: "object", properties: { pageId: { type: "string" }, properties: { type: "object" }, archived: { type: "boolean" } }, required: ["pageId"] },
        outputSchema: { type: "object", properties: { id: { type: "string" }, lastEditedAt: { type: "string" } } } },
      { actionId: "query_database", name: "Query Database", description: "Filter and sort records in a Notion database",
        inputSchema: { type: "object", properties: { databaseId: { type: "string" }, filter: { type: "object" }, sorts: { type: "array" }, pageSize: { type: "number", default: 20 } }, required: ["databaseId"] },
        outputSchema: { type: "object", properties: { results: { type: "array" }, hasMore: { type: "boolean" } } } },
      { actionId: "create_db_entry", name: "Create Database Entry", description: "Add a new entry/row to a Notion database",
        inputSchema: { type: "object", properties: { databaseId: { type: "string" }, properties: { type: "object" } }, required: ["databaseId", "properties"] },
        outputSchema: { type: "object", properties: { id: { type: "string" }, url: { type: "string" } } } },
    ],
    triggers: [
      { triggerId: "new_page", triggerType: "polling", name: "New Page Created", description: "Polls for newly created pages in a database", config: {}, pollingInterval: 600 },
      { triggerId: "database_updated", triggerType: "polling", name: "Database Updated", description: "Polls for recently changed database entries", config: {}, pollingInterval: 600 },
    ],
  },
  {
    name: "Shopify", displayName: "Shopify", version: "2.2.0", sdkVersion: "1.0",
    category: "payments", author: "Shopify", color: "#96BF48",
    description: "Manage products, process orders, and sync inventory with your Shopify store. Automate e-commerce operations.",
    icon: "Sh", certificationLevel: "verified", authType: "oauth2",
    isInstalled: false, isFeatured: true, actionCount: 5, triggerCount: 3,
    installCount: 13100, rating: 4.7,
    permissions: ["products:write", "orders:write", "customers:write", "inventory:write"],
    capabilities: { actions: true, pollingTriggers: false, webhookTriggers: true, oauth2: true, apiKey: true, batching: true, pagination: true, fileUpload: true },
    authConfig: { authorizationUrl: "https://{shop}.myshopify.com/admin/oauth/authorize", tokenUrl: "https://{shop}.myshopify.com/admin/oauth/access_token", scopes: ["read_orders", "write_orders", "read_products", "write_products"] },
    rateLimit: { requestsPerMinute: 40, burst: 10 },
    healthStatus: { oauthFailureRate: 0.001, apiErrorRate: 0.002, avgLatencyMs: 195, availability: 99.96 },
    actions: [
      { actionId: "create_product", name: "Create Product", description: "Create a new product listing in your Shopify store",
        inputSchema: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, price: { type: "number" }, sku: { type: "string" }, inventory: { type: "number" } }, required: ["title", "price"] },
        outputSchema: { type: "object", properties: { productId: { type: "string" }, handle: { type: "string" } } } },
      { actionId: "create_order", name: "Create Order", description: "Create a draft order in Shopify",
        inputSchema: { type: "object", properties: { customerId: { type: "string" }, lineItems: { type: "array" }, note: { type: "string" } }, required: ["lineItems"] },
        outputSchema: { type: "object", properties: { orderId: { type: "string" }, orderNumber: { type: "number" } } } },
      { actionId: "fulfill_order", name: "Fulfill Order", description: "Mark an order as fulfilled and provide tracking",
        inputSchema: { type: "object", properties: { orderId: { type: "string" }, trackingNumber: { type: "string" }, carrier: { type: "string" }, notifyCustomer: { type: "boolean", default: true } }, required: ["orderId"] },
        outputSchema: { type: "object", properties: { fulfillmentId: { type: "string" }, status: { type: "string" } } } },
      { actionId: "add_customer", name: "Add Customer", description: "Create or update a customer record",
        inputSchema: { type: "object", properties: { email: { type: "string" }, firstName: { type: "string" }, lastName: { type: "string" }, phone: { type: "string" }, tags: { type: "string" } }, required: ["email"] },
        outputSchema: { type: "object", properties: { customerId: { type: "string" }, email: { type: "string" } } } },
      { actionId: "update_inventory", name: "Update Inventory", description: "Set inventory levels for a product variant",
        inputSchema: { type: "object", properties: { inventoryItemId: { type: "string" }, locationId: { type: "string" }, quantity: { type: "number" } }, required: ["inventoryItemId", "locationId", "quantity"] },
        outputSchema: { type: "object", properties: { inventoryItemId: { type: "string" }, available: { type: "number" } } } },
    ],
    triggers: [
      { triggerId: "order_created", triggerType: "webhook", name: "Order Created", description: "Fires when a new order is placed in your store", config: { topic: "orders/create" } },
      { triggerId: "payment_received", triggerType: "webhook", name: "Payment Received", description: "Fires when payment is captured for an order", config: { topic: "orders/paid" } },
      { triggerId: "fulfillment_updated", triggerType: "webhook", name: "Fulfillment Updated", description: "Fires when a fulfillment status changes", config: { topic: "fulfillments/update" } },
    ],
  },
];

// ─── Seeding ──────────────────────────────────────────────────────────────────

let seeded = false;

async function seedConnectors() {
  if (seeded) return;
  seeded = true;

  const existingActions = await db.select({ id: connectorActionsTable.id }).from(connectorActionsTable).limit(1);
  if (existingActions.length > 0) return;

  await db.delete(connectorsTable);

  for (const seed of CONNECTOR_SEEDS) {
    const { actions, triggers, ...connectorData } = seed;
    const [inserted] = await db
      .insert(connectorsTable)
      .values({ ...connectorData, sdkVersion: connectorData.sdkVersion ?? "1.0" })
      .returning();

    if (actions.length > 0) {
      await db.insert(connectorActionsTable).values(
        actions.map((a) => ({ ...a, connectorId: inserted.id }))
      );
    }
    if (triggers.length > 0) {
      await db.insert(connectorTriggersTable).values(
        triggers.map((t) => ({ ...t, connectorId: inserted.id }))
      );
    }

    // Seed some mock execution history
    const mockStatuses: ("success" | "failed" | "timeout")[] = ["success", "success", "success", "success", "failed"];
    const execRows = Array.from({ length: 5 }, (_, i) => ({
      connectorId: inserted.id,
      connectorVersion: seed.version,
      executionId: `exec_${inserted.id}_${i}`,
      actionId: actions[i % actions.length]?.actionId ?? null,
      tenantId: "default",
      status: mockStatuses[i],
      durationMs: 50 + Math.floor(Math.random() * 400),
      createdAt: new Date(Date.now() - i * 3600000),
    }));
    await db.insert(connectorExecutionsTable).values(execRows);
  }
}

// ─── Serializer ───────────────────────────────────────────────────────────────

function serializeConnector(c: typeof connectorsTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    displayName: c.displayName ?? null,
    version: c.version,
    sdkVersion: c.sdkVersion,
    category: c.category,
    description: c.description,
    icon: c.icon,
    color: c.color ?? null,
    isInstalled: c.isInstalled,
    isFeatured: c.isFeatured,
    actionCount: c.actionCount,
    triggerCount: c.triggerCount,
    installCount: c.installCount,
    rating: c.rating ?? null,
    author: c.author ?? null,
    authType: c.authType,
    authConfig: c.authConfig ?? {},
    certificationLevel: c.certificationLevel,
    permissions: (c.permissions as string[]) ?? [],
    capabilities: (c.capabilities as Record<string, boolean>) ?? {},
    rateLimit: (c.rateLimit as Record<string, number>) ?? {},
    healthStatus: (c.healthStatus as Record<string, unknown>) ?? {},
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get("/connectors/categories", async (_req, res): Promise<void> => {
  await seedConnectors();
  const rows = await db.select({ category: connectorsTable.category }).from(connectorsTable);
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.category] = (counts[row.category] ?? 0) + 1;
  }
  res.json(Object.entries(counts).map(([name, count]) => ({ name, count })));
});

router.get("/connectors", async (req, res): Promise<void> => {
  await seedConnectors();
  const params = ListConnectorsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.category) conditions.push(eq(connectorsTable.category, params.data.category));
  if (params.data.search) conditions.push(like(connectorsTable.name, `%${params.data.search}%`));
  if (params.data.installed !== undefined) conditions.push(eq(connectorsTable.isInstalled, params.data.installed));

  const q = req.query as Record<string, string>;
  if (q.certificationLevel) conditions.push(eq(connectorsTable.certificationLevel, q.certificationLevel));
  if (q.authType) conditions.push(eq(connectorsTable.authType, q.authType));

  const connectors = await db
    .select()
    .from(connectorsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(connectorsTable.isFeatured, connectorsTable.name);

  res.json(connectors.map(serializeConnector));
});

router.get("/connectors/executions", async (req, res): Promise<void> => {
  const connectorId = req.query.connectorId ? Number(req.query.connectorId) : undefined;
  const status = req.query.status as string | undefined;
  const limit = Math.min(Number(req.query.limit ?? 50), 200);

  const conditions = [];
  if (connectorId) conditions.push(eq(connectorExecutionsTable.connectorId, connectorId));
  if (status) conditions.push(eq(connectorExecutionsTable.status, status));

  const executions = await db
    .select()
    .from(connectorExecutionsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(connectorExecutionsTable.createdAt))
    .limit(limit);

  res.json(executions.map((e) => ({
    id: e.id,
    connectorId: e.connectorId,
    connectorVersion: e.connectorVersion,
    executionId: e.executionId,
    actionId: e.actionId ?? null,
    triggerId: e.triggerId ?? null,
    tenantId: e.tenantId,
    status: e.status,
    durationMs: e.durationMs ?? null,
    errorMessage: e.errorMessage ?? null,
    createdAt: e.createdAt.toISOString(),
  })));
});

router.get("/connectors/:id/actions", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const actions = await db
    .select()
    .from(connectorActionsTable)
    .where(eq(connectorActionsTable.connectorId, id));

  res.json(actions.map((a) => ({
    id: a.id,
    connectorId: a.connectorId,
    actionId: a.actionId,
    name: a.name,
    description: a.description,
    inputSchema: a.inputSchema ?? {},
    outputSchema: a.outputSchema ?? {},
  })));
});

router.get("/connectors/:id/triggers", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const triggers = await db
    .select()
    .from(connectorTriggersTable)
    .where(eq(connectorTriggersTable.connectorId, id));

  res.json(triggers.map((t) => ({
    id: t.id,
    connectorId: t.connectorId,
    triggerId: t.triggerId,
    triggerType: t.triggerType,
    name: t.name,
    description: t.description,
    config: t.config ?? {},
    pollingInterval: t.pollingInterval ?? null,
  })));
});

router.get("/connectors/:id", async (req, res): Promise<void> => {
  const params = GetConnectorParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [connector] = await db
    .select()
    .from(connectorsTable)
    .where(eq(connectorsTable.id, params.data.id));

  if (!connector) { res.status(404).json({ error: "Connector not found" }); return; }
  res.json(serializeConnector(connector));
});

router.post("/connectors/:id/install", async (req, res): Promise<void> => {
  const params = InstallConnectorParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [connector] = await db
    .update(connectorsTable)
    .set({ isInstalled: true, installCount: sql`${connectorsTable.installCount} + 1` })
    .where(eq(connectorsTable.id, params.data.id))
    .returning();

  if (!connector) { res.status(404).json({ error: "Connector not found" }); return; }
  res.json(serializeConnector(connector));
});

router.post("/connectors/:id/uninstall", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [connector] = await db
    .update(connectorsTable)
    .set({ isInstalled: false })
    .where(eq(connectorsTable.id, id))
    .returning();

  if (!connector) { res.status(404).json({ error: "Connector not found" }); return; }
  res.json(serializeConnector(connector));
});

export default router;

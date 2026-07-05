export interface ConnectorSeedAction {
  actionId: string;
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface ConnectorSeedTrigger {
  triggerId: string;
  triggerType: string;
  name: string;
  description: string;
  config?: Record<string, unknown>;
  pollingInterval?: number;
}

export interface ConnectorSeed {
  name: string;
  displayName: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  author: string;
  authType: string;
  authConfig: Record<string, unknown>;
  certificationLevel: string;
  isFeatured: boolean;
  capabilities: {
    actions: boolean;
    pollingTriggers: boolean;
    webhookTriggers: boolean;
    oauth2: boolean;
    apiKey: boolean;
    batching: boolean;
    pagination: boolean;
    fileUpload: boolean;
  };
  actions: ConnectorSeedAction[];
  triggers: ConnectorSeedTrigger[];
}

export const PHASE2_CONNECTORS: ConnectorSeed[] = [
  {
    name: "slack",
    displayName: "Slack",
    category: "communication",
    description:
      "Send messages, manage channels, and react to events in Slack workspaces.",
    icon: "slack",
    color: "#4A154B",
    author: "LongoX",
    authType: "oauth2",
    authConfig: {
      authorizationUrl: "https://slack.com/oauth/v2/authorize",
      tokenUrl: "https://slack.com/api/oauth.v2.access",
      scopes: ["channels:read", "channels:write", "chat:write", "users:read"],
    },
    certificationLevel: "official",
    isFeatured: true,
    capabilities: {
      actions: true,
      pollingTriggers: false,
      webhookTriggers: true,
      oauth2: true,
      apiKey: true,
      batching: false,
      pagination: false,
      fileUpload: false,
    },
    actions: [
      {
        actionId: "sendMessage",
        name: "Send Message",
        description: "Post a message to a Slack channel",
      },
      {
        actionId: "createChannel",
        name: "Create Channel",
        description: "Create a new Slack channel",
      },
      {
        actionId: "inviteUser",
        name: "Invite User",
        description: "Invite a user to a channel",
      },
    ],
    triggers: [
      {
        triggerId: "newMessage",
        triggerType: "webhook",
        name: "New Message",
        description: "Trigger when a new message is posted",
      },
      {
        triggerId: "mention",
        triggerType: "webhook",
        name: "Mention",
        description: "Trigger when the bot is mentioned",
      },
    ],
  },
  {
    name: "hubspot",
    displayName: "HubSpot",
    category: "crm",
    description: "Manage contacts, companies, and deals in HubSpot CRM.",
    icon: "hubspot",
    color: "#FF7A59",
    author: "LongoX",
    authType: "oauth2",
    authConfig: {
      authorizationUrl: "https://app.hubspot.com/oauth/authorize",
      tokenUrl: "https://api.hubapi.com/oauth/v1/token",
      scopes: ["crm.objects.contacts.read", "crm.objects.contacts.write"],
    },
    certificationLevel: "official",
    isFeatured: true,
    capabilities: {
      actions: true,
      pollingTriggers: false,
      webhookTriggers: true,
      oauth2: true,
      apiKey: false,
      batching: false,
      pagination: true,
      fileUpload: false,
    },
    actions: [
      {
        actionId: "createContact",
        name: "Create Contact",
        description: "Create a new contact in HubSpot",
      },
      {
        actionId: "createCompany",
        name: "Create Company",
        description: "Create a new company in HubSpot",
      },
      {
        actionId: "createDeal",
        name: "Create Deal",
        description: "Create a new deal in HubSpot",
      },
    ],
    triggers: [
      {
        triggerId: "contactUpdated",
        triggerType: "webhook",
        name: "Contact Updated",
        description: "Trigger when a contact is created or updated",
      },
      {
        triggerId: "dealUpdated",
        triggerType: "webhook",
        name: "Deal Updated",
        description: "Trigger when a deal is created or updated",
      },
    ],
  },
  {
    name: "salesforce",
    displayName: "Salesforce",
    category: "crm",
    description: "Sync leads, opportunities, and accounts with Salesforce.",
    icon: "salesforce",
    color: "#00A1E0",
    author: "LongoX",
    authType: "oauth2",
    authConfig: {
      authorizationUrl:
        "https://login.salesforce.com/services/oauth2/authorize",
      tokenUrl: "https://login.salesforce.com/services/oauth2/token",
      scopes: ["api", "refresh_token"],
    },
    certificationLevel: "official",
    isFeatured: true,
    capabilities: {
      actions: true,
      pollingTriggers: true,
      webhookTriggers: true,
      oauth2: true,
      apiKey: false,
      batching: true,
      pagination: true,
      fileUpload: false,
    },
    actions: [
      {
        actionId: "createLead",
        name: "Create Lead",
        description: "Create a new lead in Salesforce",
      },
      {
        actionId: "createOpportunity",
        name: "Create Opportunity",
        description: "Create a new opportunity",
      },
      {
        actionId: "queryRecords",
        name: "Query Records",
        description: "Execute a SOQL query",
      },
    ],
    triggers: [
      {
        triggerId: "leadCreated",
        triggerType: "webhook",
        name: "Lead Created",
        description: "Trigger when a new lead is created",
      },
      {
        triggerId: "opportunityUpdated",
        triggerType: "polling",
        name: "Opportunity Updated",
        description: "Poll for opportunity changes",
        pollingInterval: 300,
      },
    ],
  },
  {
    name: "stripe",
    displayName: "Stripe",
    category: "payments",
    description:
      "Process payments, manage customers, and handle subscriptions via Stripe.",
    icon: "stripe",
    color: "#635BFF",
    author: "LongoX",
    authType: "apikey",
    authConfig: { keyHeader: "Authorization", keyPrefix: "Bearer" },
    certificationLevel: "official",
    isFeatured: true,
    capabilities: {
      actions: true,
      pollingTriggers: false,
      webhookTriggers: true,
      oauth2: false,
      apiKey: true,
      batching: false,
      pagination: true,
      fileUpload: false,
    },
    actions: [
      {
        actionId: "createCustomer",
        name: "Create Customer",
        description: "Create a new Stripe customer",
      },
      {
        actionId: "createInvoice",
        name: "Create Invoice",
        description: "Create a new invoice",
      },
      {
        actionId: "createPaymentIntent",
        name: "Create Payment Intent",
        description: "Create a payment intent",
      },
      {
        actionId: "createProduct",
        name: "Create Product",
        description: "Create a new product",
      },
    ],
    triggers: [
      {
        triggerId: "paymentSucceeded",
        triggerType: "webhook",
        name: "Payment Succeeded",
        description: "Trigger when a payment succeeds",
      },
      {
        triggerId: "invoicePaid",
        triggerType: "webhook",
        name: "Invoice Paid",
        description: "Trigger when an invoice is paid",
      },
      {
        triggerId: "customerCreated",
        triggerType: "webhook",
        name: "Customer Created",
        description: "Trigger when a customer is created",
      },
    ],
  },
  {
    name: "mongodb",
    displayName: "MongoDB",
    category: "database",
    description: "Query and manipulate documents in MongoDB collections.",
    icon: "mongodb",
    color: "#47A248",
    author: "LongoX",
    authType: "apikey",
    authConfig: {},
    certificationLevel: "verified",
    isFeatured: false,
    capabilities: {
      actions: true,
      pollingTriggers: true,
      webhookTriggers: false,
      oauth2: false,
      apiKey: true,
      batching: true,
      pagination: true,
      fileUpload: false,
    },
    actions: [
      {
        actionId: "findDocuments",
        name: "Find Documents",
        description: "Query documents from a collection",
      },
      {
        actionId: "insertDocument",
        name: "Insert Document",
        description: "Insert a document into a collection",
      },
      {
        actionId: "updateDocument",
        name: "Update Document",
        description: "Update documents in a collection",
      },
    ],
    triggers: [
      {
        triggerId: "documentInserted",
        triggerType: "polling",
        name: "Document Inserted",
        description: "Poll for new documents",
        pollingInterval: 60,
      },
    ],
  },
  {
    name: "postgres",
    displayName: "PostgreSQL",
    category: "database",
    description: "Execute SQL queries and manage PostgreSQL databases.",
    icon: "postgres",
    color: "#336791",
    author: "LongoX",
    authType: "basic",
    authConfig: {},
    certificationLevel: "official",
    isFeatured: true,
    capabilities: {
      actions: true,
      pollingTriggers: true,
      webhookTriggers: false,
      oauth2: false,
      apiKey: false,
      batching: false,
      pagination: true,
      fileUpload: false,
    },
    actions: [
      {
        actionId: "executeQuery",
        name: "Execute Query",
        description: "Execute a SQL query on PostgreSQL",
      },
      {
        actionId: "listTables",
        name: "List Tables",
        description: "List all tables in the database",
      },
      {
        actionId: "getTableSchema",
        name: "Get Table Schema",
        description: "Get the schema of a table",
      },
    ],
    triggers: [
      {
        triggerId: "rowInserted",
        triggerType: "polling",
        name: "Row Inserted",
        description: "Poll for new rows",
        pollingInterval: 30,
      },
      {
        triggerId: "rowUpdated",
        triggerType: "polling",
        name: "Row Updated",
        description: "Poll for updated rows",
        pollingInterval: 30,
      },
    ],
  },
  {
    name: "mysql",
    displayName: "MySQL",
    category: "database",
    description: "Execute SQL queries and manage MySQL databases.",
    icon: "mysql",
    color: "#4479A1",
    author: "LongoX",
    authType: "basic",
    authConfig: {},
    certificationLevel: "verified",
    isFeatured: false,
    capabilities: {
      actions: true,
      pollingTriggers: true,
      webhookTriggers: false,
      oauth2: false,
      apiKey: false,
      batching: false,
      pagination: true,
      fileUpload: false,
    },
    actions: [
      {
        actionId: "executeQuery",
        name: "Execute Query",
        description: "Execute a SQL query on MySQL",
      },
      {
        actionId: "listTables",
        name: "List Tables",
        description: "List all tables in the database",
      },
    ],
    triggers: [
      {
        triggerId: "rowInserted",
        triggerType: "polling",
        name: "Row Inserted",
        description: "Poll for new rows",
        pollingInterval: 30,
      },
    ],
  },
  {
    name: "google-sheets",
    displayName: "Google Sheets",
    category: "data",
    description: "Read, write, and sync data with Google Sheets spreadsheets.",
    icon: "google-sheets",
    color: "#34A853",
    author: "LongoX",
    authType: "oauth2",
    authConfig: {
      authorizationUrl: "https://accounts.google.com/o/oauth2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    },
    certificationLevel: "official",
    isFeatured: true,
    capabilities: {
      actions: true,
      pollingTriggers: true,
      webhookTriggers: false,
      oauth2: true,
      apiKey: false,
      batching: true,
      pagination: true,
      fileUpload: false,
    },
    actions: [
      {
        actionId: "readRange",
        name: "Read Range",
        description: "Read values from a spreadsheet range",
      },
      {
        actionId: "writeRange",
        name: "Write Range",
        description: "Write values to a spreadsheet range",
      },
      {
        actionId: "appendRow",
        name: "Append Row",
        description: "Append a row to a spreadsheet",
      },
    ],
    triggers: [
      {
        triggerId: "rowAdded",
        triggerType: "polling",
        name: "Row Added",
        description: "Poll for new rows in a sheet",
        pollingInterval: 60,
      },
    ],
  },
  {
    name: "notion",
    displayName: "Notion",
    category: "data",
    description:
      "Create pages, update databases, and sync content with Notion.",
    icon: "notion",
    color: "#000000",
    author: "LongoX",
    authType: "oauth2",
    authConfig: {
      authorizationUrl: "https://api.notion.com/v1/oauth/authorize",
      tokenUrl: "https://api.notion.com/v1/oauth/token",
      scopes: [],
    },
    certificationLevel: "official",
    isFeatured: true,
    capabilities: {
      actions: true,
      pollingTriggers: true,
      webhookTriggers: false,
      oauth2: true,
      apiKey: true,
      batching: false,
      pagination: true,
      fileUpload: false,
    },
    actions: [
      {
        actionId: "createPage",
        name: "Create Page",
        description: "Create a new Notion page",
      },
      {
        actionId: "updatePage",
        name: "Update Page",
        description: "Update an existing Notion page",
      },
      {
        actionId: "queryDatabase",
        name: "Query Database",
        description: "Query a Notion database",
      },
    ],
    triggers: [
      {
        triggerId: "pageUpdated",
        triggerType: "polling",
        name: "Page Updated",
        description: "Poll for page updates",
        pollingInterval: 120,
      },
    ],
  },
];

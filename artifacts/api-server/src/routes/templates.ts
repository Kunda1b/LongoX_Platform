import { Router, type IRouter } from "express";
import { eq, like, and, sql } from "drizzle-orm";
import { db, templatesTable, workflowsTable } from "@workspace/db";
import { ListTemplatesQueryParams, GetTemplateParams } from "@workspace/api-zod";
import { z } from "zod";

const router: IRouter = Router();

// ─── Built-in template seed data ─────────────────────────────────────────────

const BUILTIN_TEMPLATES = [
  {
    name: "Lead Nurture Sequence",
    description: "Automatically follow up with new leads via email and Slack when a form is submitted. Scores and routes based on company size.",
    category: "Sales",
    triggerType: "form",
    complexity: "intermediate" as const,
    tags: ["crm", "email", "leads"],
    nodes: [
      { id: "t1", name: "Form Submission", type: "trigger", nodeTypeId: "trigger.form", position: { x: 60, y: 100 }, config: {} },
      { id: "t2", name: "Classify Lead", type: "ai", nodeTypeId: "ai.classify", position: { x: 340, y: 100 }, config: { categories: "Enterprise,SMB,Startup" } },
      { id: "t3", name: "Route by Tier", type: "logic", nodeTypeId: "logic.router", position: { x: 620, y: 100 }, config: { routes: "3" } },
      { id: "t4", name: "Create CRM Record", type: "action", nodeTypeId: "action.create_record", position: { x: 900, y: 60 }, config: { object_type: "Lead" } },
      { id: "t5", name: "Send Welcome Email", type: "action", nodeTypeId: "action.send_email", position: { x: 900, y: 180 }, config: { subject: "Welcome!" } },
    ],
    uses: 4821,
  },
  {
    name: "Weekly Report Emailer",
    description: "Every Monday morning, query your database for last week's stats, generate a summary with AI, and email a beautiful report to your team.",
    category: "Reporting",
    triggerType: "schedule",
    complexity: "beginner" as const,
    tags: ["reporting", "email", "schedule"],
    nodes: [
      { id: "r1", name: "Weekly Schedule", type: "trigger", nodeTypeId: "trigger.schedule", position: { x: 60, y: 100 }, config: { interval: "weekly" } },
      { id: "r2", name: "Fetch Stats", type: "action", nodeTypeId: "action.db_query", position: { x: 340, y: 100 }, config: { operation: "select" } },
      { id: "r3", name: "AI Summary", type: "ai", nodeTypeId: "ai.summarize", position: { x: 620, y: 100 }, config: { format: "bullets" } },
      { id: "r4", name: "Email Report", type: "action", nodeTypeId: "action.send_email", position: { x: 900, y: 100 }, config: { subject: "Weekly Report" } },
    ],
    uses: 8934,
  },
  {
    name: "Support Ticket Router",
    description: "Classify incoming support emails by topic and urgency, create tickets in your helpdesk, and notify the right Slack channel instantly.",
    category: "Support",
    triggerType: "email",
    complexity: "intermediate" as const,
    tags: ["support", "email", "slack", "ai"],
    nodes: [
      { id: "s1", name: "Email Arrives", type: "trigger", nodeTypeId: "trigger.email", position: { x: 60, y: 100 }, config: {} },
      { id: "s2", name: "Classify Topic", type: "ai", nodeTypeId: "ai.classify", position: { x: 340, y: 100 }, config: { categories: "Billing,Technical,Sales" } },
      { id: "s3", name: "Check Urgency", type: "logic", nodeTypeId: "logic.if", position: { x: 620, y: 100 }, config: { operator: "contains" } },
      { id: "s4", name: "Create Ticket", type: "action", nodeTypeId: "action.create_record", position: { x: 900, y: 60 }, config: { object_type: "Ticket" } },
      { id: "s5", name: "Notify Slack", type: "action", nodeTypeId: "action.slack", position: { x: 900, y: 180 }, config: { channel: "#support" } },
    ],
    uses: 6142,
  },
  {
    name: "Data Pipeline & Transform",
    description: "Pull records from an API, filter and reshape the data with a JS transform, then write each row to a spreadsheet and log to the database.",
    category: "Data",
    triggerType: "schedule",
    complexity: "advanced" as const,
    tags: ["etl", "data", "spreadsheet"],
    nodes: [
      { id: "d1", name: "Daily Trigger", type: "trigger", nodeTypeId: "trigger.schedule", position: { x: 60, y: 100 }, config: { interval: "daily" } },
      { id: "d2", name: "Fetch Records", type: "action", nodeTypeId: "action.http", position: { x: 340, y: 100 }, config: { method: "GET" } },
      { id: "d3", name: "Filter Active", type: "logic", nodeTypeId: "logic.filter", position: { x: 620, y: 100 }, config: {} },
      { id: "d4", name: "Loop Items", type: "logic", nodeTypeId: "logic.loop", position: { x: 900, y: 100 }, config: {} },
      { id: "d5", name: "Transform Row", type: "data", nodeTypeId: "data.transform", position: { x: 1180, y: 60 }, config: {} },
      { id: "d6", name: "Write to Sheet", type: "action", nodeTypeId: "action.spreadsheet", position: { x: 1180, y: 180 }, config: { operation: "append" } },
    ],
    uses: 3298,
  },
  {
    name: "New User Onboarding",
    description: "Kick off a welcome sequence when a new user signs up: send a welcome email, create a CRM contact, post to Slack, and schedule a follow-up.",
    category: "Operations",
    triggerType: "webhook",
    complexity: "beginner" as const,
    tags: ["onboarding", "email", "crm"],
    nodes: [
      { id: "o1", name: "Signup Webhook", type: "trigger", nodeTypeId: "trigger.webhook", position: { x: 60, y: 100 }, config: { method: "POST" } },
      { id: "o2", name: "Create Contact", type: "action", nodeTypeId: "action.create_record", position: { x: 340, y: 100 }, config: { object_type: "Contact" } },
      { id: "o3", name: "Send Welcome", type: "action", nodeTypeId: "action.send_email", position: { x: 620, y: 60 }, config: { subject: "Welcome aboard!" } },
      { id: "o4", name: "Notify #signups", type: "action", nodeTypeId: "action.slack", position: { x: 620, y: 180 }, config: { channel: "#signups" } },
      { id: "o5", name: "Schedule Follow-up", type: "logic", nodeTypeId: "logic.delay", position: { x: 900, y: 100 }, config: { duration: "3", unit: "days" } },
    ],
    uses: 11503,
  },
  {
    name: "Competitive Intel Scraper",
    description: "Scrape competitor pricing pages daily using AI, extract structured data, and push the results to a spreadsheet for tracking.",
    category: "Research",
    triggerType: "schedule",
    complexity: "advanced" as const,
    tags: ["scraping", "ai", "research"],
    nodes: [
      { id: "c1", name: "Daily Schedule", type: "trigger", nodeTypeId: "trigger.schedule", position: { x: 60, y: 100 }, config: { interval: "daily" } },
      { id: "c2", name: "Scrape Page", type: "ai", nodeTypeId: "ai.scraper", position: { x: 340, y: 100 }, config: {} },
      { id: "c3", name: "Extract Prices", type: "ai", nodeTypeId: "ai.extract", position: { x: 620, y: 100 }, config: {} },
      { id: "c4", name: "Append to Sheet", type: "action", nodeTypeId: "action.spreadsheet", position: { x: 900, y: 100 }, config: { operation: "append" } },
    ],
    uses: 1887,
  },
  {
    name: "API Error Monitor",
    description: "Hit a health-check endpoint every 5 minutes. If it returns non-200, send a PagerDuty-style Slack alert and log the incident to a database.",
    category: "Developer",
    triggerType: "schedule",
    complexity: "beginner" as const,
    tags: ["monitoring", "alerts", "api"],
    nodes: [
      { id: "m1", name: "5-Min Schedule", type: "trigger", nodeTypeId: "trigger.schedule", position: { x: 60, y: 100 }, config: { interval: "5m" } },
      { id: "m2", name: "Health Check", type: "action", nodeTypeId: "action.http", position: { x: 340, y: 100 }, config: { method: "GET" } },
      { id: "m3", name: "Check Status", type: "logic", nodeTypeId: "logic.if", position: { x: 620, y: 100 }, config: { operator: "neq", value: "200" } },
      { id: "m4", name: "Alert #ops", type: "action", nodeTypeId: "action.slack", position: { x: 900, y: 60 }, config: { channel: "#ops-alerts" } },
      { id: "m5", name: "Log Incident", type: "action", nodeTypeId: "action.db_query", position: { x: 900, y: 180 }, config: { operation: "insert" } },
    ],
    uses: 5614,
  },
  {
    name: "Invoice PDF Extractor",
    description: "Process invoice attachments from email, extract key fields (vendor, amount, date) with AI, and push to your accounting spreadsheet.",
    category: "Operations",
    triggerType: "email",
    complexity: "intermediate" as const,
    tags: ["finance", "ai", "documents"],
    nodes: [
      { id: "i1", name: "Invoice Email", type: "trigger", nodeTypeId: "trigger.email", position: { x: 60, y: 100 }, config: { subject_filter: "invoice" } },
      { id: "i2", name: "Parse PDF", type: "data", nodeTypeId: "data.parse_doc", position: { x: 340, y: 100 }, config: { output: "text" } },
      { id: "i3", name: "Extract Fields", type: "ai", nodeTypeId: "ai.extract", position: { x: 620, y: 100 }, config: {} },
      { id: "i4", name: "Write to Sheet", type: "action", nodeTypeId: "action.spreadsheet", position: { x: 900, y: 100 }, config: { operation: "append" } },
    ],
    uses: 2943,
  },
];

async function ensureBuiltinTemplates() {
  const existing = await db.select({ id: templatesTable.id }).from(templatesTable)
    .where(eq(templatesTable.isCustom, false));
  if (existing.length > 0) return;
  await db.insert(templatesTable).values(
    BUILTIN_TEMPLATES.map((t) => ({
      name: t.name,
      description: t.description,
      category: t.category,
      triggerType: t.triggerType,
      complexity: t.complexity,
      tags: t.tags,
      nodes: t.nodes,
      uses: t.uses,
      nodeCount: t.nodes.length,
      isCustom: false,
    }))
  );
}

ensureBuiltinTemplates().catch(console.error);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function serializeTemplate(t: typeof templatesTable.$inferSelect) {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    triggerType: t.triggerType,
    nodeCount: t.nodeCount,
    uses: t.uses,
    complexity: t.complexity,
    tags: t.tags,
    nodes: Array.isArray(t.nodes) ? t.nodes : [],
    isCustom: t.isCustom,
    createdAt: t.createdAt.toISOString(),
  };
}

const CreateTemplateBody = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  category: z.string().min(1),
  triggerType: z.string().min(1),
  complexity: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  tags: z.array(z.string()).default([]),
  nodes: z.array(z.any()).default([]),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get("/templates", async (req, res): Promise<void> => {
  const params = ListTemplatesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.category) conditions.push(eq(templatesTable.category, params.data.category));
  if (params.data.search) conditions.push(like(templatesTable.name, `%${params.data.search}%`));

  const templates = await db
    .select()
    .from(templatesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(templatesTable.uses);

  res.json(templates.map(serializeTemplate));
});

router.post("/templates", async (req, res): Promise<void> => {
  const parsed = CreateTemplateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { nodes, ...rest } = parsed.data;
  const [template] = await db
    .insert(templatesTable)
    .values({ ...rest, nodes, nodeCount: nodes.length, isCustom: true })
    .returning();

  res.status(201).json(serializeTemplate(template));
});

router.get("/templates/:id", async (req, res): Promise<void> => {
  const params = GetTemplateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [template] = await db.select().from(templatesTable)
    .where(eq(templatesTable.id, params.data.id));

  if (!template) { res.status(404).json({ error: "Template not found" }); return; }
  res.json(serializeTemplate(template));
});

router.delete("/templates/:id", async (req, res): Promise<void> => {
  const params = GetTemplateParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [template] = await db.select().from(templatesTable)
    .where(eq(templatesTable.id, params.data.id));

  if (!template) { res.status(404).json({ error: "Template not found" }); return; }
  if (!template.isCustom) { res.status(403).json({ error: "Built-in templates cannot be deleted" }); return; }

  await db.delete(templatesTable).where(eq(templatesTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/templates/:id/use", async (req, res): Promise<void> => {
  const params = GetTemplateParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [template] = await db.select().from(templatesTable)
    .where(eq(templatesTable.id, params.data.id));

  if (!template) { res.status(404).json({ error: "Template not found" }); return; }

  await db.update(templatesTable)
    .set({ uses: sql`${templatesTable.uses} + 1` })
    .where(eq(templatesTable.id, template.id));

  const nodes = Array.isArray(template.nodes) ? template.nodes : [];

  const [workflow] = await db
    .insert(workflowsTable)
    .values({
      name: `${template.name} (from template)`,
      description: template.description,
      status: "draft",
      triggerType: template.triggerType,
      nodeCount: template.nodeCount,
      executionCount: 0,
      nodes,
    })
    .returning();

  res.status(201).json({
    ...workflow,
    description: workflow.description ?? null,
    lastRunAt: workflow.lastRunAt ? workflow.lastRunAt.toISOString() : null,
    lastRunStatus: workflow.lastRunStatus ?? null,
    nodes: workflow.nodes ?? null,
    createdAt: workflow.createdAt.toISOString(),
    updatedAt: workflow.updatedAt.toISOString(),
  });
});

export default router;

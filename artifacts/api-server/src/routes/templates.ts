import { Router, type IRouter } from "express";
import { eq, like, and, sql, desc } from "drizzle-orm";
import {
  db,
  templatesTable,
  workflowsTable,
  templateVersionsTable,
} from "@longox/db";
import { ListTemplatesQueryParams, GetTemplateParams } from "@longox/api-zod";
import { z } from "zod";

const router: IRouter = Router();

// ─── Built-in template seed data ─────────────────────────────────────────────

type TemplateType =
  | "workflow"
  | "dashboard"
  | "industry_bundle"
  | "developer"
  | "ai_powered";

interface BuiltinTemplate {
  name: string;
  description: string;
  category: string;
  triggerType: string;
  complexity: "beginner" | "intermediate" | "advanced";
  tags: string[];
  uses: number;
  templateType: TemplateType;
  metadata: Record<string, unknown>;
  nodes: {
    id: string;
    name: string;
    type: string;
    nodeTypeId: string;
    position: { x: number; y: number };
    config: Record<string, unknown>;
  }[];
}

const BUILTIN_TEMPLATES: BuiltinTemplate[] = [
  // ─── WORKFLOW TEMPLATES ─────────────────────────────────────────────────────

  // Legacy / General
  {
    name: "Lead Nurture Sequence",
    description:
      "Automatically follow up with new leads via email and Slack when a form is submitted. Scores and routes based on company size.",
    category: "Sales",
    triggerType: "form",
    complexity: "intermediate",
    tags: ["crm", "email", "leads"],
    uses: 4821,
    templateType: "workflow",
    metadata: {},
    nodes: [
      {
        id: "t1",
        name: "Form Submission",
        type: "trigger",
        nodeTypeId: "trigger.form",
        position: { x: 60, y: 100 },
        config: {},
      },
      {
        id: "t2",
        name: "Classify Lead",
        type: "ai",
        nodeTypeId: "ai.classify",
        position: { x: 340, y: 100 },
        config: { categories: "Enterprise,SMB,Startup" },
      },
      {
        id: "t3",
        name: "Route by Tier",
        type: "logic",
        nodeTypeId: "logic.router",
        position: { x: 620, y: 100 },
        config: { routes: "3" },
      },
      {
        id: "t4",
        name: "Create CRM Record",
        type: "action",
        nodeTypeId: "action.create_record",
        position: { x: 900, y: 60 },
        config: { object_type: "Lead" },
      },
      {
        id: "t5",
        name: "Send Welcome Email",
        type: "action",
        nodeTypeId: "action.send_email",
        position: { x: 900, y: 180 },
        config: { subject: "Welcome!" },
      },
    ],
  },
  {
    name: "Weekly Report Emailer",
    description:
      "Every Monday morning, query your database for last week's stats, generate a summary with AI, and email a beautiful report to your team.",
    category: "Reporting",
    triggerType: "schedule",
    complexity: "beginner",
    tags: ["reporting", "email", "schedule"],
    uses: 8934,
    templateType: "workflow",
    metadata: {},
    nodes: [
      {
        id: "r1",
        name: "Weekly Schedule",
        type: "trigger",
        nodeTypeId: "trigger.schedule",
        position: { x: 60, y: 100 },
        config: { interval: "weekly" },
      },
      {
        id: "r2",
        name: "Fetch Stats",
        type: "action",
        nodeTypeId: "action.db_query",
        position: { x: 340, y: 100 },
        config: { operation: "select" },
      },
      {
        id: "r3",
        name: "AI Summary",
        type: "ai",
        nodeTypeId: "ai.summarize",
        position: { x: 620, y: 100 },
        config: { format: "bullets" },
      },
      {
        id: "r4",
        name: "Email Report",
        type: "action",
        nodeTypeId: "action.send_email",
        position: { x: 900, y: 100 },
        config: { subject: "Weekly Report" },
      },
    ],
  },
  {
    name: "Support Ticket Router",
    description:
      "Classify incoming support emails by topic and urgency, create tickets in your helpdesk, and notify the right Slack channel instantly.",
    category: "Support",
    triggerType: "email",
    complexity: "intermediate",
    tags: ["support", "email", "slack", "ai"],
    uses: 6142,
    templateType: "workflow",
    metadata: {},
    nodes: [
      {
        id: "s1",
        name: "Email Arrives",
        type: "trigger",
        nodeTypeId: "trigger.email",
        position: { x: 60, y: 100 },
        config: {},
      },
      {
        id: "s2",
        name: "Classify Topic",
        type: "ai",
        nodeTypeId: "ai.classify",
        position: { x: 340, y: 100 },
        config: { categories: "Billing,Technical,Sales" },
      },
      {
        id: "s3",
        name: "Check Urgency",
        type: "logic",
        nodeTypeId: "logic.if",
        position: { x: 620, y: 100 },
        config: { operator: "contains" },
      },
      {
        id: "s4",
        name: "Create Ticket",
        type: "action",
        nodeTypeId: "action.create_record",
        position: { x: 900, y: 60 },
        config: { object_type: "Ticket" },
      },
      {
        id: "s5",
        name: "Notify Slack",
        type: "action",
        nodeTypeId: "action.slack",
        position: { x: 900, y: 180 },
        config: { channel: "#support" },
      },
    ],
  },
  {
    name: "Data Pipeline & Transform",
    description:
      "Pull records from an API, filter and reshape the data with a JS transform, then write each row to a spreadsheet and log to the database.",
    category: "Data",
    triggerType: "schedule",
    complexity: "advanced",
    tags: ["etl", "data", "spreadsheet"],
    uses: 3298,
    templateType: "workflow",
    metadata: {},
    nodes: [
      {
        id: "d1",
        name: "Daily Trigger",
        type: "trigger",
        nodeTypeId: "trigger.schedule",
        position: { x: 60, y: 100 },
        config: { interval: "daily" },
      },
      {
        id: "d2",
        name: "Fetch Records",
        type: "action",
        nodeTypeId: "action.http",
        position: { x: 340, y: 100 },
        config: { method: "GET" },
      },
      {
        id: "d3",
        name: "Filter Active",
        type: "logic",
        nodeTypeId: "logic.filter",
        position: { x: 620, y: 100 },
        config: {},
      },
      {
        id: "d4",
        name: "Loop Items",
        type: "logic",
        nodeTypeId: "logic.loop",
        position: { x: 900, y: 100 },
        config: {},
      },
      {
        id: "d5",
        name: "Transform Row",
        type: "data",
        nodeTypeId: "data.transform",
        position: { x: 1180, y: 60 },
        config: {},
      },
      {
        id: "d6",
        name: "Write to Sheet",
        type: "action",
        nodeTypeId: "action.spreadsheet",
        position: { x: 1180, y: 180 },
        config: { operation: "append" },
      },
    ],
  },
  {
    name: "New User Onboarding",
    description:
      "Kick off a welcome sequence when a new user signs up: send a welcome email, create a CRM contact, post to Slack, and schedule a follow-up.",
    category: "Operations",
    triggerType: "webhook",
    complexity: "beginner",
    tags: ["onboarding", "email", "crm"],
    uses: 11503,
    templateType: "workflow",
    metadata: {},
    nodes: [
      {
        id: "o1",
        name: "Signup Webhook",
        type: "trigger",
        nodeTypeId: "trigger.webhook",
        position: { x: 60, y: 100 },
        config: { method: "POST" },
      },
      {
        id: "o2",
        name: "Create Contact",
        type: "action",
        nodeTypeId: "action.create_record",
        position: { x: 340, y: 100 },
        config: { object_type: "Contact" },
      },
      {
        id: "o3",
        name: "Send Welcome",
        type: "action",
        nodeTypeId: "action.send_email",
        position: { x: 620, y: 60 },
        config: { subject: "Welcome aboard!" },
      },
      {
        id: "o4",
        name: "Notify #signups",
        type: "action",
        nodeTypeId: "action.slack",
        position: { x: 620, y: 180 },
        config: { channel: "#signups" },
      },
      {
        id: "o5",
        name: "Schedule Follow-up",
        type: "logic",
        nodeTypeId: "logic.delay",
        position: { x: 900, y: 100 },
        config: { duration: "3", unit: "days" },
      },
    ],
  },
  {
    name: "Competitive Intel Scraper",
    description:
      "Scrape competitor pricing pages daily using AI, extract structured data, and push the results to a spreadsheet for tracking.",
    category: "Research",
    triggerType: "schedule",
    complexity: "advanced",
    tags: ["scraping", "ai", "research"],
    uses: 1887,
    templateType: "workflow",
    metadata: {},
    nodes: [
      {
        id: "c1",
        name: "Daily Schedule",
        type: "trigger",
        nodeTypeId: "trigger.schedule",
        position: { x: 60, y: 100 },
        config: { interval: "daily" },
      },
      {
        id: "c2",
        name: "Scrape Page",
        type: "ai",
        nodeTypeId: "ai.scraper",
        position: { x: 340, y: 100 },
        config: {},
      },
      {
        id: "c3",
        name: "Extract Prices",
        type: "ai",
        nodeTypeId: "ai.extract",
        position: { x: 620, y: 100 },
        config: {},
      },
      {
        id: "c4",
        name: "Append to Sheet",
        type: "action",
        nodeTypeId: "action.spreadsheet",
        position: { x: 900, y: 100 },
        config: { operation: "append" },
      },
    ],
  },
  {
    name: "API Error Monitor",
    description:
      "Hit a health-check endpoint every 5 minutes. If it returns non-200, send a PagerDuty-style Slack alert and log the incident to a database.",
    category: "Developer",
    triggerType: "schedule",
    complexity: "beginner",
    tags: ["monitoring", "alerts", "api"],
    uses: 5614,
    templateType: "workflow",
    metadata: {},
    nodes: [
      {
        id: "m1",
        name: "5-Min Schedule",
        type: "trigger",
        nodeTypeId: "trigger.schedule",
        position: { x: 60, y: 100 },
        config: { interval: "5m" },
      },
      {
        id: "m2",
        name: "Health Check",
        type: "action",
        nodeTypeId: "action.http",
        position: { x: 340, y: 100 },
        config: { method: "GET" },
      },
      {
        id: "m3",
        name: "Check Status",
        type: "logic",
        nodeTypeId: "logic.if",
        position: { x: 620, y: 100 },
        config: { operator: "neq", value: "200" },
      },
      {
        id: "m4",
        name: "Alert #ops",
        type: "action",
        nodeTypeId: "action.slack",
        position: { x: 900, y: 60 },
        config: { channel: "#ops-alerts" },
      },
      {
        id: "m5",
        name: "Log Incident",
        type: "action",
        nodeTypeId: "action.db_query",
        position: { x: 900, y: 180 },
        config: { operation: "insert" },
      },
    ],
  },
  {
    name: "Invoice PDF Extractor",
    description:
      "Process invoice attachments from email, extract key fields (vendor, amount, date) with AI, and push to your accounting spreadsheet.",
    category: "Operations",
    triggerType: "email",
    complexity: "intermediate",
    tags: ["finance", "ai", "documents"],
    uses: 2943,
    templateType: "workflow",
    metadata: {},
    nodes: [
      {
        id: "i1",
        name: "Invoice Email",
        type: "trigger",
        nodeTypeId: "trigger.email",
        position: { x: 60, y: 100 },
        config: { subject_filter: "invoice" },
      },
      {
        id: "i2",
        name: "Parse PDF",
        type: "data",
        nodeTypeId: "data.parse_doc",
        position: { x: 340, y: 100 },
        config: { output: "text" },
      },
      {
        id: "i3",
        name: "Extract Fields",
        type: "ai",
        nodeTypeId: "ai.extract",
        position: { x: 620, y: 100 },
        config: {},
      },
      {
        id: "i4",
        name: "Write to Sheet",
        type: "action",
        nodeTypeId: "action.spreadsheet",
        position: { x: 900, y: 100 },
        config: { operation: "append" },
      },
    ],
  },

  // CRM workflows
  {
    name: "Lead Capture → CRM → Notification",
    description:
      "Capture website form submissions, validate leads, push them to HubSpot, notify your team on Slack, and send a personalised follow-up email.",
    category: "CRM",
    triggerType: "form",
    complexity: "intermediate",
    tags: ["crm", "hubspot", "slack", "email", "leads"],
    uses: 7234,
    templateType: "workflow",
    metadata: {},
    nodes: [
      {
        id: "lc1",
        name: "Website Form",
        type: "trigger",
        nodeTypeId: "trigger.form",
        position: { x: 60, y: 100 },
        config: {},
      },
      {
        id: "lc2",
        name: "Lead Validation",
        type: "logic",
        nodeTypeId: "logic.if",
        position: { x: 300, y: 100 },
        config: {},
      },
      {
        id: "lc3",
        name: "HubSpot CRM",
        type: "action",
        nodeTypeId: "action.hubspot",
        position: { x: 540, y: 100 },
        config: { operation: "create_contact" },
      },
      {
        id: "lc4",
        name: "Slack Notification",
        type: "action",
        nodeTypeId: "action.slack",
        position: { x: 780, y: 60 },
        config: { channel: "#sales" },
      },
      {
        id: "lc5",
        name: "Follow-up Email",
        type: "action",
        nodeTypeId: "action.send_email",
        position: { x: 780, y: 180 },
        config: { subject: "Thanks for reaching out!" },
      },
    ],
  },
  {
    name: "Lead Scoring Workflow",
    description:
      "Enrich new leads with Clearbit data, score them based on company size and product fit, then auto-assign to the right sales rep in HubSpot or Salesforce.",
    category: "CRM",
    triggerType: "event",
    complexity: "advanced",
    tags: ["crm", "lead-scoring", "clearbit", "salesforce", "hubspot"],
    uses: 4892,
    templateType: "workflow",
    metadata: {},
    nodes: [
      {
        id: "ls1",
        name: "New Lead",
        type: "trigger",
        nodeTypeId: "trigger.event",
        position: { x: 60, y: 100 },
        config: {},
      },
      {
        id: "ls2",
        name: "Enrich Contact",
        type: "action",
        nodeTypeId: "action.clearbit",
        position: { x: 300, y: 100 },
        config: {},
      },
      {
        id: "ls3",
        name: "Score Lead",
        type: "ai",
        nodeTypeId: "ai.score",
        position: { x: 540, y: 100 },
        config: { criteria: "company_size,fit,intent" },
      },
      {
        id: "ls4",
        name: "Assign Sales Rep",
        type: "action",
        nodeTypeId: "action.hubspot",
        position: { x: 780, y: 100 },
        config: { operation: "assign_owner" },
      },
    ],
  },

  // Communication workflows
  {
    name: "WhatsApp Customer Support",
    description:
      "Classify incoming WhatsApp messages with AI, automatically create support tickets, and notify the right agent. Ideal for African SMBs where WhatsApp is dominant.",
    category: "Communication",
    triggerType: "webhook",
    complexity: "intermediate",
    tags: ["whatsapp", "support", "ai", "tickets"],
    uses: 9341,
    templateType: "workflow",
    metadata: {},
    nodes: [
      {
        id: "wa1",
        name: "WhatsApp Message",
        type: "trigger",
        nodeTypeId: "trigger.webhook",
        position: { x: 60, y: 100 },
        config: { source: "whatsapp" },
      },
      {
        id: "wa2",
        name: "AI Classification",
        type: "ai",
        nodeTypeId: "ai.classify",
        position: { x: 300, y: 100 },
        config: { categories: "Billing,Technical,General" },
      },
      {
        id: "wa3",
        name: "Create Ticket",
        type: "action",
        nodeTypeId: "action.create_record",
        position: { x: 540, y: 100 },
        config: { object_type: "Ticket" },
      },
      {
        id: "wa4",
        name: "Notify Agent",
        type: "action",
        nodeTypeId: "action.slack",
        position: { x: 780, y: 100 },
        config: { channel: "#support-agents" },
      },
    ],
  },
  {
    name: "Missed Call Follow-Up",
    description:
      "When a phone call is missed, automatically send a WhatsApp message to the caller and create a CRM record so no lead falls through the cracks.",
    category: "Communication",
    triggerType: "event",
    complexity: "beginner",
    tags: ["whatsapp", "calls", "crm"],
    uses: 5127,
    templateType: "workflow",
    metadata: {},
    nodes: [
      {
        id: "mc1",
        name: "Phone Missed Call",
        type: "trigger",
        nodeTypeId: "trigger.event",
        position: { x: 60, y: 100 },
        config: { event: "missed_call" },
      },
      {
        id: "mc2",
        name: "Send WhatsApp",
        type: "action",
        nodeTypeId: "action.whatsapp",
        position: { x: 300, y: 100 },
        config: { template: "missed_call" },
      },
      {
        id: "mc3",
        name: "Create CRM Record",
        type: "action",
        nodeTypeId: "action.create_record",
        position: { x: 540, y: 100 },
        config: { object_type: "Contact" },
      },
    ],
  },

  // Finance workflows
  {
    name: "Invoice Reminder",
    description:
      "Send escalating invoice reminders via email and WhatsApp when payment is overdue, with automatic escalation after 7 days.",
    category: "Finance",
    triggerType: "schedule",
    complexity: "intermediate",
    tags: ["invoicing", "payments", "whatsapp", "email"],
    uses: 6718,
    templateType: "workflow",
    metadata: {},
    nodes: [
      {
        id: "ir1",
        name: "Invoice Due",
        type: "trigger",
        nodeTypeId: "trigger.schedule",
        position: { x: 60, y: 100 },
        config: { interval: "daily" },
      },
      {
        id: "ir2",
        name: "Reminder Email",
        type: "action",
        nodeTypeId: "action.send_email",
        position: { x: 300, y: 80 },
        config: { subject: "Invoice Payment Reminder" },
      },
      {
        id: "ir3",
        name: "WhatsApp Reminder",
        type: "action",
        nodeTypeId: "action.whatsapp",
        position: { x: 300, y: 180 },
        config: { template: "invoice_reminder" },
      },
      {
        id: "ir4",
        name: "Escalate",
        type: "logic",
        nodeTypeId: "logic.if",
        position: { x: 540, y: 100 },
        config: { condition: "days_overdue > 7" },
      },
    ],
  },
  {
    name: "Stripe Payment Success",
    description:
      "When a Stripe payment succeeds, generate a professional receipt, email it to the customer, and update the deal in your CRM automatically.",
    category: "Finance",
    triggerType: "webhook",
    complexity: "beginner",
    tags: ["stripe", "payments", "email", "crm"],
    uses: 12840,
    templateType: "workflow",
    metadata: {},
    nodes: [
      {
        id: "sp1",
        name: "Stripe Payment",
        type: "trigger",
        nodeTypeId: "trigger.webhook",
        position: { x: 60, y: 100 },
        config: { source: "stripe", event: "payment.succeeded" },
      },
      {
        id: "sp2",
        name: "Generate Receipt",
        type: "data",
        nodeTypeId: "data.transform",
        position: { x: 300, y: 100 },
        config: {},
      },
      {
        id: "sp3",
        name: "Email Customer",
        type: "action",
        nodeTypeId: "action.send_email",
        position: { x: 540, y: 60 },
        config: { subject: "Payment Received — Thank You!" },
      },
      {
        id: "sp4",
        name: "Update CRM",
        type: "action",
        nodeTypeId: "action.create_record",
        position: { x: 540, y: 180 },
        config: { object_type: "Deal", operation: "update" },
      },
    ],
  },

  // HR workflows
  {
    name: "Employee Onboarding",
    description:
      "Automatically provision accounts, send a personalised welcome email with credentials, and assign onboarding tasks when a new employee is added.",
    category: "HR",
    triggerType: "event",
    complexity: "intermediate",
    tags: ["hr", "onboarding", "email", "tasks"],
    uses: 3956,
    templateType: "workflow",
    metadata: {},
    nodes: [
      {
        id: "eo1",
        name: "New Employee",
        type: "trigger",
        nodeTypeId: "trigger.event",
        position: { x: 60, y: 100 },
        config: { event: "employee.created" },
      },
      {
        id: "eo2",
        name: "Create Accounts",
        type: "action",
        nodeTypeId: "action.http",
        position: { x: 300, y: 100 },
        config: { method: "POST" },
      },
      {
        id: "eo3",
        name: "Send Welcome Email",
        type: "action",
        nodeTypeId: "action.send_email",
        position: { x: 540, y: 60 },
        config: { subject: "Welcome to the team!" },
      },
      {
        id: "eo4",
        name: "Create Tasks",
        type: "action",
        nodeTypeId: "action.create_record",
        position: { x: 540, y: 180 },
        config: { object_type: "Task" },
      },
    ],
  },
  {
    name: "Leave Request Approval",
    description:
      "Route employee leave requests to their manager for approval, then automatically notify HR once a decision is made.",
    category: "HR",
    triggerType: "form",
    complexity: "beginner",
    tags: ["hr", "approval", "leave"],
    uses: 2871,
    templateType: "workflow",
    metadata: {},
    nodes: [
      {
        id: "lr1",
        name: "Employee Request",
        type: "trigger",
        nodeTypeId: "trigger.form",
        position: { x: 60, y: 100 },
        config: {},
      },
      {
        id: "lr2",
        name: "Manager Approval",
        type: "logic",
        nodeTypeId: "logic.approval",
        position: { x: 300, y: 100 },
        config: { approver_role: "manager" },
      },
      {
        id: "lr3",
        name: "HR Notification",
        type: "action",
        nodeTypeId: "action.send_email",
        position: { x: 540, y: 100 },
        config: { subject: "Leave Request Decision" },
      },
    ],
  },

  // ─── DASHBOARD TEMPLATES ────────────────────────────────────────────────────

  {
    name: "Sales CRM Dashboard",
    description:
      "A full-featured CRM with lead tracking, kanban pipeline board, customer profiles, and a real-time activity feed. Connects to HubSpot, Salesforce, or PostgreSQL.",
    category: "Sales",
    triggerType: "manual",
    complexity: "intermediate",
    tags: ["crm", "sales", "pipeline", "leads"],
    uses: 15320,
    templateType: "dashboard",
    metadata: {
      components: [
        "Leads Table",
        "Pipeline Board",
        "Customer Profile",
        "Activity Feed",
      ],
      dataSources: ["PostgreSQL", "HubSpot", "Salesforce"],
    },
    nodes: [],
  },
  {
    name: "Customer Support Desk",
    description:
      "Manage support tickets, look up customers, track SLAs, and monitor agent performance from one unified view.",
    category: "Support",
    triggerType: "manual",
    complexity: "intermediate",
    tags: ["support", "tickets", "sla", "agents"],
    uses: 11240,
    templateType: "dashboard",
    metadata: {
      components: [
        "Ticket Queue",
        "Customer Lookup",
        "SLA Dashboard",
        "Agent Performance",
      ],
      dataSources: ["PostgreSQL", "Zendesk", "Freshdesk"],
    },
    nodes: [],
  },
  {
    name: "Inventory Management",
    description:
      "Track products, monitor stock levels, manage suppliers, and handle purchase orders. Popular with retailers and distributors.",
    category: "Operations",
    triggerType: "manual",
    complexity: "beginner",
    tags: ["inventory", "stock", "retail", "suppliers"],
    uses: 8750,
    templateType: "dashboard",
    metadata: {
      components: ["Products", "Stock Levels", "Suppliers", "Purchase Orders"],
      dataSources: ["PostgreSQL", "Shopify"],
    },
    nodes: [],
  },
  {
    name: "Real Estate Dashboard",
    description:
      "Manage property listings, track agent performance, review offers, schedule viewings, and monitor payments — all in one place.",
    category: "Real Estate",
    triggerType: "manual",
    complexity: "intermediate",
    tags: ["real-estate", "properties", "agents", "listings"],
    uses: 6430,
    templateType: "dashboard",
    metadata: {
      components: ["Properties", "Agents", "Offers", "Viewings", "Payments"],
      dataSources: ["PostgreSQL"],
    },
    nodes: [],
  },

  // ─── INDUSTRY BUNDLE TEMPLATES ──────────────────────────────────────────────

  {
    name: "Real Estate Bundle",
    description:
      "Everything you need to run a real estate agency — lead routing, property approvals, viewing scheduling, offer management workflows, and a complete listings dashboard.",
    category: "Real Estate",
    triggerType: "manual",
    complexity: "advanced",
    tags: ["real-estate", "bundle", "full-stack"],
    uses: 3210,
    templateType: "industry_bundle",
    metadata: {
      workflows: [
        "New Lead Routing",
        "Property Approval",
        "Viewing Scheduling",
        "Offer Management",
      ],
      dashboards: ["Listings", "Leads", "Agents", "Transactions"],
      includesDatabase: true,
      includesPermissions: true,
    },
    nodes: [],
  },
  {
    name: "E-Commerce Bundle",
    description:
      "Full e-commerce automation — order processing, payment confirmation, abandoned cart recovery, and refund handling with a complete orders and inventory dashboard.",
    category: "E-Commerce",
    triggerType: "manual",
    complexity: "advanced",
    tags: ["ecommerce", "orders", "shopify", "bundle"],
    uses: 5890,
    templateType: "industry_bundle",
    metadata: {
      workflows: [
        "Order Received",
        "Payment Success",
        "Abandoned Cart",
        "Refund Request",
      ],
      dashboards: ["Orders", "Products", "Inventory", "Customers"],
      includesDatabase: true,
      includesPermissions: true,
    },
    nodes: [],
  },
  {
    name: "Healthcare Clinic Bundle",
    description:
      "Automate appointment reminders, patient follow-up notifications, and lab result alerts with a full patient management dashboard including billing.",
    category: "Healthcare",
    triggerType: "manual",
    complexity: "advanced",
    tags: ["healthcare", "clinic", "appointments", "bundle"],
    uses: 1980,
    templateType: "industry_bundle",
    metadata: {
      workflows: [
        "Appointment Reminder",
        "Follow-up Notification",
        "Lab Result Alert",
      ],
      dashboards: ["Patients", "Appointments", "Billing"],
      includesDatabase: true,
      includesPermissions: true,
    },
    nodes: [],
  },
  {
    name: "School Management Bundle",
    description:
      "Manage student registrations, fee reminders, and result publications with dashboards for students, teachers, attendance, and payments. Especially useful in The Gambia.",
    category: "Education",
    triggerType: "manual",
    complexity: "advanced",
    tags: ["education", "school", "students", "bundle"],
    uses: 1540,
    templateType: "industry_bundle",
    metadata: {
      workflows: ["Student Registration", "Fee Reminder", "Result Publication"],
      dashboards: ["Students", "Teachers", "Attendance", "Payments"],
      includesDatabase: true,
      includesPermissions: true,
    },
    nodes: [],
  },

  // ─── DEVELOPER TEMPLATES ────────────────────────────────────────────────────

  {
    name: "OAuth 2.0 Connector",
    description:
      "A production-ready connector starter with OAuth 2.0 auth, automatic token refresh, and a sample action. Scaffold your integration in minutes.",
    category: "Connector",
    triggerType: "manual",
    complexity: "advanced",
    tags: ["connector", "oauth", "developer"],
    uses: 2340,
    templateType: "developer",
    metadata: {
      starterType: "oauth-connector",
      codeSnippet: `export default defineConnector({
  metadata: { name: "My Connector", icon: "🔌" },
  auth: {
    type: "oauth2",
    authUrl: "https://api.example.com/oauth/authorize",
    tokenUrl: "https://api.example.com/oauth/token",
  },
  actions: [
    { id: "get_user", name: "Get User",
      run: async (ctx) => ctx.fetch("/me") }
  ],
  triggers: [],
});`,
    },
    nodes: [],
  },
  {
    name: "API Key Connector",
    description:
      "Bootstrap a connector that authenticates via an API key header. Includes a sample GET action with error handling and response mapping.",
    category: "Connector",
    triggerType: "manual",
    complexity: "intermediate",
    tags: ["connector", "api-key", "developer"],
    uses: 3870,
    templateType: "developer",
    metadata: {
      starterType: "api-key-connector",
      codeSnippet: `export default defineConnector({
  metadata: { name: "My API", icon: "🔑" },
  auth: { type: "api_key", header: "X-API-Key" },
  actions: [
    { id: "list_items", name: "List Items",
      run: async (ctx) => ctx.fetch("/items") }
  ],
  triggers: [],
});`,
    },
    nodes: [],
  },
  {
    name: "Webhook Connector",
    description:
      "Start building a webhook-based connector with inbound signature verification, event parsing, and a trigger definition ready to go.",
    category: "Connector",
    triggerType: "manual",
    complexity: "intermediate",
    tags: ["connector", "webhook", "developer"],
    uses: 1920,
    templateType: "developer",
    metadata: {
      starterType: "webhook-connector",
      codeSnippet: `export default defineConnector({
  metadata: { name: "My Webhook", icon: "🔗" },
  auth: { type: "webhook_secret" },
  actions: [],
  triggers: [
    { id: "on_event", name: "On Event",
      type: "webhook",
      verify: (req, secret) => verifySignature(req, secret) }
  ],
});`,
    },
    nodes: [],
  },
  {
    name: "Action Node Starter",
    description:
      "A scaffold for a custom workflow action node. Handles input schema, config UI metadata, and async execution with structured error reporting.",
    category: "Node",
    triggerType: "manual",
    complexity: "intermediate",
    tags: ["node", "action", "developer"],
    uses: 1450,
    templateType: "developer",
    metadata: {
      starterType: "action-node",
      codeSnippet: `export default defineActionNode({
  id: "my_action",
  name: "My Action",
  inputs: [
    { key: "value", label: "Value", type: "string", required: true }
  ],
  run: async ({ inputs, ctx }) => {
    const result = await doSomething(inputs.value);
    return { result };
  },
});`,
    },
    nodes: [],
  },
  {
    name: "Polling Trigger Node",
    description:
      "Create a polling-based trigger that periodically checks an external API for new data and fires when something changes.",
    category: "Node",
    triggerType: "manual",
    complexity: "intermediate",
    tags: ["node", "trigger", "polling", "developer"],
    uses: 980,
    templateType: "developer",
    metadata: {
      starterType: "polling-node",
      codeSnippet: `export default definePollingNode({
  id: "my_poll",
  name: "Poll for New Items",
  interval: "5m",
  poll: async (ctx, lastRun) => {
    const items = await ctx.fetch(\`/items?since=\${lastRun}\`);
    return items.filter(i => new Date(i.createdAt) > lastRun);
  },
});`,
    },
    nodes: [],
  },
  {
    name: "Dashboard Table Component",
    description:
      "A production-ready data table for internal dashboards with sorting, filtering, pagination, and inline row actions.",
    category: "Component",
    triggerType: "manual",
    complexity: "beginner",
    tags: ["component", "table", "dashboard", "developer"],
    uses: 5670,
    templateType: "developer",
    metadata: {
      starterType: "table-component",
      codeSnippet: `export default defineTableComponent({
  name: "Data Table",
  dataSource: { type: "query", sql: "SELECT * FROM items" },
  columns: [
    { key: "id", label: "ID" },
    { key: "name", label: "Name", sortable: true },
    { key: "status", label: "Status", type: "badge" },
  ],
  actions: ["view", "edit", "delete"],
});`,
    },
    nodes: [],
  },
  {
    name: "Chart Component",
    description:
      "A configurable chart component for dashboards — supports line, bar, area, and pie charts with automatic data binding.",
    category: "Component",
    triggerType: "manual",
    complexity: "beginner",
    tags: ["component", "chart", "dashboard", "developer"],
    uses: 3140,
    templateType: "developer",
    metadata: {
      starterType: "chart-component",
      codeSnippet: `export default defineChartComponent({
  name: "Revenue Chart",
  type: "line",
  dataSource: { type: "query",
    sql: "SELECT date, SUM(amount) AS revenue FROM orders GROUP BY date" },
  xAxis: "date",
  yAxis: "revenue",
  color: "#6366f1",
});`,
    },
    nodes: [],
  },
  {
    name: "Metric Card Component",
    description:
      "A KPI metric card with trend indicator, comparison period, and configurable data source — drop into any dashboard.",
    category: "Component",
    triggerType: "manual",
    complexity: "beginner",
    tags: ["component", "metric", "kpi", "dashboard", "developer"],
    uses: 4230,
    templateType: "developer",
    metadata: {
      starterType: "metric-card",
      codeSnippet: `export default defineMetricCard({
  name: "Total Revenue",
  query: "SELECT SUM(amount) FROM orders WHERE status = 'paid'",
  format: "currency",
  prefix: "$",
  trend: { compareWith: "last_month", direction: "up_is_good" },
});`,
    },
    nodes: [],
  },

  // ─── AI-POWERED TEMPLATES ───────────────────────────────────────────────────

  {
    name: "Real Estate Agency",
    description:
      'AI-generated from: "I run a real estate agency" — full lead routing, viewing scheduling, offer approval, and payment reminder workflows with a complete properties dashboard.',
    category: "Real Estate",
    triggerType: "manual",
    complexity: "advanced",
    tags: ["ai-generated", "real-estate", "complete"],
    uses: 2140,
    templateType: "ai_powered",
    metadata: {
      prompt: "I run a real estate agency",
      generatedWorkflows: [
        "Lead Capture",
        "Viewing Scheduling",
        "Offer Approval",
        "Payment Reminder",
      ],
      generatedDashboards: ["Properties", "Agents", "Customers", "Revenue"],
      roles: ["Admin", "Agent", "Manager", "Viewer"],
    },
    nodes: [],
  },
  {
    name: "SaaS Startup",
    description:
      'AI-generated from: "I run a SaaS startup" — trial-to-paid conversion, churn prevention, NPS collection workflows with MRR, churn, and user dashboard.',
    category: "SaaS",
    triggerType: "manual",
    complexity: "advanced",
    tags: ["ai-generated", "saas", "complete"],
    uses: 3780,
    templateType: "ai_powered",
    metadata: {
      prompt: "I run a SaaS startup",
      generatedWorkflows: [
        "Trial Signup",
        "Trial-to-Paid Nudge",
        "Churn Prevention",
        "NPS Survey",
      ],
      generatedDashboards: ["MRR", "Churn", "Users", "Conversions"],
      roles: ["Admin", "CSM", "Sales", "Viewer"],
    },
    nodes: [],
  },
  {
    name: "Digital Agency",
    description:
      'AI-generated from: "I run a digital marketing agency" — client onboarding, report delivery, invoice reminders, and a project & revenue dashboard.',
    category: "Agency",
    triggerType: "manual",
    complexity: "intermediate",
    tags: ["ai-generated", "agency", "complete"],
    uses: 1850,
    templateType: "ai_powered",
    metadata: {
      prompt: "I run a digital marketing agency",
      generatedWorkflows: [
        "Client Onboarding",
        "Monthly Report Delivery",
        "Invoice Reminder",
        "Proposal Follow-up",
      ],
      generatedDashboards: ["Projects", "Clients", "Revenue", "Tasks"],
      roles: ["Admin", "Account Manager", "Designer", "Viewer"],
    },
    nodes: [],
  },
];

async function ensureBuiltinTemplates() {
  const existing = await db
    .select({
      id: templatesTable.id,
      templateType: templatesTable.templateType,
    })
    .from(templatesTable)
    .where(eq(templatesTable.isCustom, false));

  const seededTypes = new Set(existing.map((e) => e.templateType));

  const typesToSeed = (
    [
      "workflow",
      "dashboard",
      "industry_bundle",
      "developer",
      "ai_powered",
    ] as TemplateType[]
  ).filter((type) => !seededTypes.has(type));

  if (typesToSeed.length === 0) return;

  const toInsert = BUILTIN_TEMPLATES.filter((t) =>
    typesToSeed.includes(t.templateType),
  );
  if (toInsert.length === 0) return;

  await db.insert(templatesTable).values(
    toInsert.map((t) => ({
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
      templateType: t.templateType,
      metadata: t.metadata,
    })),
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
    templateType: t.templateType,
    metadata: t.metadata && typeof t.metadata === "object" ? t.metadata : {},
    createdAt: t.createdAt.toISOString(),
  };
}

const CreateTemplateBody = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  category: z.string().min(1),
  triggerType: z.string().min(1),
  complexity: z
    .enum(["beginner", "intermediate", "advanced"])
    .default("beginner"),
  tags: z.array(z.string()).default([]),
  nodes: z.array(z.any()).default([]),
  templateType: z
    .enum([
      "workflow",
      "dashboard",
      "industry_bundle",
      "developer",
      "ai_powered",
    ])
    .default("workflow"),
  metadata: z.record(z.unknown()).default({}),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get("/templates", async (req, res): Promise<void> => {
  const params = ListTemplatesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.category)
    conditions.push(eq(templatesTable.category, params.data.category));
  if (params.data.search)
    conditions.push(like(templatesTable.name, `%${params.data.search}%`));
  if ((params.data as Record<string, unknown>).templateType) {
    conditions.push(
      eq(
        templatesTable.templateType,
        (params.data as Record<string, unknown>).templateType as string,
      ),
    );
  }

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

  const { nodes, metadata, ...rest } = parsed.data;
  const [template] = await db
    .insert(templatesTable)
    .values({
      ...rest,
      nodes,
      metadata,
      nodeCount: nodes.length,
      isCustom: true,
    })
    .returning();

  res.status(201).json(serializeTemplate(template));
});

router.get("/templates/:id", async (req, res): Promise<void> => {
  const params = GetTemplateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [template] = await db
    .select()
    .from(templatesTable)
    .where(eq(templatesTable.id, params.data.id));

  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }
  res.json(serializeTemplate(template));
});

router.delete("/templates/:id", async (req, res): Promise<void> => {
  const params = GetTemplateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [template] = await db
    .select()
    .from(templatesTable)
    .where(eq(templatesTable.id, params.data.id));

  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }
  if (!template.isCustom) {
    res.status(403).json({ error: "Built-in templates cannot be deleted" });
    return;
  }

  await db.delete(templatesTable).where(eq(templatesTable.id, params.data.id));
  res.sendStatus(204);
});

// ─── Template versions ────────────────────────────────────────────────────────

router.get("/templates/:id/versions", async (req, res): Promise<void> => {
  const params = GetTemplateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [template] = await db
    .select()
    .from(templatesTable)
    .where(eq(templatesTable.id, params.data.id));
  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  const versions = await db
    .select()
    .from(templateVersionsTable)
    .where(eq(templateVersionsTable.templateId, params.data.id))
    .orderBy(desc(templateVersionsTable.version));

  res.json(
    versions.map((v) => ({
      id: v.id,
      templateId: v.templateId,
      version: v.version,
      name: v.name,
      nodeCount: Array.isArray(v.nodes) ? (v.nodes as unknown[]).length : 0,
      changeNote: v.changeNote ?? null,
      createdAt: v.createdAt.toISOString(),
    })),
  );
});

// ─── Fork template ────────────────────────────────────────────────────────────

router.post("/templates/:id/fork", async (req, res): Promise<void> => {
  const params = GetTemplateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [source] = await db
    .select()
    .from(templatesTable)
    .where(eq(templatesTable.id, params.data.id));
  if (!source) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  const [forked] = await db
    .insert(templatesTable)
    .values({
      name: `${source.name} (Fork)`,
      description: source.description,
      category: source.category,
      triggerType: source.triggerType,
      complexity: source.complexity,
      tags: source.tags,
      uses: 0,
      templateType: source.templateType,
      metadata: source.metadata,
      nodes: source.nodes,
      nodeCount: source.nodeCount,
    })
    .returning();

  await db.insert(templateVersionsTable).values({
    templateId: forked.id,
    version: 1,
    name: forked.name,
    nodes: (source.nodes ?? []) as Parameters<typeof db.insert>[0],
    changeNote: `Forked from "${source.name}" (v${source.id})`,
  });

  res.status(201).json({
    id: forked.id,
    name: forked.name,
    description: forked.description ?? null,
    category: forked.category,
    triggerType: forked.triggerType,
    complexity: forked.complexity,
    tags: forked.tags ?? [],
    uses: forked.uses,
    templateType: forked.templateType,
    metadata: forked.metadata ?? {},
    nodes: forked.nodes ?? [],
    nodeCount: forked.nodeCount,
    createdAt: forked.createdAt.toISOString(),
  });
});

router.post("/templates/:id/use", async (req, res): Promise<void> => {
  const params = GetTemplateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [template] = await db
    .select()
    .from(templatesTable)
    .where(eq(templatesTable.id, params.data.id));

  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  await db
    .update(templatesTable)
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

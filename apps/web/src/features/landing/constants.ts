import {
  Bot,
  Cable,
  GitBranch,
  LayoutDashboard,
  Shield,
  Store,
  type LucideIcon,
} from "lucide-react";

export type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type Step = {
  step: string;
  title: string;
  description: string;
};

export type PricingPlan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
};

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
] as const;

export const FEATURES: Feature[] = [
  {
    icon: GitBranch,
    title: "Visual workflow builder",
    description:
      "Design automations on a canvas with triggers, conditions, AI steps, and connector actions — versioned and ready to publish.",
  },
  {
    icon: Bot,
    title: "AI-native agent runtime",
    description:
      "Route prompts across OpenAI, Groq, Mistral, and more with governance, playground testing, and policy-driven model selection.",
  },
  {
    icon: Cable,
    title: "Connector marketplace",
    description:
      "Install Stripe, Slack, Notion, Salesforce, and 11+ integrations. Publish your own connectors to the ecosystem.",
  },
  {
    icon: LayoutDashboard,
    title: "Low-code dashboards",
    description:
      "Build internal tools and analytics views bound to workflows and data sources — no separate BI stack required.",
  },
  {
    icon: Shield,
    title: "Enterprise controls",
    description:
      "Multi-tenant RBAC, SSO, audit exports, GDPR tooling, environment promotion, and immutable audit logs.",
  },
  {
    icon: Store,
    title: "Metered billing",
    description:
      "Usage-based plans with execution metering, Stripe checkout, and revenue sharing for marketplace publishers.",
  },
];

export const STEPS: Step[] = [
  {
    step: "01",
    title: "Connect your stack",
    description:
      "Install connectors, configure credentials, and bind data sources. SSO and region policies ship with every tenant.",
  },
  {
    step: "02",
    title: "Build and test",
    description:
      "Author workflows in the visual builder, test AI prompts in the playground, and promote across dev, staging, and prod.",
  },
  {
    step: "03",
    title: "Run at scale",
    description:
      "Executions run on BullMQ with retries, DLQ, observability, and usage metering — billed to your plan automatically.",
  },
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    description: "For individuals and small teams getting started.",
    features: [
      "500 executions / month",
      "10 workflows",
      "50K AI tokens",
      "Community connectors",
    ],
    cta: "Start free",
  },
  {
    name: "Growth",
    price: "$79",
    period: "per month",
    description: "For growing teams shipping production automations.",
    features: [
      "15K executions / month",
      "100 workflows",
      "500K AI tokens",
      "SSO & audit export",
      "Environment promotion",
    ],
    highlighted: true,
    cta: "Start trial",
  },
  {
    name: "Business",
    price: "$299",
    period: "per month",
    description: "For organizations with compliance and scale requirements.",
    features: [
      "100K executions / month",
      "Unlimited workflows",
      "5M AI tokens",
      "GDPR tooling & retention",
      "Priority support",
    ],
    cta: "Contact sales",
  },
];

export const CONNECTOR_NAMES = [
  "Stripe",
  "Slack",
  "Notion",
  "Salesforce",
  "Google Sheets",
  "MySQL",
  "HubSpot",
  "Twilio",
];

export const STATS = [
  { value: "18", label: "Microservices" },
  { value: "11+", label: "Connectors" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "<100ms", label: "API latency" },
] as const;

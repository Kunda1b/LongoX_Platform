/**
 * Billing seed script.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.billingPlan` delegate with `upsert()` for idempotency.
 */

import { prisma } from "@longox/db/prisma";

const PLANS = [
  {
    name: "starter",
    displayName: "Starter",
    description: "Perfect for individuals and small projects getting started with automation",
    tier: "starter",
    monthlyPrice: 0,
    annualPrice: 0,
    includedExecutions: 500,
    includedWorkflows: 10,
    includedConnectors: 5,
    includedAiTokens: 50000,
    includedStorageMb: 1000,
    maxUsers: 2,
    maxEnvironments: 1,
    overageExecutionsPrice: 0.01,
    overageAiTokensPrice: 0.002,
    features: [
      "10 workflows",
      "500 executions/month",
      "5 connectors",
      "50K AI tokens",
      "1 GB storage",
      "2 users",
      "Community support",
      "Basic analytics",
    ],
    sortOrder: 0,
  },
  {
    name: "growth",
    displayName: "Growth",
    description: "For growing teams that need more power and flexibility",
    tier: "growth",
    monthlyPrice: 79,
    annualPrice: 63,
    includedExecutions: 15000,
    includedWorkflows: 100,
    includedConnectors: 50,
    includedAiTokens: 500000,
    includedStorageMb: 10000,
    maxUsers: 25,
    maxEnvironments: 5,
    overageExecutionsPrice: 0.008,
    overageAiTokensPrice: 0.0015,
    features: [
      "100 workflows",
      "15,000 executions/month",
      "50 connectors",
      "500K AI tokens",
      "10 GB storage",
      "25 users",
      "5 environments",
      "Priority support",
      "Advanced analytics",
      "Team collaboration",
      "Audit logs",
    ],
    sortOrder: 1,
  },
  {
    name: "business",
    displayName: "Business",
    description: "For organizations that need scale, security, and dedicated support",
    tier: "business",
    monthlyPrice: 299,
    annualPrice: 239,
    includedExecutions: 100000,
    includedWorkflows: 1000,
    includedConnectors: 200,
    includedAiTokens: 5000000,
    includedStorageMb: 100000,
    maxUsers: 100,
    maxEnvironments: 20,
    overageExecutionsPrice: 0.005,
    overageAiTokensPrice: 0.001,
    features: [
      "Unlimited workflows",
      "100,000 executions/month",
      "200 connectors",
      "5M AI tokens",
      "100 GB storage",
      "100 users",
      "20 environments",
      "SSO & SAML",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
      "Advanced security",
      "API access",
    ],
    sortOrder: 2,
  },
];

async function seedPlans(): Promise<void> {
  for (const plan of PLANS) {
    await prisma.billingPlan.upsert({
      where: { name: plan.name },
      update: plan as any,
      create: plan as any,
    });
  }
  console.log("Billing plans seeded: Starter, Growth, Business");
}

seedPlans()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to seed billing plans:", err);
    process.exit(1);
  });

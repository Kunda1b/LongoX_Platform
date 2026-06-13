import { db, billingPlansTable } from "@longox/db";
import { eq } from "drizzle-orm";

const PLANS = [
  {
    name: "free",
    displayName: "Free",
    description: "Get started with basic workflow automation",
    tier: "free",
    monthlyPrice: 0,
    annualPrice: 0,
    includedExecutions: 100,
    includedWorkflows: 5,
    includedConnectors: 3,
    includedAiTokens: 10000,
    includedStorageMb: 500,
    maxUsers: 1,
    maxEnvironments: 1,
    overageExecutionsPrice: 0.01,
    overageAiTokensPrice: 0.002,
    features: [
      "5 workflows",
      "100 executions/month",
      "3 connectors",
      "10K AI tokens",
      "Community support",
    ],
    sortOrder: 0,
  },
  {
    name: "pro",
    displayName: "Pro",
    description: "For growing teams that need more power",
    tier: "pro",
    monthlyPrice: 49,
    annualPrice: 39,
    includedExecutions: 5000,
    includedWorkflows: 50,
    includedConnectors: 20,
    includedAiTokens: 200000,
    includedStorageMb: 5000,
    maxUsers: 10,
    maxEnvironments: 3,
    overageExecutionsPrice: 0.008,
    overageAiTokensPrice: 0.0015,
    features: [
      "50 workflows",
      "5,000 executions/month",
      "20 connectors",
      "200K AI tokens",
      "3 environments",
      "Priority support",
      "Advanced analytics",
    ],
    sortOrder: 1,
  },
  {
    name: "enterprise",
    displayName: "Enterprise",
    description: "For organizations that need scale and security",
    tier: "enterprise",
    monthlyPrice: 199,
    annualPrice: 159,
    includedExecutions: 50000,
    includedWorkflows: 500,
    includedConnectors: 100,
    includedAiTokens: 2000000,
    includedStorageMb: 50000,
    maxUsers: 100,
    maxEnvironments: 10,
    overageExecutionsPrice: 0.005,
    overageAiTokensPrice: 0.001,
    features: [
      "Unlimited workflows",
      "50,000 executions/month",
      "100 connectors",
      "2M AI tokens",
      "10 environments",
      "SSO & SAML",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
    ],
    sortOrder: 2,
  },
];

async function seedPlans(): Promise<void> {
  for (const plan of PLANS) {
    const [existing] = await db
      .select()
      .from(billingPlansTable)
      .where(eq(billingPlansTable.name, plan.name))
      .limit(1);

    if (existing) {
      await db
        .update(billingPlansTable)
        .set(plan)
        .where(eq(billingPlansTable.name, plan.name));
    } else {
      await db.insert(billingPlansTable).values(plan);
    }
  }
  console.log("Billing plans seeded successfully");
}

seedPlans()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to seed billing plans:", err);
    process.exit(1);
  });

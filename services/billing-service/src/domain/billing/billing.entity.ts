export interface UsageSummary {
  totalExecutions: number;
  executionsThisMonth: number;
  totalWorkflows: number;
  activeWorkflows: number;
  totalConnectors: number;
  usedConnectors: number;
  currentPeriodCost: number;
  budgetLimit: number;
}

export interface UsageBreakdownLine {
  label: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface BillingPeriod {
  start: string;
  end: string;
  totalAmount: number;
  usageBreakdown: UsageBreakdownLine[];
}

export interface Invoice {
  id: number;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  status: "pending" | "paid";
  lineItems: UsageBreakdownLine[];
  createdAt: string;
}

"use client";

import { useState } from "react";
import {
  useGetCurrentBillingPeriod, useListBillingInvoices, useGetUsageSummary,
  useListPlans, useGetSubscriptionStatus, useCreateCheckoutSession, useGetPortalSession,
} from "@longox/api-client-react";
import type { BillingPlan } from "@longox/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, CreditCard, Download, Check, ExternalLink, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminBillingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const { data: billingPeriod, isLoading: billingLoading } = useGetCurrentBillingPeriod();
  const { data: invoices, isLoading: invoicesLoading } = useListBillingInvoices();
  const { data: usage, isLoading: usageLoading } = useGetUsageSummary();
  const { data: plans, isLoading: plansLoading } = useListPlans();
  const { data: subscription } = useGetSubscriptionStatus();
  const checkoutMutation = useCreateCheckoutSession({ onSuccess: (data) => { window.location.href = data.url; } });
  const portalMutation = useGetPortalSession({ onSuccess: (data) => { window.location.href = data.url; } });
  const currentPlanName = subscription?.plan?.name ?? "free";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground">Manage workspace subscriptions, usage, and invoices</p>
        </div>
        {subscription?.status !== "none" && (
          <Button variant="outline" onClick={() => portalMutation.mutate()} disabled={portalMutation.isPending}>
            {portalMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
            Manage Subscription
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Period Cost</CardTitle></CardHeader>
          <CardContent>
            {billingLoading ? <Skeleton className="h-8 w-32" /> : (
              <div className="text-2xl font-bold">${billingPeriod?.totalAmount.toFixed(2) || "0.00"}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Execution Usage</CardTitle></CardHeader>
          <CardContent>
            {usageLoading ? <Skeleton className="h-8 w-32" /> : (
              <div className="text-2xl font-bold">{usage?.totalExecutions?.toLocaleString() || "0"}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Active Workflows</CardTitle></CardHeader>
          <CardContent>
            {usageLoading ? <Skeleton className="h-8 w-32" /> : (
              <div className="text-2xl font-bold">{usage?.activeWorkflows || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Tenants Usage</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Billing overview across all tenants. Use the Stripe dashboard for detailed reports.
        </CardContent>
      </Card>
    </div>
  );
}

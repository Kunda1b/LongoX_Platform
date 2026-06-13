"use client";

import { useState } from "react";
import {
  useGetCurrentBillingPeriod,
  useListBillingInvoices,
  useGetUsageSummary,
  useListPlans,
  useGetSubscriptionStatus,
  useCreateCheckoutSession,
  useGetPortalSession,
} from "@longox/api-client-react";
import type { BillingPlan } from "@longox/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  CreditCard,
  Download,
  ArrowUpRight,
  Check,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function PlanCard({
  plan,
  billingCycle,
  currentPlanName,
  onSelect,
  isCheckoutPending,
}: {
  plan: BillingPlan;
  billingCycle: "monthly" | "annual";
  currentPlanName: string;
  onSelect: (planId: number) => void;
  isCheckoutPending: boolean;
}) {
  const price =
    billingCycle === "annual" && plan.annualPrice
      ? plan.annualPrice
      : plan.monthlyPrice;
  const isCurrent = plan.name === currentPlanName;
  const isFree = plan.tier === "free";

  return (
    <Card
      className={`relative ${isCurrent ? "border-primary ring-2 ring-primary/20" : ""}`}
    >
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge>Current Plan</Badge>
        </div>
      )}
      <CardHeader className="text-center">
        <CardTitle>{plan.displayName}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold">
            {isFree ? "Free" : `$${price}`}
          </span>
          {!isFree && (
            <span className="text-muted-foreground">
              /{billingCycle === "annual" ? "yr" : "mo"}
            </span>
          )}
        </div>
        {billingCycle === "annual" && plan.annualPrice && plan.monthlyPrice > 0 && (
          <p className="text-sm text-green-600">
            Save ${((plan.monthlyPrice - plan.annualPrice) * 12).toFixed(0)}/year
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button
          className="w-full"
          variant={isCurrent ? "outline" : "default"}
          disabled={isCurrent || isCheckoutPending}
          onClick={() => onSelect(plan.id)}
        >
          {isCheckoutPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isCurrent ? (
            "Current Plan"
          ) : isFree ? (
            "Downgrade"
          ) : (
            "Upgrade"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function BillingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );

  const { data: billingPeriod, isLoading: billingLoading } =
    useGetCurrentBillingPeriod();
  const { data: invoices, isLoading: invoicesLoading } =
    useListBillingInvoices();
  const { data: usage, isLoading: usageLoading } = useGetUsageSummary();
  const { data: plans, isLoading: plansLoading } = useListPlans();
  const { data: subscription } = useGetSubscriptionStatus();

  const checkoutMutation = useCreateCheckoutSession({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const portalMutation = useGetPortalSession({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const handlePlanSelect = (planId: number) => {
    checkoutMutation.mutate({ planId, billingCycle });
  };

  const currentPlanName =
    subscription?.plan?.name ?? "free";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground">
            Manage your subscription, usage, and invoices
          </p>
        </div>
        {subscription?.status !== "none" && (
          <Button
            variant="outline"
            onClick={() => portalMutation.mutate()}
            disabled={portalMutation.isPending}
          >
            {portalMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="mr-2 h-4 w-4" />
            )}
            Manage Subscription
          </Button>
        )}
      </div>

      {/* Subscription Status */}
      {subscription && subscription.status !== "none" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-lg font-semibold">
                  {subscription.plan?.displayName ?? "Free"}
                </div>
                <p className="text-sm text-muted-foreground">
                  Status:{" "}
                  <Badge
                    variant={
                      subscription.status === "active"
                        ? "success"
                        : subscription.status === "trialing"
                          ? "default"
                          : "destructive"
                    }
                  >
                    {subscription.status}
                  </Badge>
                </p>
              </div>
              {subscription.currentPeriodEnd && (
                <div className="ml-auto text-right">
                  <p className="text-sm text-muted-foreground">
                    {subscription.cancelAtPeriodEnd
                      ? "Cancels on"
                      : "Renews on"}
                  </p>
                  <p className="text-sm font-medium">
                    {new Date(
                      subscription.currentPeriodEnd,
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Current Period Cost</CardTitle>
          </CardHeader>
          <CardContent>
            {billingLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${billingPeriod?.totalAmount.toFixed(2) || "0.00"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {billingPeriod?.start && billingPeriod?.end
                    ? `${new Date(billingPeriod.start).toLocaleDateString()} - ${new Date(billingPeriod.end).toLocaleDateString()}`
                    : "No billing period"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {usageLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {usage?.totalExecutions?.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  of{" "}
                  {usage?.includedExecutions?.toLocaleString() || "0"}{" "}
                  executions used
                </p>
                <div className="mt-2 h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{
                      width: `${Math.min(
                        ((usage?.totalExecutions || 0) /
                          (usage?.includedExecutions || 1)) *
                          100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            {usageLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {usage?.totalWorkflows?.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {usage?.activeWorkflows || 0} active workflows
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plan Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Plans</CardTitle>
              <CardDescription>
                Choose the plan that fits your needs
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              <button
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  billingCycle === "monthly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setBillingCycle("monthly")}
              >
                Monthly
              </button>
              <button
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  billingCycle === "annual"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setBillingCycle("annual")}
              >
                Annual
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {plansLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-96 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {plans?.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  billingCycle={billingCycle}
                  currentPlanName={currentPlanName}
                  onSelect={handlePlanSelect}
                  isCheckoutPending={checkoutMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Invoices</CardTitle>
            <CardDescription>Recent billing history</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {invoicesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))
            ) : invoices?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No invoices yet
              </p>
            ) : (
              invoices?.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <span className="text-sm font-medium">
                      {new Date(inv.periodStart).toLocaleDateString()} -{" "}
                      {new Date(inv.periodEnd).toLocaleDateString()}
                    </span>
                    <span className="ml-4 text-sm text-muted-foreground">
                      ${inv.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        inv.status === "paid"
                          ? "success"
                          : inv.status === "pending"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {inv.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

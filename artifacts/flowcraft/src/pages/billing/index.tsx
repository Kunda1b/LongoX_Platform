import { useQuery } from "@tanstack/react-query";
import type { UsageSummary, UsageEvent, BillingPeriod, BillingInvoice } from "@autoflow/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Zap, GitBranch, Cable, TrendingUp, DollarSign,
  CheckCircle2, Clock, AlertCircle, Receipt,
} from "lucide-react";

function StatCard({ title, value, sub, icon: Icon, accent }: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; accent?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${accent ?? ""}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="p-2 bg-muted rounded-lg">
            <Icon size={18} className="text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  "workflow.run": { label: "Workflow Runs", color: "bg-blue-500" },
  "connector.call": { label: "Connector Calls", color: "bg-violet-500" },
  "webhook.received": { label: "Webhooks", color: "bg-emerald-500" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  paid: { label: "Paid", icon: CheckCircle2, className: "text-emerald-600" },
  pending: { label: "Pending", icon: Clock, className: "text-amber-600" },
  draft: { label: "Draft", icon: AlertCircle, className: "text-muted-foreground" },
};

function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString("en-US", opts ?? { month: "short", year: "numeric" });
}

function formatTs(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function BillingPage() {
  const { data: summary, isLoading: loadingSum } = useQuery<UsageSummary>({
    queryKey: ["usage-summary"],
    queryFn: () => fetch("/api/usage").then((r) => r.json()),
  });

  const { data: events = [], isLoading: loadingEvents } = useQuery<UsageEvent[]>({
    queryKey: ["usage-events"],
    queryFn: () => fetch("/api/usage/events?limit=30").then((r) => r.json()),
  });

  const { data: current } = useQuery<BillingPeriod>({
    queryKey: ["billing-current"],
    queryFn: () => fetch("/api/billing/current").then((r) => r.json()),
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery<BillingInvoice[]>({
    queryKey: ["billing-invoices"],
    queryFn: () => fetch("/api/billing/invoices").then((r) => r.json()),
  });

  const maxQty = Math.max(...(current?.usageBreakdown ?? []).map((l) => l.quantity), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usage &amp; Billing</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor platform usage and track costs for the current billing period.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Executions this month"
          value={loadingSum ? "–" : (summary?.executionsThisMonth ?? 0).toLocaleString()}
          sub={`${(summary?.totalExecutions ?? 0).toLocaleString()} all-time`}
          icon={Zap}
        />
        <StatCard
          title="Active workflows"
          value={loadingSum ? "–" : (summary?.activeWorkflows ?? 0)}
          sub={`of ${summary?.totalWorkflows ?? 0} total`}
          icon={GitBranch}
        />
        <StatCard
          title="Connectors used"
          value={loadingSum ? "–" : (summary?.usedConnectors ?? 0)}
          sub={`of ${summary?.totalConnectors ?? 0} available`}
          icon={Cable}
        />
        <StatCard
          title="Current period cost"
          value={loadingSum ? "–" : `$${(summary?.currentPeriodCost ?? 0).toFixed(2)}`}
          sub={summary?.budgetLimit ? `$${summary.budgetLimit} budget` : undefined}
          icon={DollarSign}
          accent="text-primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp size={16} />
              Usage Breakdown — Current Period
            </CardTitle>
            {current && (
              <p className="text-xs text-muted-foreground">
                {formatDate(current.start, { month: "long", day: "numeric" })} –{" "}
                {formatDate(current.end, { month: "long", day: "numeric", year: "numeric" })}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {(current?.usageBreakdown ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No usage events this period.</p>
            ) : (
              current?.usageBreakdown.map((item) => {
                const cfg = EVENT_LABELS[item.label] ?? { label: item.label, color: "bg-muted-foreground" };
                return (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{cfg.label}</span>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>{item.quantity.toLocaleString()} × ${item.unitCost}</span>
                        <span className="font-semibold text-foreground">${item.total.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${cfg.color} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.round((item.quantity / maxQty) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
            {current && current.usageBreakdown.length > 0 && (
              <>
                <Separator />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span>${current.totalAmount.toFixed(2)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent events */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap size={16} />
              Recent Usage Events
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              {loadingEvents ? (
                <p className="text-sm text-muted-foreground p-4">Loading…</p>
              ) : events.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">No events yet.</p>
              ) : (
                <div className="divide-y">
                  {events.map((e) => {
                    const cfg = EVENT_LABELS[e.eventType] ?? { label: e.eventType, color: "bg-muted" };
                    return (
                      <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {e.workflowName ?? "Unknown workflow"}
                          </p>
                          <p className="text-xs text-muted-foreground">{cfg.label} · qty {e.quantity}</p>
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{formatTs(e.createdAt)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Invoice history */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt size={16} />
            Invoice History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingInvoices ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No past invoices.</p>
          ) : (
            <div className="divide-y">
              {invoices.map((inv) => {
                const st = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.draft;
                const StatusIcon = st.icon;
                return (
                  <div key={inv.id} className="py-3 flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {formatDate(inv.periodStart, { month: "long", year: "numeric" })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {inv.lineItems?.map((l) => (EVENT_LABELS[l.label]?.label ?? l.label)).join(" · ")}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1.5 text-sm ${st.className}`}>
                      <StatusIcon size={14} />
                      <span>{st.label}</span>
                    </div>
                    <span className="font-semibold text-sm w-20 text-right">${inv.totalAmount.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

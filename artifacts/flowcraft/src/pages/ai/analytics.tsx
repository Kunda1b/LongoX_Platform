import { useListTokenUsage, useGetAiUsageSummary } from "@autoflow/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, DollarSign, Activity } from "lucide-react";

const PROVIDER_COLORS: Record<string, string> = {
  openai: "bg-emerald-100 text-emerald-700",
  anthropic: "bg-orange-100 text-orange-700",
  google: "bg-blue-100 text-blue-700",
  mistral: "bg-indigo-100 text-indigo-700",
};

function fmtTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtCost(n: number) {
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

export default function AiAnalyticsPage() {
  const { data: summary } = useGetAiUsageSummary();
  const { data: usage = [], isLoading } = useListTokenUsage({});

  const byProvider = summary?.byProvider as Array<{ provider: string | null; inputTokens: number; outputTokens: number; cost: number; requests: number }> ?? [];
  const byModel = summary?.byModel as Array<{ modelName: string | null; provider: string | null; inputTokens: number; outputTokens: number; cost: number; requests: number }> ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Analytics</h1>
        <p className="text-muted-foreground mt-2">Token usage, costs, and model performance across all AI operations.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: fmtTokens(summary?.totalRequests ?? 0), icon: Activity, color: "text-blue-600" },
          { label: "Input Tokens", value: fmtTokens(summary?.totalInputTokens ?? 0), icon: Zap, color: "text-violet-600" },
          { label: "Output Tokens", value: fmtTokens(summary?.totalOutputTokens ?? 0), icon: Brain, color: "text-indigo-600" },
          { label: "Total Cost", value: fmtCost(summary?.totalCost ?? 0), icon: DollarSign, color: "text-green-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <Icon className={`h-8 w-8 opacity-70 ${color}`} />
              <div>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Provider */}
        <Card>
          <CardHeader><CardTitle className="text-base">Usage by Provider</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {byProvider.filter((p) => p.provider).map((p) => {
              const total = summary?.totalCost ?? 1;
              const pct = total > 0 ? (p.cost / total) * 100 : 0;
              return (
                <div key={p.provider}>
                  <div className="flex items-center justify-between mb-1">
                    <Badge className={`text-xs px-1.5 ${PROVIDER_COLORS[p.provider!] ?? "bg-muted text-muted-foreground"}`}>{p.provider}</Badge>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{p.requests} req</span>
                      <span className="font-medium text-foreground">{fmtCost(p.cost)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.max(pct, 1)}%` }} />
                  </div>
                </div>
              );
            })}
            {byProvider.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>}
          </CardContent>
        </Card>

        {/* By Model */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top Models by Cost</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {byModel.filter((m) => m.modelName).sort((a, b) => b.cost - a.cost).slice(0, 8).map((m) => (
                <div key={m.modelName} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div>
                    <div className="text-sm font-medium">{m.modelName}</div>
                    <div className="text-xs text-muted-foreground">{fmtTokens(m.inputTokens + m.outputTokens)} tokens · {m.requests} req</div>
                  </div>
                  <div className="text-sm font-semibold">{fmtCost(m.cost)}</div>
                </div>
              ))}
              {byModel.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Usage Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Usage Events</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 text-muted-foreground text-sm">Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Model</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Provider</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Input</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Output</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Cost</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {[...usage].reverse().slice(0, 20).map((u, i) => (
                    <tr key={u.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="px-4 py-2 font-medium text-xs">{u.modelName ?? "—"}</td>
                      <td className="px-4 py-2">
                        {u.provider && <Badge className={`text-[10px] px-1.5 ${PROVIDER_COLORS[u.provider] ?? "bg-muted text-muted-foreground"}`}>{u.provider}</Badge>}
                      </td>
                      <td className="px-4 py-2 text-right text-xs">{fmtTokens(u.inputTokens)}</td>
                      <td className="px-4 py-2 text-right text-xs">{fmtTokens(u.outputTokens)}</td>
                      <td className="px-4 py-2 text-right text-xs font-medium">{fmtCost(u.cost)}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {usage.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No usage recorded yet.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

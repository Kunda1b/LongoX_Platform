import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useListConnectors,
  useListConnectorCategories,
  useInstallConnector,
  getListConnectorsQueryKey,
} from "@workspace/api-client-react";
import type { Connector, ConnectorAction, ConnectorTrigger } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, CheckCircle2, Star, Zap, RefreshCw, Webhook,
  Shield, ShieldCheck, Key, Globe, Lock, ChevronDown, ChevronRight,
  Download, X,
} from "lucide-react";

// ─── Config ───────────────────────────────────────────────────────────────────

const CERT_CONFIG = {
  official:   { label: "Official",   Icon: ShieldCheck, cls: "bg-amber-100 text-amber-700 border-amber-200" },
  verified:   { label: "Verified",   Icon: ShieldCheck, cls: "bg-blue-100 text-blue-700 border-blue-200" },
  community:  { label: "Community",  Icon: Shield,      cls: "bg-gray-100 text-gray-600 border-gray-200" },
  deprecated: { label: "Deprecated", Icon: Shield,      cls: "bg-red-100 text-red-600 border-red-200" },
};

const AUTH_CONFIG = {
  oauth2: { label: "OAuth2",  Icon: Globe, cls: "text-purple-600" },
  apikey: { label: "API Key", Icon: Key,   cls: "text-orange-600" },
  jwt:    { label: "JWT",     Icon: Lock,  cls: "text-cyan-600" },
  basic:  { label: "Basic",   Icon: Lock,  cls: "text-gray-500" },
};

const CATEGORY_LABELS: Record<string, string> = {
  crm: "CRM", communication: "Communication", payments: "Payments",
  database: "Database", ai: "AI & ML", data: "Data", development: "Development",
};

function getHealthColor(healthStatus?: Record<string, unknown>) {
  if (!healthStatus?.availability) return "text-gray-400";
  const a = Number(healthStatus.availability);
  return a >= 99.9 ? "text-emerald-500" : a >= 99 ? "text-amber-400" : "text-red-500";
}

// ─── Expanded Connector Detail ────────────────────────────────────────────────

function ConnectorDetail({ conn, onInstall, onUninstall, installing }: {
  conn: Connector;
  onInstall: (id: number) => void;
  onUninstall: (id: number) => void;
  installing: boolean;
}) {
  const [actionsExpanded, setActionsExpanded] = useState(true);
  const [triggersExpanded, setTriggersExpanded] = useState(true);

  const { data: actions = [] } = useQuery<ConnectorAction[]>({
    queryKey: ["connectorActions", conn.id],
    queryFn: () => fetch(`/api/connectors/${conn.id}/actions`).then((r) => r.json()),
  });

  const { data: triggers = [] } = useQuery<ConnectorTrigger[]>({
    queryKey: ["connectorTriggers", conn.id],
    queryFn: () => fetch(`/api/connectors/${conn.id}/triggers`).then((r) => r.json()),
  });

  const certCfg = CERT_CONFIG[conn.certificationLevel as keyof typeof CERT_CONFIG] ?? CERT_CONFIG.community;
  const authCfg = AUTH_CONFIG[conn.authType as keyof typeof AUTH_CONFIG] ?? AUTH_CONFIG.apikey;

  return (
    <div className="border-t bg-muted/10 p-4 space-y-4">
      {/* Description + badges */}
      <p className="text-xs text-muted-foreground leading-relaxed">{conn.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {(conn.permissions ?? []).map((p) => (
          <code key={p} className="text-[0.65rem] bg-muted px-1.5 py-0.5 rounded font-mono">{p}</code>
        ))}
      </div>

      {/* Rate limit */}
      {conn.rateLimit && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Rate limit:</span>
          {Object.entries(conn.rateLimit).map(([k, v]) => (
            <span key={k}><span className="font-medium">{v}</span> {k.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div>
        <button
          className="flex items-center gap-1.5 text-xs font-semibold mb-2 text-muted-foreground hover:text-foreground"
          onClick={() => setActionsExpanded(!actionsExpanded)}
        >
          {actionsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          Actions ({actions.length})
        </button>
        {actionsExpanded && (
          <div className="space-y-1.5 ml-4">
            {actions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No actions defined</p>
            ) : actions.map((a) => (
              <div key={a.actionId} className="flex items-start gap-2">
                <Zap className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium">{a.name}</p>
                  <p className="text-[0.65rem] text-muted-foreground">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Triggers */}
      <div>
        <button
          className="flex items-center gap-1.5 text-xs font-semibold mb-2 text-muted-foreground hover:text-foreground"
          onClick={() => setTriggersExpanded(!triggersExpanded)}
        >
          {triggersExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          Triggers ({triggers.length})
        </button>
        {triggersExpanded && (
          <div className="space-y-1.5 ml-4">
            {triggers.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No triggers available</p>
            ) : triggers.map((t) => (
              <div key={t.triggerId} className="flex items-start gap-2">
                {t.triggerType === "webhook"
                  ? <Webhook className="h-3 w-3 text-violet-600 mt-0.5 shrink-0" />
                  : <RefreshCw className="h-3 w-3 text-blue-600 mt-0.5 shrink-0" />}
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium">{t.name}</p>
                    <Badge variant="outline" className={`text-[0.55rem] px-1 py-0 ${
                      t.triggerType === "webhook"
                        ? "bg-violet-50 text-violet-700 border-violet-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      {t.triggerType === "webhook" ? "webhook" : `poll ${t.pollingInterval}s`}
                    </Badge>
                  </div>
                  <p className="text-[0.65rem] text-muted-foreground">{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Install/Uninstall */}
      <div className="flex gap-2 pt-1">
        {conn.isInstalled ? (
          <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => onUninstall(conn.id)} disabled={installing}>
            <X className="h-3 w-3 mr-1" /> Uninstall
          </Button>
        ) : (
          <Button size="sm" className="h-7 text-xs"
            onClick={() => onInstall(conn.id)} disabled={installing}>
            <Download className="h-3 w-3 mr-1" /> {installing ? "Installing…" : "Install"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Connector Card ───────────────────────────────────────────────────────────

function ConnectorCard({ c, onInstall, onUninstall, installing }: {
  c: Connector;
  onInstall: (id: number) => void;
  onUninstall: (id: number) => void;
  installing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const certCfg = CERT_CONFIG[c.certificationLevel as keyof typeof CERT_CONFIG] ?? CERT_CONFIG.community;
  const authCfg = AUTH_CONFIG[c.authType as keyof typeof AUTH_CONFIG] ?? AUTH_CONFIG.apikey;
  const healthCls = getHealthColor(c.healthStatus);

  return (
    <div className="border rounded-lg bg-card hover:border-primary/30 transition-colors overflow-hidden">
      <div className="p-3 flex flex-col gap-2.5">
        {/* Top row */}
        <div className="flex items-start gap-2.5">
          <div
            className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: c.color ?? "#6366f1" }}
          >
            {c.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-sm">{c.name}</span>
              {c.version && <span className="text-[0.6rem] text-muted-foreground">v{c.version}</span>}
              {c.isInstalled && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
              {c.isFeatured && (
                <Badge className="text-[0.55rem] px-1 py-0 bg-violet-100 text-violet-700 border-violet-200">Featured</Badge>
              )}
            </div>
            <p className="text-[0.7rem] text-muted-foreground mt-0.5 line-clamp-1">{c.description}</p>
          </div>
        </div>

        {/* Badge row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className={`text-[0.55rem] px-1.5 py-0.5 flex items-center gap-0.5 ${certCfg.cls}`}>
            <certCfg.Icon className="h-2.5 w-2.5" />
            {certCfg.label}
          </Badge>
          <Badge variant="outline" className={`text-[0.55rem] px-1.5 py-0.5 flex items-center gap-0.5 border-transparent bg-transparent ${authCfg.cls}`}>
            <authCfg.Icon className="h-2.5 w-2.5" />
            {authCfg.label}
          </Badge>
          {(c.capabilities?.webhookTriggers) && (
            <Badge variant="outline" className="text-[0.55rem] px-1.5 py-0.5 bg-violet-50 text-violet-700 border-violet-200 flex items-center gap-0.5">
              <Webhook className="h-2.5 w-2.5" /> Webhooks
            </Badge>
          )}
          {(c.capabilities?.pollingTriggers) && (
            <Badge variant="outline" className="text-[0.55rem] px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-0.5">
              <RefreshCw className="h-2.5 w-2.5" /> Polling
            </Badge>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[0.7rem] text-muted-foreground">
          <span className="flex items-center gap-0.5"><Zap className="w-3 h-3 text-amber-500" />{c.actionCount} actions</span>
          <span className="flex items-center gap-0.5"><RefreshCw className="w-3 h-3 text-blue-500" />{c.triggerCount} triggers</span>
          {c.rating && (
            <span className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {c.rating.toFixed(1)}
            </span>
          )}
          <span className={`ml-auto flex items-center gap-1 font-medium ${healthCls}`}>
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${healthCls.replace("text-", "bg-")}`} />
            {c.healthStatus?.availability ? `${c.healthStatus.availability}%` : "—"}
          </span>
          <span>{((c.installCount ?? 0) / 1000).toFixed(1)}k</span>
        </div>

        {/* Expand toggle */}
        <button
          className="text-[0.7rem] text-primary flex items-center gap-1 hover:underline w-fit"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {expanded ? "Hide details" : "Show actions & triggers"}
        </button>
      </div>

      {expanded && (
        <ConnectorDetail
          conn={c}
          onInstall={onInstall}
          onUninstall={onUninstall}
          installing={installing}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConnectorsPage() {
  const qc = useQueryClient();
  const [category, setCategory] = useState("all");
  const [certLevel, setCertLevel] = useState("all");
  const [search, setSearch] = useState("");
  const [installingId, setInstallingId] = useState<number | null>(null);
  const [uninstallingId, setUninstallingId] = useState<number | null>(null);

  const connectors = useListConnectors({ category: category !== "all" ? category : undefined, search: search || undefined });
  const categories = useListConnectorCategories();
  const installMut = useInstallConnector();

  function handleInstall(id: number) {
    setInstallingId(id);
    installMut.mutate({ id }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListConnectorsQueryKey() }),
      onSettled: () => setInstallingId(null),
    });
  }

  async function handleUninstall(id: number) {
    setUninstallingId(id);
    await fetch(`/api/connectors/${id}/uninstall`, { method: "POST" });
    qc.invalidateQueries({ queryKey: getListConnectorsQueryKey() });
    setUninstallingId(null);
  }

  const CERT_FILTERS = [
    { key: "all", label: "All" },
    { key: "official", label: "Official" },
    { key: "verified", label: "Verified" },
    { key: "community", label: "Community" },
  ];

  const allConnectors = (connectors.data ?? []) as Connector[];
  const filtered = allConnectors.filter(
    (c) => certLevel === "all" || c.certificationLevel === certLevel
  );

  const categoryList = [
    { key: "all", label: "All" },
    ...(categories.data ?? []).map((c) => ({
      key: c.name,
      label: `${CATEGORY_LABELS[c.name] ?? c.name} (${c.count})`,
    })),
  ];

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-44 shrink-0 border-r bg-muted/20 py-4 flex flex-col">
        <div className="px-4 mb-1">
          <p className="text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-wider">Certification</p>
        </div>
        {CERT_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCertLevel(key)}
            className={`w-full text-left px-4 py-1 text-sm transition-colors ${
              certLevel === key ? "bg-primary/10 text-primary font-medium" : "text-foreground/70 hover:bg-accent"
            }`}
          >
            {label}
          </button>
        ))}

        <div className="mt-4 px-4 mb-1">
          <p className="text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-wider">Categories</p>
        </div>
        {categoryList.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`w-full text-left px-4 py-1 text-sm transition-colors ${
              category === key ? "bg-primary/10 text-primary font-medium" : "text-foreground/70 hover:bg-accent"
            }`}
          >
            {label}
          </button>
        ))}
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-lg font-semibold">Connector Registry</h1>
            <p className="text-xs text-muted-foreground">Production-grade integrations with actions, triggers &amp; health monitoring</p>
          </div>
          <div className="relative w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input className="pl-8 h-8 text-xs" placeholder="Search connectors…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Stats bar */}
        <div className="px-5 py-2 border-b flex items-center gap-6 text-xs text-muted-foreground bg-muted/20 shrink-0">
          <span><strong className="text-foreground">{allConnectors.length}</strong> connectors</span>
          <span><strong className="text-foreground">{allConnectors.filter((c) => c.isInstalled).length}</strong> installed</span>
          <span><strong className="text-foreground">{allConnectors.filter((c) => c.certificationLevel === "official").length}</strong> official</span>
          <span><strong className="text-foreground">{allConnectors.reduce((s, c) => s + c.actionCount, 0)}</strong> total actions</span>
          <span><strong className="text-foreground">{allConnectors.reduce((s, c) => s + c.triggerCount, 0)}</strong> total triggers</span>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {connectors.isLoading ? (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-sm text-muted-foreground">
              No connectors found matching your filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((c) => (
                <ConnectorCard
                  key={c.id}
                  c={c}
                  onInstall={handleInstall}
                  onUninstall={handleUninstall}
                  installing={installingId === c.id || uninstallingId === c.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

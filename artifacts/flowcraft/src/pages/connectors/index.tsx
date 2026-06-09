import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useListConnectors,
  useListConnectorCategories,
  useInstallConnector,
  getListConnectorsQueryKey,
} from "@workspace/api-client-react";
import type { Connector } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Search, Download, Check, Star, Plug, Zap, Webhook, RefreshCw,
  Shield, ShieldCheck, ShieldAlert, Key, Lock, Globe,
  ChevronDown, ChevronRight, Activity, AlertCircle, Clock,
  BarChart3, FileJson, ArrowRight, X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Local Types ──────────────────────────────────────────────────────────────

type ConnectorAction = {
  id: number; actionId: string; name: string; description: string;
  inputSchema: Record<string, unknown>; outputSchema: Record<string, unknown>; connectorId: number;
};
type ConnectorTrigger = {
  id: number; triggerId: string; triggerType: string; name: string; description: string;
  pollingInterval?: number | null; connectorId: number;
};
type ConnectorExecution = {
  id: number; connectorId: number; executionId: string;
  actionId?: string | null; triggerId?: string | null;
  status: "success" | "failed" | "timeout"; durationMs?: number | null; createdAt: string;
};

// ─── Types ────────────────────────────────────────────────────────────────────

const CERT_CONFIG = {
  official:   { label: "Official",   icon: ShieldCheck, color: "bg-amber-100 text-amber-700 border-amber-200" },
  verified:   { label: "Verified",   icon: ShieldCheck, color: "bg-blue-100 text-blue-700 border-blue-200" },
  community:  { label: "Community",  icon: Shield,      color: "bg-gray-100 text-gray-600 border-gray-200" },
  deprecated: { label: "Deprecated", icon: ShieldAlert, color: "bg-red-100 text-red-600 border-red-200" },
};

const AUTH_CONFIG = {
  oauth2:  { label: "OAuth2",   icon: Globe, color: "bg-purple-100 text-purple-700 border-purple-200" },
  apikey:  { label: "API Key",  icon: Key,   color: "bg-orange-100 text-orange-700 border-orange-200" },
  jwt:     { label: "JWT",      icon: Lock,  color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  basic:   { label: "Basic",    icon: Lock,  color: "bg-gray-100 text-gray-600 border-gray-200" },
};

function getHealthDot(healthStatus?: Record<string, unknown> | null) {
  if (!healthStatus || !healthStatus.availability) return "bg-gray-300";
  const avail = Number(healthStatus.availability);
  if (avail >= 99.9) return "bg-emerald-500";
  if (avail >= 99) return "bg-amber-400";
  return "bg-red-500";
}

// ─── Schema Field Renderer ────────────────────────────────────────────────────

function SchemaFields({ schema }: { schema: Record<string, unknown> }) {
  const props = (schema.properties as Record<string, Record<string, unknown>>) ?? {};
  const required = (schema.required as string[]) ?? [];
  const entries = Object.entries(props);
  if (entries.length === 0) return <p className="text-xs text-muted-foreground italic">No fields defined</p>;
  return (
    <div className="space-y-1.5">
      {entries.map(([key, def]) => (
        <div key={key} className="flex items-start gap-2 text-xs">
          <code className="bg-muted px-1.5 py-0.5 rounded text-[0.7rem] font-mono shrink-0">{key}</code>
          <span className="text-muted-foreground">{String(def.type ?? "any")}</span>
          {required.includes(key) && <span className="text-red-500 text-[0.65rem] font-medium">required</span>}
          {!!def.description && <span className="text-muted-foreground opacity-70 truncate">{String(def.description)}</span>}
        </div>
      ))}
    </div>
  );
}

// ─── Connector Detail Dialog ──────────────────────────────────────────────────

function ConnectorDetailDialog({
  connector,
  onClose,
  onInstall,
  onUninstall,
  installing,
}: {
  connector: Connector;
  onClose: () => void;
  onInstall: (id: number) => void;
  onUninstall: (id: number) => void;
  installing: boolean;
}) {
  const [expandedAction, setExpandedAction] = useState<string | null>(null);

  const { data: actions = [] } = useQuery<ConnectorAction[]>({
    queryKey: ["connectorActions", connector.id],
    queryFn: () => fetch(`/api/connectors/${connector.id}/actions`).then((r) => r.json()),
  });

  const { data: triggers = [] } = useQuery<ConnectorTrigger[]>({
    queryKey: ["connectorTriggers", connector.id],
    queryFn: () => fetch(`/api/connectors/${connector.id}/triggers`).then((r) => r.json()),
  });

  const { data: executions = [] } = useQuery<ConnectorExecution[]>({
    queryKey: ["connectorExecutions", connector.id],
    queryFn: () => fetch(`/api/connectors/executions?connectorId=${connector.id}&limit=20`).then((r) => r.json()),
  });

  const cert = CERT_CONFIG[connector.certificationLevel as keyof typeof CERT_CONFIG] ?? CERT_CONFIG.community;
  const auth = AUTH_CONFIG[connector.authType as keyof typeof AUTH_CONFIG] ?? AUTH_CONFIG.apikey;
  const CertIcon = cert.icon;
  const AuthIcon = auth.icon;

  const successCount = executions.filter((e) => e.status === "success").length;
  const failedCount = executions.filter((e) => e.status === "failed").length;
  const avgLatency = executions.length
    ? Math.round(executions.reduce((s, e) => s + (e.durationMs ?? 0), 0) / executions.length)
    : null;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-full sm:max-w-2xl max-h-[92dvh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <DialogHeader>
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shrink-0"
                style={{ backgroundColor: connector.color || "#6366f1" }}
              >
                {connector.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-xl">{connector.displayName ?? connector.name}</DialogTitle>
                  <Badge variant="outline" className="text-[0.65rem] px-1.5">v{connector.version}</Badge>
                </div>
                <DialogDescription className="mt-0.5">by {connector.author}</DialogDescription>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="outline" className={`text-[0.65rem] px-1.5 py-0.5 flex items-center gap-1 ${cert.color}`}>
                    <CertIcon className="h-2.5 w-2.5" />
                    {cert.label}
                  </Badge>
                  <Badge variant="outline" className={`text-[0.65rem] px-1.5 py-0.5 flex items-center gap-1 ${auth.color}`}>
                    <AuthIcon className="h-2.5 w-2.5" />
                    {auth.label}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className={`w-2 h-2 rounded-full ${getHealthDot(connector.healthStatus)}`} />
                    {connector.healthStatus?.availability ? `${connector.healthStatus.availability}% uptime` : "Status unknown"}
                  </div>
                </div>
              </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                {connector.isInstalled ? (
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 whitespace-nowrap" onClick={() => onUninstall(connector.id)}>
                    <X className="h-3.5 w-3.5 mr-1" /> Uninstall
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => onInstall(connector.id)} disabled={installing} className="whitespace-nowrap">
                    <Download className="h-3.5 w-3.5 mr-1" /> {installing ? "Installing…" : "Install"}
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto border-b">
            <TabsList className="px-4 sm:px-6 justify-start rounded-none bg-transparent h-10 gap-1 w-max min-w-full">
              <TabsTrigger value="overview" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none whitespace-nowrap">Overview</TabsTrigger>
              <TabsTrigger value="actions" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none whitespace-nowrap">
                Actions <Badge className="ml-1 text-[0.6rem] px-1 py-0">{actions.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="triggers" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none whitespace-nowrap">
                Triggers <Badge className="ml-1 text-[0.6rem] px-1 py-0">{triggers.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="health" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none whitespace-nowrap">Health</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6 space-y-5 mt-0">
              <p className="text-sm text-muted-foreground leading-relaxed">{connector.description}</p>

              {/* Capabilities */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Capabilities</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(connector.capabilities ?? {}).filter(([, v]) => v).map(([cap]) => (
                    <Badge key={cap} variant="secondary" className="text-[0.7rem]">
                      {cap.replace(/([A-Z])/g, " $1").trim()}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              {(connector.permissions?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Required Permissions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {connector.permissions?.map((p) => (
                      <code key={p} className="bg-muted text-xs px-2 py-0.5 rounded font-mono">{p}</code>
                    ))}
                  </div>
                </div>
              )}

              {/* Rate Limit */}
              {connector.rateLimit && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Rate Limits</p>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(connector.rateLimit).map(([key, val]) => (
                      <div key={key} className="bg-muted/50 rounded-lg p-3">
                        <p className="text-lg font-bold">{String(val)}</p>
                        <p className="text-xs text-muted-foreground">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Auth Config */}
              {connector.authConfig && Object.keys(connector.authConfig).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Auth Configuration</p>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                    {Object.entries(connector.authConfig)
                      .filter(([k]) => k !== "scopes")
                      .map(([k, v]) => (
                        <div key={k} className="flex items-start gap-2 text-xs">
                          <span className="text-muted-foreground shrink-0 capitalize">{k.replace(/([A-Z])/g, " $1")}:</span>
                          <span className="font-mono truncate">{String(v)}</span>
                        </div>
                      ))}
                    {Array.isArray((connector.authConfig as Record<string,unknown>).scopes) && (
                      <div className="flex gap-1.5 flex-wrap mt-1">
                        {((connector.authConfig as Record<string,unknown>).scopes as string[]).map((s) => (
                          <Badge key={s} variant="outline" className="text-[0.65rem]">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Actions Tab */}
            <TabsContent value="actions" className="p-6 space-y-3 mt-0">
              {actions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No actions defined for this connector.</p>
              ) : actions.map((action) => (
                <div key={action.actionId} className="border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => setExpandedAction(expandedAction === action.actionId ? null : action.actionId)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Zap className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{action.name}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                    {expandedAction === action.actionId
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>
                  {expandedAction === action.actionId && (
                    <div className="px-4 pb-4 pt-2 border-t bg-muted/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Input Schema</p>
                        <SchemaFields schema={action.inputSchema} />
                      </div>
                      <div>
                        <p className="text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Output Schema</p>
                        <SchemaFields schema={action.outputSchema} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>

            {/* Triggers Tab */}
            <TabsContent value="triggers" className="p-6 space-y-3 mt-0">
              {triggers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No triggers available for this connector.</p>
                  <p className="text-xs text-muted-foreground mt-1">Use actions to interact with this service.</p>
                </div>
              ) : triggers.map((trigger) => (
                <div key={trigger.triggerId} className="border rounded-lg p-3 flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                    trigger.triggerType === "webhook" ? "bg-violet-100" : "bg-blue-100"
                  }`}>
                    {trigger.triggerType === "webhook"
                      ? <Webhook className="h-3.5 w-3.5 text-violet-600" />
                      : <RefreshCw className="h-3.5 w-3.5 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{trigger.name}</p>
                      <Badge variant="outline" className={`text-[0.65rem] px-1.5 ${
                        trigger.triggerType === "webhook"
                          ? "bg-violet-50 text-violet-700 border-violet-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}>
                        {trigger.triggerType === "webhook" ? "Webhook" : "Polling"}
                      </Badge>
                      {trigger.pollingInterval && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> every {trigger.pollingInterval}s
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{trigger.description}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Health Tab */}
            <TabsContent value="health" className="p-6 space-y-5 mt-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{successCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Successful Executions</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-red-500">{failedCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Failed Executions</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold">{avgLatency ? `${avgLatency}ms` : "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Avg Latency</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {connector.healthStatus?.availability ? `${connector.healthStatus.availability}%` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Availability</p>
                </div>
              </div>

              {connector.healthStatus && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Health Metrics</p>
                  <div className="space-y-2">
                    {connector.healthStatus.apiErrorRate !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">API Error Rate</span>
                        <span className={`font-medium ${Number(connector.healthStatus.apiErrorRate) > 0.01 ? "text-red-500" : "text-emerald-600"}`}>
                          {(Number(connector.healthStatus.apiErrorRate) * 100).toFixed(2)}%
                        </span>
                      </div>
                    )}
                    {connector.healthStatus.oauthFailureRate !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">OAuth Failure Rate</span>
                        <span className={`font-medium ${Number(connector.healthStatus.oauthFailureRate) > 0.01 ? "text-red-500" : "text-emerald-600"}`}>
                          {(Number(connector.healthStatus.oauthFailureRate) * 100).toFixed(2)}%
                        </span>
                      </div>
                    )}
                    {connector.healthStatus.avgLatencyMs !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Avg API Latency</span>
                        <span className="font-medium">{String(connector.healthStatus.avgLatencyMs)}ms</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {executions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Executions</p>
                  <div className="space-y-1.5">
                    {executions.slice(0, 8).map((ex) => (
                      <div key={ex.id} className="flex items-center gap-2 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${ex.status === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
                        <span className="text-muted-foreground font-mono truncate">{ex.actionId ?? ex.triggerId ?? "—"}</span>
                        <span className="text-muted-foreground ml-auto">{ex.durationMs ? `${ex.durationMs}ms` : "—"}</span>
                        <span className={`capitalize ${ex.status === "success" ? "text-emerald-600" : "text-red-500"}`}>{ex.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ─── Connector Card ───────────────────────────────────────────────────────────

function ConnectorCard({
  conn, onInstall, onSelect, installing,
}: {
  conn: Connector;
  onInstall: (id: number) => void;
  onSelect: (conn: Connector) => void;
  installing: boolean;
}) {
  const cert = CERT_CONFIG[conn.certificationLevel as keyof typeof CERT_CONFIG] ?? CERT_CONFIG.community;
  const auth = AUTH_CONFIG[conn.authType as keyof typeof AUTH_CONFIG] ?? AUTH_CONFIG.apikey;
  const CertIcon = cert.icon;
  const AuthIcon = auth.icon;
  const healthDot = getHealthDot(conn.healthStatus);

  const caps = conn.capabilities ?? {};

  return (
    <Card
      className="flex flex-col cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
      onClick={() => onSelect(conn)}
    >
      <CardContent className="p-5 flex-1 flex flex-col gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: conn.color || "#6366f1" }}
            >
              {conn.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-semibold text-sm truncate">{conn.name}</p>
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${healthDot}`} />
              </div>
              <p className="text-xs text-muted-foreground">{conn.author}</p>
            </div>
          </div>
          {conn.isInstalled ? (
            <div className="bg-emerald-500/10 text-emerald-600 text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1 shrink-0">
              <Check className="h-3 w-3" /> Installed
            </div>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs shrink-0"
              onClick={(e) => { e.stopPropagation(); onInstall(conn.id); }}
              disabled={installing}
            >
              <Download className="h-3 w-3 mr-1" />
              {installing ? "…" : "Install"}
            </Button>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className={`text-[0.6rem] px-1.5 py-0.5 flex items-center gap-0.5 ${cert.color}`}>
            <CertIcon className="h-2.5 w-2.5" />
            {cert.label}
          </Badge>
          <Badge variant="outline" className={`text-[0.6rem] px-1.5 py-0.5 flex items-center gap-0.5 ${auth.color}`}>
            <AuthIcon className="h-2.5 w-2.5" />
            {auth.label}
          </Badge>
          {!!(caps as Record<string, unknown>).webhookTriggers && (
            <Badge variant="outline" className="text-[0.6rem] px-1.5 py-0.5 bg-violet-50 text-violet-700 border-violet-200 flex items-center gap-0.5">
              <Webhook className="h-2.5 w-2.5" /> Webhooks
            </Badge>
          )}
          {!!(caps as Record<string, unknown>).pagination && (
            <Badge variant="outline" className="text-[0.6rem] px-1.5 py-0.5 bg-sky-50 text-sky-700 border-sky-200">
              Pagination
            </Badge>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{conn.description}</p>

        {/* Stats footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-0.5">
              <Zap className="h-3 w-3 text-amber-500" />
              {conn.actionCount}
            </span>
            <span className="flex items-center gap-0.5">
              <RefreshCw className="h-3 w-3 text-blue-500" />
              {conn.triggerCount}
            </span>
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {conn.rating?.toFixed(1) ?? "—"}
            </span>
          </div>
          <span>{((conn.installCount ?? 0) / 1000).toFixed(1)}k installs</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Connectors() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>();
  const [certLevel, setCertLevel] = useState("all");
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [installingId, setInstallingId] = useState<number | null>(null);
  const [uninstallingId, setUninstallingId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useListConnectorCategories();
  const { data: connectors = [], isLoading } = useListConnectors({ search, category });

  const installMutation = useInstallConnector({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListConnectorsQueryKey() });
        if (selectedConnector?.id === data.id) {
          setSelectedConnector(data);
        }
        toast({ title: "Connector installed", description: `${data.name} is ready to use in workflows.` });
        setInstallingId(null);
      },
      onError: () => setInstallingId(null),
    },
  });

  function handleInstall(id: number) {
    setInstallingId(id);
    installMutation.mutate({ id });
  }

  async function handleUninstall(id: number) {
    setUninstallingId(id);
    try {
      const res = await fetch(`/api/connectors/${id}/uninstall`, { method: "POST" });
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: getListConnectorsQueryKey() });
      if (selectedConnector?.id === id) setSelectedConnector(data);
      toast({ title: "Connector uninstalled" });
    } finally {
      setUninstallingId(null);
    }
  }

  const CERT_TABS = [
    { key: "all", label: "All" },
    { key: "official", label: "Official" },
    { key: "verified", label: "Verified" },
    { key: "community", label: "Community" },
    { key: "deprecated", label: "Deprecated" },
  ];

  const filtered = connectors.filter((c) =>
    certLevel === "all" || c.certificationLevel === certLevel
  );

  const installedCount = connectors.filter((c) => c.isInstalled).length;

  return (
    <div className="flex h-full gap-0 max-w-[1400px] mx-auto w-full">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 border-r flex flex-col py-4 hidden md:flex">
        <div className="px-4 mb-2">
          <p className="text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-wider">Categories</p>
        </div>
        <button
          onClick={() => setCategory(undefined)}
          className={`w-full text-left px-4 py-1.5 text-sm transition-colors ${!category ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}
        >
          All Connectors
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setCategory(cat.name)}
            className={`w-full flex items-center justify-between px-4 py-1.5 text-sm transition-colors capitalize ${category === cat.name ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}
          >
            <span>{cat.name}</span>
            <span className="text-xs opacity-60">{cat.count}</span>
          </button>
        ))}

        <div className="mt-auto px-4 pt-4 border-t">
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Installed</span>
              <span className="font-medium">{installedCount} / {connectors.length}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{ width: connectors.length ? `${(installedCount / connectors.length) * 100}%` : "0%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="px-6 pt-5 pb-0 border-b space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Connector Marketplace</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Production-grade integrations with full action &amp; trigger support</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search connectors…"
                className="pl-9 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Mobile-only category select (sidebar hidden on mobile) */}
          <div className="md:hidden">
            <Select value={category ?? "all"} onValueChange={(v) => setCategory(v === "all" ? undefined : v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Connectors</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.name} value={cat.name} className="capitalize">
                    {cat.name} ({cat.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Certification level tabs */}
          <div className="flex gap-0.5 overflow-x-auto -mx-px">
            {CERT_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCertLevel(tab.key)}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  certLevel === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-52 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 text-center py-20 border border-dashed rounded-xl">
              <div className="bg-muted text-foreground flex size-12 shrink-0 items-center justify-center rounded-lg">
                <Plug className="size-6" />
              </div>
              <div>
                <p className="font-medium">No connectors found</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different category or certification filter.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((conn) => (
                <ConnectorCard
                  key={conn.id}
                  conn={conn}
                  onInstall={handleInstall}
                  onSelect={setSelectedConnector}
                  installing={installingId === conn.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      {selectedConnector && (
        <ConnectorDetailDialog
          connector={selectedConnector}
          onClose={() => setSelectedConnector(null)}
          onInstall={handleInstall}
          onUninstall={handleUninstall}
          installing={installingId === selectedConnector.id || uninstallingId === selectedConnector.id}
        />
      )}
    </div>
  );
}

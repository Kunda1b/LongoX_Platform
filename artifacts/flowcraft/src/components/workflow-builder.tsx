import { useCallback, useRef, useState, useMemo, DragEvent, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type NodeTypes,
  type Node,
  type Edge,
  Handle,
  Position,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Zap,
  Blocks,
  Cpu,
  Database,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Save,
  Plus,
  Trash2,
  X,
  Settings2,
} from "lucide-react";
import { useUpdateWorkflow } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import type { NodeType } from "@workspace/api-client-react";
import type { WorkflowNode } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

// ─── Category meta ───────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  string,
  { color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  trigger: {
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/40",
    icon: <Zap className="h-3.5 w-3.5" />,
  },
  action: {
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/40",
    icon: <Blocks className="h-3.5 w-3.5" />,
  },
  logic: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/40",
    icon: <Cpu className="h-3.5 w-3.5" />,
  },
  ai: {
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/40",
    icon: <BrainCircuit className="h-3.5 w-3.5" />,
  },
  data: {
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/40",
    icon: <Database className="h-3.5 w-3.5" />,
  },
};

// ─── Node config field definitions ───────────────────────────────────────────

type FieldType = "text" | "textarea" | "select" | "number" | "password";

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: { label: string; value: string }[];
  hint?: string;
}

const NODE_FIELDS: Record<string, FieldDef[]> = {
  "trigger.schedule": [
    {
      key: "interval",
      label: "Interval",
      type: "select",
      options: [
        { label: "Every minute", value: "1m" },
        { label: "Every 5 minutes", value: "5m" },
        { label: "Every 15 minutes", value: "15m" },
        { label: "Every hour", value: "1h" },
        { label: "Daily at midnight", value: "daily" },
        { label: "Weekly (Monday)", value: "weekly" },
        { label: "Custom cron", value: "custom" },
      ],
    },
    { key: "cron", label: "Cron expression (if Custom)", type: "text", placeholder: "0 9 * * 1-5" },
    { key: "timezone", label: "Timezone", type: "text", placeholder: "UTC" },
  ],
  "trigger.webhook": [
    {
      key: "method",
      label: "HTTP Method",
      type: "select",
      options: [
        { label: "POST", value: "POST" },
        { label: "GET", value: "GET" },
        { label: "PUT", value: "PUT" },
        { label: "PATCH", value: "PATCH" },
      ],
    },
    { key: "path", label: "Path suffix", type: "text", placeholder: "/my-hook" },
    {
      key: "auth",
      label: "Authentication",
      type: "select",
      options: [
        { label: "None", value: "none" },
        { label: "API Key (header)", value: "api_key" },
        { label: "Basic Auth", value: "basic" },
        { label: "HMAC Signature", value: "hmac" },
      ],
    },
  ],
  "trigger.email": [
    { key: "inbox", label: "Inbox / address", type: "text", placeholder: "support@example.com" },
    { key: "subject_filter", label: "Subject contains", type: "text", placeholder: "Optional filter" },
    {
      key: "mark_read",
      label: "Mark as read",
      type: "select",
      options: [
        { label: "Yes", value: "true" },
        { label: "No", value: "false" },
      ],
    },
  ],
  "trigger.form": [
    { key: "form_id", label: "Form ID", type: "text", placeholder: "form_abc123" },
    { key: "success_redirect", label: "Success redirect URL", type: "text", placeholder: "https://..." },
  ],
  "trigger.manual": [],
  "action.http": [
    { key: "url", label: "URL", type: "text", placeholder: "https://api.example.com/endpoint" },
    {
      key: "method",
      label: "Method",
      type: "select",
      options: [
        { label: "GET", value: "GET" },
        { label: "POST", value: "POST" },
        { label: "PUT", value: "PUT" },
        { label: "PATCH", value: "PATCH" },
        { label: "DELETE", value: "DELETE" },
      ],
    },
    { key: "headers", label: "Headers (JSON)", type: "textarea", placeholder: '{"Authorization": "Bearer {{token}}"}' },
    { key: "body", label: "Request body (JSON)", type: "textarea", placeholder: '{"key": "{{value}}"}' },
    {
      key: "timeout",
      label: "Timeout (seconds)",
      type: "number",
      placeholder: "30",
    },
  ],
  "action.send_email": [
    { key: "to", label: "To", type: "text", placeholder: "user@example.com or {{email}}" },
    { key: "subject", label: "Subject", type: "text", placeholder: "Hello {{name}}" },
    { key: "body", label: "Body (HTML or plain)", type: "textarea", placeholder: "<p>Hi {{name}},</p>" },
    { key: "from_name", label: "From name", type: "text", placeholder: "My App" },
    { key: "reply_to", label: "Reply-to", type: "text", placeholder: "no-reply@example.com" },
  ],
  "action.slack": [
    { key: "channel", label: "Channel", type: "text", placeholder: "#general or @username" },
    { key: "message", label: "Message", type: "textarea", placeholder: "Hello from FlowCraft! 🚀" },
    { key: "username", label: "Bot username", type: "text", placeholder: "FlowCraft Bot" },
    { key: "icon_emoji", label: "Icon emoji", type: "text", placeholder: ":robot_face:" },
  ],
  "action.db_query": [
    { key: "connection", label: "Connection name", type: "text", placeholder: "my-postgres" },
    {
      key: "operation",
      label: "Operation",
      type: "select",
      options: [
        { label: "SELECT", value: "select" },
        { label: "INSERT", value: "insert" },
        { label: "UPDATE", value: "update" },
        { label: "DELETE", value: "delete" },
        { label: "Raw SQL", value: "raw" },
      ],
    },
    { key: "query", label: "SQL query", type: "textarea", placeholder: "SELECT * FROM users WHERE id = {{userId}}" },
  ],
  "action.spreadsheet": [
    { key: "spreadsheet_id", label: "Spreadsheet ID", type: "text", placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" },
    { key: "sheet_name", label: "Sheet name", type: "text", placeholder: "Sheet1" },
    {
      key: "operation",
      label: "Operation",
      type: "select",
      options: [
        { label: "Append row", value: "append" },
        { label: "Update row", value: "update" },
        { label: "Read rows", value: "read" },
        { label: "Delete row", value: "delete" },
      ],
    },
    { key: "row_data", label: "Row data (JSON)", type: "textarea", placeholder: '{"Name": "{{name}}", "Email": "{{email}}"}' },
  ],
  "action.create_record": [
    { key: "object_type", label: "Object type", type: "text", placeholder: "Contact, Deal, Lead…" },
    { key: "fields", label: "Fields (JSON)", type: "textarea", placeholder: '{"firstName": "{{first}}", "email": "{{email}}"}' },
    { key: "connection", label: "Connection name", type: "text", placeholder: "my-crm" },
  ],
  "logic.if": [
    { key: "field", label: "Field / expression", type: "text", placeholder: "{{user.age}}" },
    {
      key: "operator",
      label: "Operator",
      type: "select",
      options: [
        { label: "equals", value: "eq" },
        { label: "not equals", value: "neq" },
        { label: "greater than", value: "gt" },
        { label: "less than", value: "lt" },
        { label: "contains", value: "contains" },
        { label: "is empty", value: "empty" },
        { label: "is not empty", value: "not_empty" },
      ],
    },
    { key: "value", label: "Value", type: "text", placeholder: "18" },
  ],
  "logic.filter": [
    { key: "field", label: "Field / expression", type: "text", placeholder: "{{status}}" },
    {
      key: "operator",
      label: "Operator",
      type: "select",
      options: [
        { label: "equals", value: "eq" },
        { label: "not equals", value: "neq" },
        { label: "contains", value: "contains" },
        { label: "is empty", value: "empty" },
      ],
    },
    { key: "value", label: "Value to match", type: "text", placeholder: "active" },
  ],
  "logic.router": [
    { key: "routes", label: "Number of routes", type: "number", placeholder: "2" },
  ],
  "logic.loop": [
    { key: "array_field", label: "Array expression", type: "text", placeholder: "{{items}}" },
    { key: "batch_size", label: "Batch size (0 = one at a time)", type: "number", placeholder: "0" },
  ],
  "logic.delay": [
    { key: "duration", label: "Duration", type: "number", placeholder: "5" },
    {
      key: "unit",
      label: "Unit",
      type: "select",
      options: [
        { label: "Seconds", value: "seconds" },
        { label: "Minutes", value: "minutes" },
        { label: "Hours", value: "hours" },
        { label: "Days", value: "days" },
      ],
    },
  ],
  "logic.merge": [],
  "logic.sub_workflow": [
    { key: "workflow_id", label: "Workflow ID", type: "number", placeholder: "42" },
    { key: "input_mapping", label: "Input mapping (JSON)", type: "textarea", placeholder: '{"userId": "{{id}}"}' },
  ],
  "ai.llm": [
    {
      key: "model",
      label: "Model",
      type: "select",
      options: [
        { label: "GPT-4o", value: "gpt-4o" },
        { label: "GPT-4o mini", value: "gpt-4o-mini" },
        { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-20241022" },
        { label: "Claude 3 Haiku", value: "claude-3-haiku-20240307" },
        { label: "Gemini 1.5 Pro", value: "gemini-1.5-pro" },
        { label: "Gemini 1.5 Flash", value: "gemini-1.5-flash" },
      ],
    },
    { key: "system_prompt", label: "System prompt", type: "textarea", placeholder: "You are a helpful assistant…" },
    { key: "user_prompt", label: "User prompt", type: "textarea", placeholder: "Summarise: {{text}}" },
    { key: "temperature", label: "Temperature (0–2)", type: "number", placeholder: "0.7" },
    { key: "max_tokens", label: "Max tokens", type: "number", placeholder: "1024" },
  ],
  "ai.classify": [
    { key: "input_field", label: "Input expression", type: "text", placeholder: "{{email.body}}" },
    { key: "categories", label: "Categories (comma-separated)", type: "text", placeholder: "Billing, Technical, Sales, Other" },
    {
      key: "model",
      label: "Model",
      type: "select",
      options: [
        { label: "GPT-4o mini", value: "gpt-4o-mini" },
        { label: "GPT-4o", value: "gpt-4o" },
        { label: "Claude 3 Haiku", value: "claude-3-haiku-20240307" },
      ],
    },
  ],
  "ai.summarize": [
    { key: "input_field", label: "Input expression", type: "text", placeholder: "{{document.text}}" },
    { key: "max_length", label: "Max length (words)", type: "number", placeholder: "150" },
    {
      key: "format",
      label: "Format",
      type: "select",
      options: [
        { label: "Paragraph", value: "paragraph" },
        { label: "Bullet points", value: "bullets" },
        { label: "One sentence", value: "sentence" },
      ],
    },
    {
      key: "model",
      label: "Model",
      type: "select",
      options: [
        { label: "GPT-4o mini", value: "gpt-4o-mini" },
        { label: "GPT-4o", value: "gpt-4o" },
        { label: "Claude 3 Haiku", value: "claude-3-haiku-20240307" },
      ],
    },
  ],
  "ai.extract": [
    { key: "input_field", label: "Input expression", type: "text", placeholder: "{{email.body}}" },
    { key: "schema", label: "Output schema (JSON)", type: "textarea", placeholder: '{"name": "string", "amount": "number"}' },
    {
      key: "model",
      label: "Model",
      type: "select",
      options: [
        { label: "GPT-4o", value: "gpt-4o" },
        { label: "GPT-4o mini", value: "gpt-4o-mini" },
        { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-20241022" },
      ],
    },
  ],
  "ai.agent": [
    { key: "goal", label: "Goal / instructions", type: "textarea", placeholder: "Research the company {{name}} and return key info as JSON." },
    {
      key: "model",
      label: "Model",
      type: "select",
      options: [
        { label: "GPT-4o", value: "gpt-4o" },
        { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-20241022" },
        { label: "Gemini 1.5 Pro", value: "gemini-1.5-pro" },
      ],
    },
    { key: "max_steps", label: "Max steps", type: "number", placeholder: "10" },
  ],
  "ai.scraper": [
    { key: "url", label: "URL", type: "text", placeholder: "https://example.com or {{url}}" },
    { key: "instructions", label: "What to extract", type: "textarea", placeholder: "Extract all product names and prices." },
    {
      key: "output_format",
      label: "Output format",
      type: "select",
      options: [
        { label: "JSON", value: "json" },
        { label: "Markdown", value: "markdown" },
        { label: "Plain text", value: "text" },
      ],
    },
  ],
  "data.transform": [
    { key: "expression", label: "Transform expression (JS)", type: "textarea", placeholder: "return { fullName: input.first + ' ' + input.last };" },
    { key: "output_field", label: "Output field name", type: "text", placeholder: "transformed" },
  ],
  "data.code": [
    { key: "code", label: "JavaScript code", type: "textarea", placeholder: "const result = items.map(i => ({ ...i, processed: true }));\nreturn result;" },
    { key: "timeout", label: "Timeout (seconds)", type: "number", placeholder: "10" },
  ],
  "data.parse_doc": [
    { key: "file_field", label: "File expression", type: "text", placeholder: "{{attachment.url}}" },
    {
      key: "output",
      label: "Extract",
      type: "select",
      options: [
        { label: "Text only", value: "text" },
        { label: "Tables only", value: "tables" },
        { label: "Text + tables", value: "both" },
      ],
    },
  ],
  "data.store_get": [
    { key: "key", label: "Variable key", type: "text", placeholder: "user_score" },
    { key: "default_value", label: "Default if missing", type: "text", placeholder: "0" },
  ],
  "data.store_set": [
    { key: "key", label: "Variable key", type: "text", placeholder: "user_score" },
    { key: "value", label: "Value expression", type: "text", placeholder: "{{result.score}}" },
  ],
  "data.note": [
    { key: "content", label: "Note content", type: "textarea", placeholder: "Explain what this section does…" },
  ],
};

// ─── Flow node component ──────────────────────────────────────────────────────

const HANDLE_STYLE = { width: 10, height: 10, borderRadius: "50%", border: "2px solid" };

const HANDLE_COLORS: Record<string, string> = {
  trigger: "#22d3ee", action: "#818cf8", logic: "#fbbf24", ai: "#c084fc", data: "#60a5fa",
};

function FlowNode({ data, selected }: { data: any; selected: boolean }) {
  const meta = CATEGORY_META[data.category] ?? CATEGORY_META.action;
  const hc = HANDLE_COLORS[data.category as string] ?? "#818cf8";

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card shadow-md min-w-[220px] max-w-[240px] transition-all cursor-pointer",
        selected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "hover:shadow-lg",
        meta.border, "border"
      )}
    >
      {data.inputs > 0 && (
        <Handle type="target" position={Position.Left}
          style={{ ...HANDLE_STYLE, borderColor: hc, backgroundColor: "#1e1e2e", left: -6 }} />
      )}
      <div className={cn("px-3 py-2 rounded-t-lg flex items-center gap-2", meta.bg)}>
        <span className={cn("p-1 rounded", meta.bg, meta.color)}>{meta.icon}</span>
        <span className="font-semibold text-xs truncate flex-1">{data.label}</span>
        <Badge variant="outline"
          className={cn("text-[9px] px-1.5 py-0 uppercase tracking-wide", meta.color, meta.border)}>
          {data.category}
        </Badge>
      </div>
      <div className="px-3 py-2">
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{data.description}</p>
        {data.nodeTypeName && (
          <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono">{data.nodeTypeName}</p>
        )}
        {data.config && Object.keys(data.config).filter(k => data.config[k]).length > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <Settings2 className="h-2.5 w-2.5 text-muted-foreground/40" />
            <span className="text-[9px] text-muted-foreground/40">
              {Object.keys(data.config).filter(k => data.config[k]).length} field(s) configured
            </span>
          </div>
        )}
      </div>
      {data.outputs > 0 && (
        <Handle type="source" position={Position.Right}
          style={{ ...HANDLE_STYLE, borderColor: hc, backgroundColor: "#1e1e2e", right: -6 }} />
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = { flowNode: FlowNode };

// ─── Config panel ─────────────────────────────────────────────────────────────

interface ConfigPanelProps {
  node: Node | null;
  onClose: () => void;
  onChange: (nodeId: string, label: string, config: Record<string, string>) => void;
}

function ConfigPanel({ node, onClose, onChange }: ConfigPanelProps) {
  const [label, setLabel] = useState("");
  const [config, setConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    if (node) {
      setLabel((node.data.label as string) ?? "");
      setConfig((node.data.config as Record<string, string>) ?? {});
    }
  }, [node?.id]);

  if (!node) return null;

  const nodeTypeId = node.data.nodeTypeId as string;
  const fields = NODE_FIELDS[nodeTypeId] ?? [];
  const meta = CATEGORY_META[node.data.category as string] ?? CATEGORY_META.action;

  const handleFieldChange = (key: string, value: string) => {
    const next = { ...config, [key]: value };
    setConfig(next);
    onChange(node.id, label, next);
  };

  const handleLabelChange = (val: string) => {
    setLabel(val);
    onChange(node.id, val, config);
  };

  return (
    <div className="w-72 shrink-0 border-l bg-card flex flex-col h-full">
      {/* Header */}
      <div className={cn("px-4 py-3 border-b flex items-start justify-between gap-2", meta.bg)}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("shrink-0", meta.color)}>{meta.icon}</span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Configure node
            </p>
            <p className={cn("text-xs font-medium truncate", meta.color)}>
              {node.data.nodeTypeName as string}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Node name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Node name</Label>
            <Input
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              className="h-8 text-xs"
              placeholder="Name this step…"
            />
          </div>

          {fields.length > 0 && (
            <div className={cn("border-t pt-3", meta.border)} />
          )}

          {fields.length === 0 && (
            <p className="text-xs text-muted-foreground/60 text-center py-4">
              No configuration needed for this node type.
            </p>
          )}

          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-xs font-medium">{field.label}</Label>

              {field.type === "select" ? (
                <Select
                  value={config[field.key] ?? ""}
                  onValueChange={(v) => handleFieldChange(field.key, v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === "textarea" ? (
                <textarea
                  value={config[field.key] ?? ""}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none font-mono"
                />
              ) : (
                <Input
                  type={field.type === "password" ? "password" : field.type === "number" ? "number" : "text"}
                  value={config[field.key] ?? ""}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="h-8 text-xs"
                />
              )}

              {field.hint && (
                <p className="text-[10px] text-muted-foreground/60">{field.hint}</p>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="px-4 py-3 border-t bg-muted/20">
        <p className="text-[10px] text-muted-foreground/50 text-center">
          Changes apply immediately · click canvas to deselect
        </p>
      </div>
    </div>
  );
}

// ─── Node catalog sidebar ─────────────────────────────────────────────────────

function NodeCatalog({ nodeTypes: nts }: { nodeTypes: NodeType[] }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const categories = ["trigger", "action", "logic", "ai", "data"];

  const groups = categories
    .map((cat) => ({ cat, items: nts.filter((n) => n.category === cat) }))
    .filter((g) => g.items.length > 0);

  const onDragStart = (e: DragEvent, nt: NodeType) => {
    e.dataTransfer.setData("application/flowcraft-nodetype", JSON.stringify(nt));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Node Catalog</h2>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">Drag onto canvas to add</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {groups.map(({ cat, items }) => {
            const meta = CATEGORY_META[cat] ?? CATEGORY_META.action;
            const open = !collapsed[cat];
            return (
              <div key={cat}>
                <button
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
                  onClick={() => setCollapsed((c) => ({ ...c, [cat]: !c[cat] }))}
                >
                  <span className={cn("p-0.5", meta.color)}>{meta.icon}</span>
                  <span className="text-xs font-medium flex-1 text-left capitalize">{cat}</span>
                  <span className="text-muted-foreground/50">
                    {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </span>
                </button>
                {open && (
                  <div className="ml-2 space-y-0.5 mt-0.5">
                    {items.map((nt) => (
                      <div
                        key={nt.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, nt)}
                        className={cn(
                          "flex items-center gap-2 px-2 py-2 rounded-md cursor-grab active:cursor-grabbing",
                          "border transition-colors text-xs hover:bg-muted/70 select-none",
                          meta.bg, meta.border
                        )}
                      >
                        <span className={cn("shrink-0", meta.color)}>{meta.icon}</span>
                        <span className="truncate font-medium text-[11px]">{nt.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Conversion helpers ───────────────────────────────────────────────────────

let nodeIdCounter = 1000;
function generateNodeId() { return `node_${Date.now()}_${nodeIdCounter++}`; }

function workflowNodesToFlow(wfNodes: WorkflowNode[], nodeTypeMap: Map<string, NodeType>): Node[] {
  return (wfNodes ?? []).map((wn) => {
    const nt = nodeTypeMap.get(wn.nodeTypeId ?? wn.type);
    return {
      id: wn.id,
      type: "flowNode",
      position: wn.position,
      data: {
        label: wn.name,
        nodeTypeId: wn.nodeTypeId ?? wn.type,
        category: nt?.category ?? "action",
        description: nt?.description ?? "",
        nodeTypeName: nt?.name ?? wn.type,
        inputs: nt?.inputs ?? 1,
        outputs: nt?.outputs ?? 1,
        config: (wn.config as Record<string, string>) ?? {},
      },
    };
  });
}

function flowNodesToWorkflow(flowNodes: Node[]): WorkflowNode[] {
  return flowNodes.map((n) => ({
    id: n.id,
    type: n.data.category as string,
    name: n.data.label as string,
    nodeTypeId: n.data.nodeTypeId as string,
    position: n.position,
    config: (n.data.config as Record<string, string>) ?? {},
  }));
}

// ─── Main builder ─────────────────────────────────────────────────────────────

interface WorkflowBuilderInnerProps {
  workflowId: number;
  initialNodes: WorkflowNode[];
  nodeTypesList: NodeType[];
  onSaved?: () => void;
}

function WorkflowBuilderInner({ workflowId, initialNodes, nodeTypesList, onSaved }: WorkflowBuilderInnerProps) {
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const nodeTypeMap = useMemo(() => {
    const m = new Map<string, NodeType>();
    nodeTypesList.forEach((nt) => m.set(nt.id, nt));
    return m;
  }, [nodeTypesList]);

  const [nodes, setNodes, onNodesChange] = useNodesState(
    workflowNodesToFlow(initialNodes, nodeTypeMap)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const updateMutation = useUpdateWorkflow({
    mutation: {
      onSuccess: () => {
        setIsDirty(false);
        toast({ title: "Workflow saved" });
        onSaved?.();
      },
      onError: () => {
        toast({ title: "Failed to save workflow", variant: "destructive" });
      },
    },
  });

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
      setIsDirty(true);
    },
    [setEdges]
  );

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("application/flowcraft-nodetype");
      if (!raw) return;
      let nt: NodeType;
      try { nt = JSON.parse(raw); } catch { return; }

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const newNode: Node = {
        id: generateNodeId(),
        type: "flowNode",
        position,
        data: {
          label: nt.name,
          nodeTypeId: nt.id,
          category: nt.category,
          description: nt.description,
          nodeTypeName: nt.name,
          inputs: nt.inputs,
          outputs: nt.outputs,
          config: {},
        },
      };
      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newNode.id);
      setIsDirty(true);
    },
    [screenToFlowPosition, setNodes]
  );

  const onNodesChangeWrapped: typeof onNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      const isDone = changes.some((c) => c.type === "position" && c.dragging === false);
      if (isDone) setIsDirty(true);
      const removed = changes.filter((c) => c.type === "remove");
      if (removed.length) {
        setIsDirty(true);
        if (selectedNodeId && removed.some((c: any) => c.id === selectedNodeId)) {
          setSelectedNodeId(null);
        }
      }
    },
    [onNodesChange, selectedNodeId]
  );

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleConfigChange = useCallback(
    (nodeId: string, label: string, config: Record<string, string>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, label, config } } : n
        )
      );
      setIsDirty(true);
    },
    [setNodes]
  );

  const deleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
    setSelectedNodeId(null);
    setIsDirty(true);
  }, [setNodes, setEdges]);

  const handleSave = useCallback(() => {
    const wfNodes = flowNodesToWorkflow(nodes);
    updateMutation.mutate({ id: workflowId, data: { nodes: wfNodes } });
  }, [nodes, workflowId, updateMutation]);

  return (
    <div className="flex h-full overflow-hidden rounded-lg border">
      {/* Left: Node catalog */}
      <div className="w-52 shrink-0 border-r bg-card/50 flex flex-col">
        <NodeCatalog nodeTypes={nodeTypesList} />
      </div>

      {/* Center: Canvas */}
      <div className="flex-1 relative min-w-0" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeWrapped}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          deleteKeyCode={["Backspace", "Delete"]}
          multiSelectionKeyCode="Shift"
          className="bg-zinc-950"
          defaultEdgeOptions={{ animated: true, style: { stroke: "#6366f1", strokeWidth: 2 } }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#27272a" />
          <Controls className="!bg-card !border-border !shadow-md" />
          <MiniMap
            className="!bg-card !border-border"
            nodeColor={(n) => HANDLE_COLORS[n.data?.category as string] ?? "#6b7280"}
            maskColor="rgba(0,0,0,0.5)"
          />
          <Panel position="top-right" className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs bg-card"
              onClick={deleteSelected}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </Button>
            <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={handleSave}
              disabled={updateMutation.isPending || !isDirty}>
              <Save className="h-3.5 w-3.5" />
              {updateMutation.isPending ? "Saving…" : isDirty ? "Save Changes" : "Saved"}
            </Button>
          </Panel>
          {nodes.length === 0 && (
            <Panel position="top-center">
              <div className="flex items-center gap-2 text-muted-foreground text-sm bg-card border rounded-lg px-4 py-3 shadow-sm mt-16">
                <Plus className="h-4 w-4" />
                Drag nodes from the catalog on the left to build your workflow
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Right: Config panel */}
      {selectedNode && (
        <ConfigPanel
          node={selectedNode}
          onClose={() => setSelectedNodeId(null)}
          onChange={handleConfigChange}
        />
      )}
    </div>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

interface WorkflowBuilderProps {
  workflowId: number;
  initialNodes: WorkflowNode[];
  nodeTypesList: NodeType[];
  onSaved?: () => void;
}

export function WorkflowBuilder(props: WorkflowBuilderProps) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner {...props} />
    </ReactFlowProvider>
  );
}

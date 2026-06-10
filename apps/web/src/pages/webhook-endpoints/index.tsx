import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";

type WebhookEndpoint = {
  id: number;
  workflowId: number;
  name: string;
  description: string | null;
  secret: string | null;
  isActive: boolean;
  lastTriggeredAt: string | null;
  triggerCount: number;
  allowedIps: string[];
  headers: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

const API = import.meta.env["VITE_API_URL"] ?? "/api";

function useApi() {
  const { token } = useAuth();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export default function WebhookEndpointsPage() {
  const authHeaders = useApi();
  const { token } = useAuth();
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createWorkflowId, setCreateWorkflowId] = useState("");
  const [createDesc, setCreateDesc] = useState("");

  const fetchEndpoints = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/webhook-endpoints`, { headers: authHeaders });
      if (res.ok) setEndpoints(await res.json());
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  useEffect(() => { fetchEndpoints(); }, [fetchEndpoints]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API}/webhook-endpoints`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ name: createName, workflowId: parseInt(createWorkflowId, 10), description: createDesc }),
    });
    if (res.ok) {
      setShowCreate(false);
      setCreateName("");
      setCreateWorkflowId("");
      setCreateDesc("");
      fetchEndpoints();
    }
  };

  const handleToggle = async (ep: WebhookEndpoint) => {
    await fetch(`${API}/webhook-endpoints/${ep.id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ isActive: !ep.isActive }),
    });
    fetchEndpoints();
  };

  const handleRegen = async (id: number) => {
    await fetch(`${API}/webhook-endpoints/${id}/regenerate-secret`, {
      method: "POST",
      headers: authHeaders,
    });
    fetchEndpoints();
  };

  const handleDelete = async (id: number) => {
    await fetch(`${API}/webhook-endpoints/${id}`, { method: "DELETE", headers: authHeaders });
    fetchEndpoints();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading webhook endpoints...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhook Endpoints</h1>
          <p className="text-muted-foreground mt-1">Manage incoming webhook triggers for your workflows</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showCreate ? "Cancel" : "New Endpoint"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-lg border p-4 space-y-3 bg-card">
          <h3 className="font-semibold">Create Webhook Endpoint</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                value={createName} onChange={e => setCreateName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Workflow ID</label>
              <input
                type="number" value={createWorkflowId} onChange={e => setCreateWorkflowId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <input
              value={createDesc} onChange={e => setCreateDesc(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Create
          </button>
        </form>
      )}

      {endpoints.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No webhook endpoints yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 text-sm font-medium">Name</th>
                <th className="text-left p-3 text-sm font-medium">Workflow</th>
                <th className="text-left p-3 text-sm font-medium">Status</th>
                <th className="text-left p-3 text-sm font-medium">Triggers</th>
                <th className="text-left p-3 text-sm font-medium">Last Triggered</th>
                <th className="text-right p-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map(ep => (
                <tr key={ep.id} className="border-b last:border-0">
                  <td className="p-3">
                    <div className="font-medium">{ep.name}</div>
                    {ep.description && <div className="text-xs text-muted-foreground">{ep.description}</div>}
                  </td>
                  <td className="p-3 text-sm">#{ep.workflowId}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ep.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {ep.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 text-sm">{ep.triggerCount}</td>
                  <td className="p-3 text-sm text-muted-foreground">{ep.lastTriggeredAt ? new Date(ep.lastTriggeredAt).toLocaleString() : "—"}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleToggle(ep)} className="text-xs underline hover:text-primary">{ep.isActive ? "Deactivate" : "Activate"}</button>
                      <button onClick={() => handleRegen(ep.id)} className="text-xs underline hover:text-primary">Regen Secret</button>
                      <button onClick={() => handleDelete(ep.id)} className="text-xs underline text-destructive hover:text-destructive/80">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

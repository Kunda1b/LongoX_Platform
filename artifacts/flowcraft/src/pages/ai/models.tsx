import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAiModels,
  useCreateAiModel,
  useUpdateAiModel,
  useDeleteAiModel,
  getListAiModelsQueryKey,
} from "@longox/api-client-react";
import type { AiModel } from "@longox/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Brain,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const PROVIDER_COLORS: Record<string, string> = {
  openai: "bg-emerald-100 text-emerald-700",
  anthropic: "bg-orange-100 text-orange-700",
  google: "bg-blue-100 text-blue-700",
  mistral: "bg-indigo-100 text-indigo-700",
  cohere: "bg-pink-100 text-pink-700",
};

type ModelForm = {
  provider: string;
  name: string;
  modelId: string;
  contextWindow: string;
  inputCost: string;
  outputCost: string;
  isEnabled: boolean;
};
const EMPTY: ModelForm = {
  provider: "",
  name: "",
  modelId: "",
  contextWindow: "4096",
  inputCost: "0",
  outputCost: "0",
  isEnabled: true,
};

function fmtCost(cost: number) {
  if (cost === 0) return "Free";
  if (cost < 0.000001) return `$${(cost * 1e9).toFixed(2)}/B`;
  if (cost < 0.001) return `$${(cost * 1e6).toFixed(2)}/M`;
  return `$${cost.toFixed(5)}`;
}

function fmtCtx(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function AiModelsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: models = [], isLoading } = useListAiModels();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AiModel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [form, setForm] = useState<ModelForm>(EMPTY);

  const createMutation = useCreateAiModel({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAiModelsQueryKey() });
        toast({ title: "Model registered!" });
        setCreateOpen(false);
        setForm(EMPTY);
      },
      onError: () =>
        toast({ title: "Failed to register model", variant: "destructive" }),
    },
  });

  const updateMutation = useUpdateAiModel({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAiModelsQueryKey() });
        toast({ title: "Model updated" });
        setEditTarget(null);
      },
      onError: () =>
        toast({ title: "Failed to update model", variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteAiModel({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAiModelsQueryKey() });
        toast({ title: "Model removed" });
        setDeleteTarget(null);
      },
      onError: () =>
        toast({ title: "Failed to remove model", variant: "destructive" }),
    },
  });

  function openEdit(m: AiModel) {
    setForm({
      provider: m.provider,
      name: m.name,
      modelId: m.modelId,
      contextWindow: String(m.contextWindow),
      inputCost: String(m.inputCostPerToken),
      outputCost: String(m.outputCostPerToken),
      isEnabled: m.isEnabled,
    });
    setEditTarget(m);
  }

  function handleCreate() {
    createMutation.mutate({
      data: {
        provider: form.provider.trim(),
        name: form.name.trim(),
        modelId: form.modelId.trim(),
        contextWindow: Number(form.contextWindow),
        inputCostPerToken: Number(form.inputCost),
        outputCostPerToken: Number(form.outputCost),
        isEnabled: form.isEnabled,
      },
    });
  }

  function handleUpdate() {
    if (!editTarget) return;
    updateMutation.mutate({
      id: editTarget.id,
      data: {
        provider: form.provider.trim(),
        name: form.name.trim(),
        modelId: form.modelId.trim(),
        contextWindow: Number(form.contextWindow),
        inputCostPerToken: Number(form.inputCost),
        outputCostPerToken: Number(form.outputCost),
        isEnabled: form.isEnabled,
      },
    });
  }

  const byProvider = models.reduce<Record<string, AiModel[]>>((acc, m) => {
    if (!acc[m.provider]) acc[m.provider] = [];
    acc[m.provider].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            AI Model Registry
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage AI provider models, context windows, and pricing.
          </p>
        </div>
        <Button
          className="gap-2 shrink-0"
          onClick={() => {
            setForm(EMPTY);
            setCreateOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Register Model
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Models",
            value: models.length,
            color: "text-foreground",
          },
          {
            label: "Enabled",
            value: models.filter((m) => m.isEnabled).length,
            color: "text-green-600",
          },
          {
            label: "Providers",
            value: Object.keys(byProvider).length,
            color: "text-blue-600",
          },
          {
            label: "Disabled",
            value: models.filter((m) => !m.isEnabled).length,
            color: "text-muted-foreground",
          },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading models…</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(byProvider).map(([provider, providerModels]) => (
            <div key={provider}>
              <div className="flex items-center gap-2 mb-4">
                <Badge
                  className={`text-xs font-semibold uppercase px-2 ${PROVIDER_COLORS[provider] ?? "bg-muted text-muted-foreground"}`}
                >
                  {provider}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {providerModels.length} model
                  {providerModels.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providerModels.map((m) => (
                  <Card
                    key={m.id}
                    className={`flex flex-col ${!m.isEnabled ? "opacity-60" : ""}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Brain className="h-5 w-5 text-primary" />
                          <div>
                            <CardTitle className="text-sm font-semibold">
                              {m.name}
                            </CardTitle>
                            <p className="text-xs font-mono text-muted-foreground">
                              {m.modelId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {m.isEnabled ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <button
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            onClick={() => openEdit(m)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(m.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 rounded bg-muted/40">
                          <div className="font-semibold">
                            {fmtCtx(m.contextWindow)}
                          </div>
                          <div className="text-muted-foreground">context</div>
                        </div>
                        <div className="text-center p-2 rounded bg-muted/40">
                          <div className="font-semibold">
                            {fmtCost(m.inputCostPerToken)}
                          </div>
                          <div className="text-muted-foreground">input/tok</div>
                        </div>
                        <div className="text-center p-2 rounded bg-muted/40">
                          <div className="font-semibold">
                            {fmtCost(m.outputCostPerToken)}
                          </div>
                          <div className="text-muted-foreground">
                            output/tok
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ModelDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        form={form}
        setForm={setForm}
        title="Register AI Model"
        onSubmit={handleCreate}
        isPending={createMutation.isPending}
        submitLabel="Register Model"
      />
      <ModelDialog
        open={editTarget !== null}
        onOpenChange={(o) => !o && setEditTarget(null)}
        form={form}
        setForm={setForm}
        title="Edit AI Model"
        onSubmit={handleUpdate}
        isPending={updateMutation.isPending}
        submitLabel="Save Changes"
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this model?</AlertDialogTitle>
            <AlertDialogDescription>
              The model will be unregistered from the registry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteTarget !== null &&
                deleteMutation.mutate({ id: deleteTarget })
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ModelDialog({
  open,
  onOpenChange,
  form,
  setForm,
  title,
  onSubmit,
  isPending,
  submitLabel,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  form: ModelForm;
  setForm: React.Dispatch<React.SetStateAction<ModelForm>>;
  title: string;
  onSubmit: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const isValid =
    form.provider.trim() && form.name.trim() && form.modelId.trim();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <Label>
              Provider <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="openai"
              value={form.provider}
              onChange={(e) =>
                setForm((f) => ({ ...f, provider: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <Label>
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="GPT-4o"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>
              Model ID <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="gpt-4o"
              value={form.modelId}
              onChange={(e) =>
                setForm((f) => ({ ...f, modelId: e.target.value }))
              }
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Context Window</Label>
            <Input
              type="number"
              value={form.contextWindow}
              onChange={(e) =>
                setForm((f) => ({ ...f, contextWindow: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Input Cost / Token ($)</Label>
            <Input
              type="number"
              step="0.000001"
              value={form.inputCost}
              onChange={(e) =>
                setForm((f) => ({ ...f, inputCost: e.target.value }))
              }
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Output Cost / Token ($)</Label>
            <Input
              type="number"
              step="0.000001"
              value={form.outputCost}
              onChange={(e) =>
                setForm((f) => ({ ...f, outputCost: e.target.value }))
              }
              className="font-mono"
            />
          </div>
          <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
            <Switch
              checked={form.isEnabled}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isEnabled: v }))}
              id="model-enabled"
            />
            <Label htmlFor="model-enabled">Enabled</Label>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={onSubmit} disabled={!isValid || isPending}>
            {isPending ? "Saving…" : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

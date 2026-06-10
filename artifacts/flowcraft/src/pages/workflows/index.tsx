import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useListWorkflows, 
  useCreateWorkflow, 
  useToggleWorkflow, 
  useDeleteWorkflow,
  getListWorkflowsQueryKey
} from "@autoflow/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/badges";
import { Plus, Search, Cable, MoreVertical, Trash2, Power, PowerOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  triggerType: z.string().min(1, "Trigger type is required"),
});

export default function Workflows() {
  const [search, setSearch] = useState("");
  const { data: workflows, isLoading } = useListWorkflows({ search });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const toggleMutation = useToggleWorkflow({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
        toast({ title: "Workflow status updated" });
      }
    }
  });

  const deleteMutation = useDeleteWorkflow({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
        toast({ title: "Workflow deleted" });
      }
    }
  });

  const createMutation = useCreateWorkflow({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
        setIsCreateOpen(false);
        toast({ title: "Workflow created" });
      }
    }
  });

  const form = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", description: "", triggerType: "schedule" },
  });

  const onSubmit = (values: z.infer<typeof createSchema>) => {
    createMutation.mutate({ data: { ...values, nodes: [] } });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground mt-1">Design and manage your automation pipelines.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              New Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] sm:w-auto sm:max-w-lg rounded-lg">
            <DialogHeader>
              <DialogTitle>Create Workflow</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Sync Salesforce to Postgres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="What does this do?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="triggerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trigger</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select trigger" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="schedule">Schedule</SelectItem>
                          <SelectItem value="webhook">Webhook</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search workflows..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))
        ) : workflows?.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center rounded-lg border border-dashed p-6 md:p-12">
            <div className="bg-muted text-foreground flex size-12 shrink-0 items-center justify-center rounded-lg">
              <Cable className="size-6" />
            </div>
            <div className="flex max-w-sm flex-col items-center gap-1">
              <div className="text-lg font-medium tracking-tight">No workflows yet</div>
              <p className="text-muted-foreground text-sm/relaxed">Automate repetitive tasks by connecting triggers, actions, and logic nodes.</p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="mt-2">Create your first workflow</Button>
          </div>
        ) : (
          workflows?.map((wf) => (
            <Card key={wf.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="bg-primary/10 text-primary p-2.5 sm:p-3 rounded-md mt-0.5 shrink-0">
                    <Cable className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>

                  {/* Main content — min-w-0 allows truncation */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/workflows/${wf.id}`} className="font-semibold text-base sm:text-lg hover:underline block truncate">
                      {wf.name}
                    </Link>
                    {wf.description && (
                      <p className="text-muted-foreground text-sm mt-0.5 truncate">{wf.description}</p>
                    )}
                    <div className="flex items-center flex-wrap gap-2 mt-2">
                      <StatusBadge status={wf.status} />
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                        {wf.triggerType}
                      </span>
                      <span className="text-xs text-muted-foreground">{wf.nodeCount} nodes</span>
                      <span className="text-xs text-muted-foreground">
                        {wf.executionCount?.toLocaleString() ?? 0} runs
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => toggleMutation.mutate({ id: wf.id })}
                        className="gap-2"
                      >
                        {wf.status === 'active' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        {wf.status === 'active' ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive gap-2 focus:text-destructive"
                        onClick={() => {
                          if (confirm("Delete this workflow?")) {
                            deleteMutation.mutate({ id: wf.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

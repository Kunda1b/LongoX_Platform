import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useListApps, 
  useCreateApp,
  getListAppsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, TypeBadge } from "@/components/badges";
import { Plus, Search, AppWindow, Settings, BarChart2, LayoutGrid } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  type: z.enum(["dashboard", "crud", "form", "report"]),
});

export default function Apps() {
  const [search, setSearch] = useState("");
  const { data: apps, isLoading } = useListApps({ search });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const createMutation = useCreateApp({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAppsQueryKey() });
        setIsCreateOpen(false);
        toast({ title: "App created successfully" });
      }
    }
  });

  const form = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", description: "", type: "dashboard" },
  });

  const onSubmit = (values: z.infer<typeof createSchema>) => {
    createMutation.mutate({ data: { ...values, layout: {} } });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Internal Apps</h1>
          <p className="text-muted-foreground mt-1">Build and manage custom tools for your team.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/apps/stats" className="gap-2">
              <BarChart2 className="h-4 w-4" />
              Usage Stats
            </Link>
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New App
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New App</DialogTitle>
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
                          <Input placeholder="e.g. Customer Support Tool" {...field} />
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
                          <Input placeholder="What is this app used for?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>App Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="dashboard">Dashboard</SelectItem>
                            <SelectItem value="crud">CRUD App</SelectItem>
                            <SelectItem value="form">Form</SelectItem>
                            <SelectItem value="report">Report</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Creating..." : "Create App"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search apps..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))
        ) : apps?.length === 0 ? (
          <div className="col-span-full flex min-w-0 flex-1 flex-col items-center justify-center gap-4 text-balance rounded-lg border border-dashed p-6 text-center md:p-12">
            <div className="bg-muted text-foreground flex size-12 shrink-0 items-center justify-center rounded-lg">
              <LayoutGrid className="size-6" />
            </div>
            <div className="flex max-w-sm flex-col items-center gap-1 text-center">
              <div className="text-lg font-medium tracking-tight text-foreground">No apps yet</div>
              <p className="text-muted-foreground text-sm/relaxed">Build internal dashboards, CRUD interfaces, forms, and reports without writing code.</p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="mt-2">Create your first app</Button>
          </div>
        ) : (
          apps?.map((app) => (
            <Card key={app.id} className="hover:border-primary/50 transition-colors flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-primary/10 text-primary p-2.5 rounded-lg">
                    <AppWindow className="h-5 w-5" />
                  </div>
                  <div className="flex gap-2">
                    <TypeBadge type={app.type} />
                  </div>
                </div>
                
                <h3 className="font-semibold text-lg mb-1">{app.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                  {app.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between pt-4 border-t mt-auto">
                  <StatusBadge status={app.status} />
                  <Button variant="ghost" size="sm" asChild className="gap-2">
                    <Link href={`/apps/${app.id}`}>
                      <Settings className="h-4 w-4" />
                      Configure
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
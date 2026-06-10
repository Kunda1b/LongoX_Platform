import { useParams, Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useGetApp,
  useUpdateApp,
  useDeleteApp,
  getGetAppQueryKey,
  getListAppsQueryKey,
} from "@longox/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge, TypeBadge } from "@/components/badges";
import { ArrowLeft, Save, Trash2, Layout, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useEffect, useRef } from "react";

const updateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["published", "draft"]),
});

export default function AppDetail() {
  const { id } = useParams<{ id: string }>();
  const appId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: app, isLoading } = useGetApp(appId, {
    query: { enabled: !!appId, queryKey: getGetAppQueryKey(appId) },
  });

  const updateMutation = useUpdateApp({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAppQueryKey(appId) });
        queryClient.invalidateQueries({ queryKey: getListAppsQueryKey() });
        toast({ title: "App settings updated" });
      },
    },
  });

  const deleteMutation = useDeleteApp({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAppsQueryKey() });
        toast({ title: "App deleted" });
        setLocation("/apps");
      },
    },
  });

  const form = useForm<z.infer<typeof updateSchema>>({
    resolver: zodResolver(updateSchema),
    defaultValues: { name: "", description: "", status: "draft" },
  });

  const initRef = useRef(false);
  useEffect(() => {
    if (app && !initRef.current) {
      form.reset({
        name: app.name,
        description: app.description || "",
        status: app.status as any,
      });
      initRef.current = true;
    }
  }, [app, form]);

  const onSubmit = (values: z.infer<typeof updateSchema>) => {
    updateMutation.mutate({ id: appId, data: values });
  };

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!app) return <div className="p-8">App not found</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/apps">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{app.name}</h1>
              <StatusBadge status={app.status} />
              <TypeBadge type={app.type} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              ID: {app.id} • Views: {app.viewCount}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Layout className="h-4 w-4" />
            Edit Layout
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="pt-4 flex items-center justify-between">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        if (
                          confirm("Are you sure you want to delete this app?")
                        ) {
                          deleteMutation.mutate({ id: app.id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete App
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>App Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{app.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pages</p>
                <p className="font-medium">{app.pageCount || 1}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">
                  {new Date(app.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Edited</p>
                <p className="font-medium">
                  {app.lastEditedAt
                    ? new Date(app.lastEditedAt).toLocaleDateString()
                    : "Never"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

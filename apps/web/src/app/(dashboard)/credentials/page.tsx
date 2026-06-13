"use client";

import { useListCredentials, useDeleteCredential, getListCredentialsQueryKey } from "@longox/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KeyRound, Plus, Eye, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function CredentialsPage() {
  const { data: credentials, isLoading } = useListCredentials();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useDeleteCredential({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
        toast({ title: "Credential deleted" });
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Credentials</h1>
          <p className="text-sm text-muted-foreground">
            Securely store and manage secrets
          </p>
        </div>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> Add Credential
        </Button>
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-12 gap-4 border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground">
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Connector</div>
          <div className="col-span-2">Fields</div>
          <div className="col-span-2">Created</div>
          <div className="col-span-2">Actions</div>
        </div>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 border-b px-4 py-3 last:border-0">
              <div className="col-span-12">
                <Skeleton className="h-5 w-full" />
              </div>
            </div>
          ))
        ) : credentials?.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <KeyRound className="size-6" />
            </div>
            <div className="flex max-w-sm flex-col items-center gap-1">
              <div className="text-lg font-medium tracking-tight">
                No credentials yet
              </div>
              <p className="text-sm text-muted-foreground">
                Add credentials to connect to external services securely
              </p>
            </div>
            <Button className="mt-2">
              <Plus className="mr-1 h-4 w-4" /> Add your first credential
            </Button>
          </div>
        ) : (
          credentials?.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-12 gap-4 border-b px-4 py-3 text-sm last:border-0"
            >
              <div className="col-span-3 flex items-center gap-2 font-medium">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                {c.name}
              </div>
              <div className="col-span-3 text-muted-foreground">
                {c.connectorName}
              </div>
              <div className="col-span-2 text-muted-foreground">
                {c.fields.length} fields
              </div>
              <div className="col-span-2 text-muted-foreground">
                {new Date(c.createdAt).toLocaleDateString()}
              </div>
              <div className="col-span-2 flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => {
                    if (confirm("Delete this credential?")) {
                      deleteMutation.mutate({ id: c.id });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

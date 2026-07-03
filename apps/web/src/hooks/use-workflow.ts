import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface Workflow {
  id: number;
  name: string;
  status: string;
  tenantId: number;
  currentVersionId: number | null;
  nodes?: Record<string, unknown>[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface WorkflowListParams {
  tenantId?: number;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useWorkflow(workflowId?: number) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["workflow", workflowId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/workflows/${workflowId}`);
      return response.data;
    },
    enabled: !!workflowId,
  });

  const listQuery = useQuery({
    queryKey: ["workflows"],
    queryFn: async () => {
      const response = await apiClient.get("/api/v1/workflows");
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; triggerType: string }) => {
      const response = await apiClient.post("/api/v1/workflows", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/api/v1/workflows/${id}/publish`);
      return response.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["workflow", id] });
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });

  return {
    workflow: query.data,
    workflows: listQuery.data ?? [],
    isLoading: query.isLoading || listQuery.isLoading,
    error: query.error || listQuery.error,
    createWorkflow: createMutation.mutateAsync,
    publishWorkflow: publishMutation.mutateAsync,
    isPublishing: publishMutation.isPending,
    refetch: () => {
      query.refetch();
      listQuery.refetch();
    },
  };
}

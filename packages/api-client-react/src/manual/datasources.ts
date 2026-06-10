import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions, UseMutationOptions, QueryKey } from "@tanstack/react-query";
import { customFetch } from "../custom-fetch";
import type { ErrorType } from "../custom-fetch";
import type { DataSource, DataSourceInput, QueryResult, ConnectionTestResult, ListDataSourcesParams } from "./types";

// ─── URLs ────────────────────────────────────────────────────────────────────

export const getListDataSourcesUrl = () => `/api/datasources`;

export const getDataSourceUrl = (id: number) => `/api/datasources/${id}`;

export const getListAdaptersUrl = () => `/api/datasources/adapters`;

export const getTestConnectionUrl = (id: number) => `/api/datasources/${id}/test`;

export const getExecuteQueryUrl = (id: number) => `/api/datasources/${id}/query`;

export const getListTablesUrl = (id: number) => `/api/datasources/${id}/tables`;

// ─── Fetch functions ─────────────────────────────────────────────────────────

export const listDataSources = async (params?: ListDataSourcesParams, options?: RequestInit): Promise<DataSource[]> => {
  const searchParams = new URLSearchParams();
  if (params?.tenantId) searchParams.set("tenantId", String(params.tenantId));
  if (params?.kind) searchParams.set("kind", params.kind);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  const qs = searchParams.toString();
  return customFetch<DataSource[]>(`${getListDataSourcesUrl()}${qs ? `?${qs}` : ""}`, { ...options, method: "GET" });
};

export const getDataSource = async (id: number, options?: RequestInit): Promise<DataSource> => {
  return customFetch<DataSource>(getDataSourceUrl(id), { ...options, method: "GET" });
};

export const createDataSource = async (input: DataSourceInput, options?: RequestInit): Promise<DataSource> => {
  return customFetch<DataSource>(getListDataSourcesUrl(), {
    ...options, method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(input),
  });
};

export const updateDataSource = async (id: number, input: Partial<DataSourceInput>, options?: RequestInit): Promise<DataSource> => {
  return customFetch<DataSource>(getDataSourceUrl(id), {
    ...options, method: "PATCH",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(input),
  });
};

export const deleteDataSource = async (id: number, options?: RequestInit): Promise<void> => {
  await customFetch<void>(getDataSourceUrl(id), { ...options, method: "DELETE" });
};

export const listAdapters = async (options?: RequestInit): Promise<string[]> => {
  return customFetch<string[]>(getListAdaptersUrl(), { ...options, method: "GET" });
};

export const testConnection = async (id: number, options?: RequestInit): Promise<ConnectionTestResult> => {
  return customFetch<ConnectionTestResult>(getTestConnectionUrl(id), { ...options, method: "POST" });
};

export const executeQuery = async (id: number, query: string, options?: RequestInit): Promise<QueryResult> => {
  return customFetch<QueryResult>(getExecuteQueryUrl(id), {
    ...options, method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify({ query }),
  });
};

export const listDataSourceTables = async (id: number, options?: RequestInit): Promise<string[]> => {
  return customFetch<string[]>(getListTablesUrl(id), { ...options, method: "GET" });
};

// ─── Query keys ──────────────────────────────────────────────────────────────

export const getListDataSourcesQueryKey = (params?: ListDataSourcesParams) =>
  [`/api/datasources`, ...(params ? [params] : [])] as const;

export const getDataSourceQueryKey = (id: number) => [`/api/datasources/${id}`] as const;

export const getListAdaptersQueryKey = () => [`/api/datasources/adapters`] as const;

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useListDataSources<TData = DataSource[], TError = ErrorType<unknown>>(
  params?: ListDataSourcesParams,
  options?: { query?: UseQueryOptions<DataSource[], TError, TData>; request?: RequestInit },
) {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getListDataSourcesQueryKey(params);
  const queryFn = ({ signal }: { signal?: AbortSignal }) => listDataSources(params, { signal, ...requestOptions });
  const query = useQuery({ queryKey, queryFn, ...queryOptions }) as any;
  return { ...query, queryKey };
}

export function useGetDataSource<TData = DataSource, TError = ErrorType<void>>(
  id: number,
  options?: { query?: UseQueryOptions<DataSource, TError, TData>; request?: RequestInit },
) {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getDataSourceQueryKey(id);
  const queryFn = ({ signal }: { signal?: AbortSignal }) => getDataSource(id, { signal, ...requestOptions });
  const query = useQuery({ queryKey, queryFn, enabled: !!id, ...queryOptions }) as any;
  return { ...query, queryKey };
}

export function useListAdapters<TData = string[], TError = ErrorType<unknown>>(
  options?: { query?: UseQueryOptions<string[], TError, TData>; request?: RequestInit },
) {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getListAdaptersQueryKey();
  const queryFn = ({ signal }: { signal?: AbortSignal }) => listAdapters({ signal, ...requestOptions });
  const query = useQuery({ queryKey, queryFn, ...queryOptions }) as any;
  return { ...query, queryKey };
}

export function useCreateDataSource<TError = ErrorType<unknown>>(
  options?: UseMutationOptions<DataSource, TError, DataSourceInput>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DataSourceInput) => createDataSource(input),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [`/api/datasources`] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useUpdateDataSource<TError = ErrorType<unknown>>(
  options?: UseMutationOptions<DataSource, TError, { id: number; data: Partial<DataSourceInput> }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateDataSource(id, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [`/api/datasources`] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useDeleteDataSource<TError = ErrorType<unknown>>(
  options?: UseMutationOptions<void, TError, number>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDataSource(id),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [`/api/datasources`] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useTestConnection<TError = ErrorType<unknown>>(
  options?: UseMutationOptions<ConnectionTestResult, TError, number>,
) {
  return useMutation({
    mutationFn: (id: number) => testConnection(id),
    ...options,
  });
}

export function useExecuteQuery<TError = ErrorType<unknown>>(
  options?: UseMutationOptions<QueryResult, TError, { id: number; query: string }>,
) {
  return useMutation({
    mutationFn: ({ id, query }) => executeQuery(id, query),
    ...options,
  });
}

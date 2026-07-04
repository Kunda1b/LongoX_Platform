import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { customFetch } from "../custom-fetch";
import type { ErrorType } from "../custom-fetch";
import type { ScheduleStats } from "./types";
import type {
  Schedule,
  ScheduleInput,
  ListSchedulesParams,
} from "../generated/api.schemas";

export const getListSchedulesUrl = () => `/api/schedules`;

export const getScheduleUrl = (id: string) => `/api/schedules/${id}`;

export const getDueSchedulesUrl = () => `/api/schedules/due`;

export const getScheduleStatsUrl = () => `/api/schedules/stats`;

export const getPauseScheduleUrl = (id: string) => `/api/schedules/${id}/pause`;

export const getActivateScheduleUrl = (id: string) =>
  `/api/schedules/${id}/activate`;

export const listSchedules = async (
  params?: ListSchedulesParams,
  options?: RequestInit,
): Promise<Schedule[]> => {
  const searchParams = new URLSearchParams();
  if (params?.tenantId) searchParams.set("tenantId", String(params.tenantId));
  if (params?.workflowId)
    searchParams.set("workflowId", String(params.workflowId));
  if (params?.status) searchParams.set("status", params.status);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  const qs = searchParams.toString();
  return customFetch<Schedule[]>(
    `${getListSchedulesUrl()}${qs ? `?${qs}` : ""}`,
    { ...options, method: "GET" },
  );
};

export const getSchedule = async (
  id: string,
  options?: RequestInit,
): Promise<Schedule> => {
  return customFetch<Schedule>(getScheduleUrl(id), {
    ...options,
    method: "GET",
  });
};

export const createSchedule = async (
  input: ScheduleInput,
  options?: RequestInit,
): Promise<Schedule> => {
  return customFetch<Schedule>(getListSchedulesUrl(), {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(input),
  });
};

export const updateSchedule = async (
  id: string,
  input: Partial<ScheduleInput>,
  options?: RequestInit,
): Promise<Schedule> => {
  return customFetch<Schedule>(getScheduleUrl(id), {
    ...options,
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(input),
  });
};

export const deleteSchedule = async (
  id: string,
  options?: RequestInit,
): Promise<void> => {
  await customFetch<void>(getScheduleUrl(id), { ...options, method: "DELETE" });
};

export const getDueSchedules = async (
  options?: RequestInit,
): Promise<Schedule[]> => {
  return customFetch<Schedule[]>(getDueSchedulesUrl(), {
    ...options,
    method: "GET",
  });
};

export const getScheduleStats = async (
  options?: RequestInit,
): Promise<ScheduleStats> => {
  return customFetch<ScheduleStats>(getScheduleStatsUrl(), {
    ...options,
    method: "GET",
  });
};

export const pauseSchedule = async (
  id: string,
  options?: RequestInit,
): Promise<Schedule> => {
  return customFetch<Schedule>(getPauseScheduleUrl(id), {
    ...options,
    method: "POST",
  });
};

export const activateSchedule = async (
  id: string,
  options?: RequestInit,
): Promise<Schedule> => {
  return customFetch<Schedule>(getActivateScheduleUrl(id), {
    ...options,
    method: "POST",
  });
};

export const getListSchedulesQueryKey = (params?: ListSchedulesParams) =>
  [`/api/schedules`, ...(params ? [params] : [])] as const;

export const getScheduleQueryKey = (id: string) =>
  [`/api/schedules/${id}`] as const;

export const getDueSchedulesQueryKey = () => [`/api/schedules/due`] as const;

export const getScheduleStatsQueryKey = () => [`/api/schedules/stats`] as const;

export function useListSchedules<
  TData = Schedule[],
  TError = ErrorType<unknown>,
>(
  params?: ListSchedulesParams,
  options?: {
    query?: UseQueryOptions<Schedule[], TError, TData>;
    request?: RequestInit;
  },
) {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getListSchedulesQueryKey(params);
  const queryFn = ({ signal }: { signal?: AbortSignal }) =>
    listSchedules(params, { signal, ...requestOptions });
  const query = useQuery({ queryKey, queryFn, ...queryOptions }) as any;
  return { ...query, queryKey };
}

export function useGetSchedule<TData = Schedule, TError = ErrorType<void>>(
  id: string,
  options?: {
    query?: UseQueryOptions<Schedule, TError, TData>;
    request?: RequestInit;
  },
) {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getScheduleQueryKey(id);
  const queryFn = ({ signal }: { signal?: AbortSignal }) =>
    getSchedule(id, { signal, ...requestOptions });
  const query = useQuery({
    queryKey,
    queryFn,
    enabled: !!id,
    ...queryOptions,
  }) as any;
  return { ...query, queryKey };
}

export function useDueSchedules<
  TData = Schedule[],
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<Schedule[], TError, TData>;
  request?: RequestInit;
}) {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getDueSchedulesQueryKey();
  const queryFn = ({ signal }: { signal?: AbortSignal }) =>
    getDueSchedules({ signal, ...requestOptions });
  const query = useQuery({ queryKey, queryFn, ...queryOptions }) as any;
  return { ...query, queryKey };
}

export function useScheduleStats<
  TData = ScheduleStats,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<ScheduleStats, TError, TData>;
  request?: RequestInit;
}) {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getScheduleStatsQueryKey();
  const queryFn = ({ signal }: { signal?: AbortSignal }) =>
    getScheduleStats({ signal, ...requestOptions });
  const query = useQuery({ queryKey, queryFn, ...queryOptions }) as any;
  return { ...query, queryKey };
}

export function useCreateSchedule<TError = ErrorType<unknown>>(
  options?: UseMutationOptions<Schedule, TError, ScheduleInput>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ScheduleInput) => createSchedule(input),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedules`] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useUpdateSchedule<TError = ErrorType<unknown>>(
  options?: UseMutationOptions<
    Schedule,
    TError,
    { id: string; data: Partial<ScheduleInput> }
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateSchedule(id, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedules`] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useDeleteSchedule<TError = ErrorType<unknown>>(
  options?: UseMutationOptions<void, TError, number>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedules`] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function usePauseSchedule<TError = ErrorType<unknown>>(
  options?: UseMutationOptions<Schedule, TError, number>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pauseSchedule(id),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedules`] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useActivateSchedule<TError = ErrorType<unknown>>(
  options?: UseMutationOptions<Schedule, TError, number>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activateSchedule(id),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedules`] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

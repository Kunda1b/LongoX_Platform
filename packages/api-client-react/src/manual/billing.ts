import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  UseQueryOptions,
  UseMutationOptions,
  UseQueryResult,
  QueryKey,
} from "@tanstack/react-query";
import { customFetch } from "../custom-fetch";
import type { ErrorType } from "../custom-fetch";

export interface BillingPlan {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  tier: string;
  monthlyPrice: number;
  annualPrice: number | null;
  currency: string;
  includedExecutions: number;
  includedWorkflows: number;
  includedConnectors: number;
  includedAiTokens: number;
  includedStorageMb: number;
  maxUsers: number;
  maxEnvironments: number;
  overageExecutionsPrice: number;
  overageAiTokensPrice: number;
  features: string[];
}

export interface SubscriptionStatus {
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  plan: {
    id: string;
    name: string;
    displayName: string;
    tier: string;
  } | null;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface PortalSession {
  url: string;
}

export interface CreateCheckoutInput {
  planId: number;
  billingCycle: "monthly" | "annual";
}

const PLANS_URL = "/api/billing/plans";
const CHECKOUT_URL = "/api/billing/checkout";
const PORTAL_URL = "/api/billing/portal";
const SUBSCRIPTION_URL = "/api/billing/subscription";

export const getPlansUrl = () => PLANS_URL;
export const getCheckoutUrl = () => CHECKOUT_URL;
export const getPortalUrl = () => PORTAL_URL;
export const getSubscriptionUrl = () => SUBSCRIPTION_URL;

export const getPlansQueryKey = () => [PLANS_URL] as const;
export const getSubscriptionQueryKey = () => [SUBSCRIPTION_URL] as const;

export const listPlans = async (
  options?: RequestInit,
): Promise<BillingPlan[]> => {
  return customFetch<BillingPlan[]>(PLANS_URL, {
    ...options,
    method: "GET",
  });
};

export const getSubscriptionStatus = async (
  options?: RequestInit,
): Promise<SubscriptionStatus | null> => {
  return customFetch<SubscriptionStatus | null>(SUBSCRIPTION_URL, {
    ...options,
    method: "GET",
  });
};

export const createCheckoutSession = async (
  input: CreateCheckoutInput,
  options?: RequestInit,
): Promise<CheckoutSession> => {
  return customFetch<CheckoutSession>(CHECKOUT_URL, {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(input),
  });
};

export const getPortalSession = async (
  options?: RequestInit,
): Promise<PortalSession> => {
  return customFetch<PortalSession>(PORTAL_URL, {
    ...options,
    method: "GET",
  });
};

export function useListPlans<
  TData = BillingPlan[],
  TError = ErrorType<unknown>,
>(
  options?: {
    query?: UseQueryOptions<BillingPlan[], TError, TData>;
    request?: RequestInit;
  },
) {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getPlansQueryKey();
  const queryFn = ({ signal }: { signal?: AbortSignal }) =>
    listPlans({ signal, ...requestOptions });
  return useQuery({ queryKey, queryFn, ...queryOptions }) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
}

export function useGetSubscriptionStatus<
  TData = SubscriptionStatus | null,
  TError = ErrorType<unknown>,
>(
  options?: {
    query?: UseQueryOptions<SubscriptionStatus | null, TError, TData>;
    request?: RequestInit;
  },
) {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getSubscriptionQueryKey();
  const queryFn = ({ signal }: { signal?: AbortSignal }) =>
    getSubscriptionStatus({ signal, ...requestOptions });
  return useQuery({ queryKey, queryFn, ...queryOptions }) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
}

export function useCreateCheckoutSession<TError = ErrorType<unknown>>(
  options?: UseMutationOptions<CheckoutSession, TError, CreateCheckoutInput>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCheckoutInput) => createCheckoutSession(input),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: getSubscriptionQueryKey() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useGetPortalSession<TError = ErrorType<unknown>>(
  options?: UseMutationOptions<PortalSession, TError, void>,
) {
  return useMutation({
    mutationFn: () => getPortalSession(),
    ...options,
  });
}

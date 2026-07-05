export type PermissionOp =
  | "net:allow"
  | "net:deny"
  | "read:allow"
  | "read:deny"
  | "write:allow"
  | "write:deny"
  | "env:allow"
  | "env:deny"
  | "run:allow"
  | "run:deny"
  | "ffi:allow"
  | "ffi:deny";

export interface SandboxPolicy {
  opTable: PermissionOp[];
  maxCpuMs: number;
  maxMemoryMb: number;
  maxNetworkRequests: number;
  timeoutMs: number;
  allowedDomains: string[];
  allowedEnvVars: string[];
  allowedReadPaths: string[];
  allowedWritePaths: string[];
  secretsAllowlist: string[];
}

export const DEFAULT_CONNECTOR_POLICY: SandboxPolicy = {
  opTable: ["net:allow"],
  maxCpuMs: 10_000,
  maxMemoryMb: 128,
  maxNetworkRequests: 50,
  timeoutMs: 30_000,
  allowedDomains: ["*"],
  allowedEnvVars: [],
  allowedReadPaths: [],
  allowedWritePaths: [],
  secretsAllowlist: [],
};

export const RESTRICTED_CONNECTOR_POLICY: SandboxPolicy = {
  opTable: ["net:allow"],
  maxCpuMs: 5_000,
  maxMemoryMb: 64,
  maxNetworkRequests: 20,
  timeoutMs: 15_000,
  allowedDomains: [],
  allowedEnvVars: [],
  allowedReadPaths: [],
  allowedWritePaths: [],
  secretsAllowlist: [],
};

export const UNTRUSTED_CONNECTOR_POLICY: SandboxPolicy = {
  opTable: [],
  maxCpuMs: 2_000,
  maxMemoryMb: 32,
  maxNetworkRequests: 5,
  timeoutMs: 10_000,
  allowedDomains: [],
  allowedEnvVars: [],
  allowedReadPaths: [],
  allowedWritePaths: [],
  secretsAllowlist: [],
};

export function reducePolicyForAction(
  base: SandboxPolicy,
  requiredOps: PermissionOp[],
  targetDomains: string[],
): SandboxPolicy {
  return {
    ...base,
    opTable: base.opTable.filter((op) => requiredOps.includes(op)),
    allowedDomains: base.allowedDomains.includes("*")
      ? targetDomains
      : base.allowedDomains.filter((d) => targetDomains.includes(d)),
    maxNetworkRequests: Math.min(base.maxNetworkRequests, 10),
    timeoutMs: Math.min(base.timeoutMs, 15_000),
  };
}

export function validatePolicy(policy: SandboxPolicy): string[] {
  const errors: string[] = [];
  if (policy.maxCpuMs < 100) errors.push("maxCpuMs must be at least 100");
  if (policy.maxMemoryMb < 8) errors.push("maxMemoryMb must be at least 8");
  if (policy.timeoutMs < 1_000) errors.push("timeoutMs must be at least 1000");
  if (policy.maxNetworkRequests < 0)
    errors.push("maxNetworkRequests must be >= 0");
  if (policy.opTable.includes("run:allow"))
    errors.push("run:allow is forbidden for connector sandboxes");
  if (policy.opTable.includes("ffi:allow"))
    errors.push("ffi:allow is forbidden for connector sandboxes");
  return errors;
}

import type { TrustPolicy } from "./trust";
import { createHash } from "node:crypto";

export type ConnectorCertificationLevel =
  | "official"
  | "verified"
  | "community"
  | "sandbox";

export interface ConnectorPermission {
  scope: string;
  description: string;
  required: boolean;
  dangerous: boolean;
}

export interface ConnectorCapabilities {
  actions: boolean;
  triggers: {
    polling: boolean;
    webhooks: boolean;
    events: boolean;
  };
  auth: {
    oauth2: boolean;
    apiKey: boolean;
    basic: boolean;
    custom: boolean;
  };
  batching: boolean;
  pagination: boolean;
  fileUpload: boolean;
  realtime: boolean;
}

export interface ConnectorNetworkAccess {
  requiredDomains: string[];
  optionalDomains?: string[];
  allowDynamic: boolean;
  ipRanges?: string[];
}

export interface AuthField {
  key: string;
  label: string;
  type: "text" | "password" | "select" | "toggle";
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

export interface ConnectorAuthModel {
  type: "oauth2" | "api_key" | "basic" | "custom";
  label: string;
  oauth2?: {
    authorizationUrl: string;
    tokenUrl: string;
    scopes: string[];
    refreshUrl?: string;
    pkce: boolean;
  };
  apiKey?: {
    keyName: string;
    keyType: "header" | "query" | "cookie";
    keyPrefix?: string;
  };
  basic?: {
    usernameLabel: string;
    passwordLabel: string;
  };
  custom?: {
    fields: AuthField[];
  };
}

export interface ManifestAction {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  idempotent: boolean;
  idempotencyKey?: string;
  requiredAuth: string[];
  requiredPermissions: string[];
  timeoutMs?: number;
  maxRetries?: number;
  cost?: {
    type: "free" | "paid" | "metered";
    pricePerCall?: number;
  };
  sampleInput?: Record<string, unknown>;
  sampleOutput?: Record<string, unknown>;
  docsUrl?: string;
  deprecation?: {
    deprecated: boolean;
    deprecationMessage?: string;
    sunsetVersion?: string;
  };
}

export interface ManifestTrigger {
  id: string;
  name: string;
  description: string;
  type: "webhook" | "polling" | "event";
  outputSchema: Record<string, unknown>;
  requiredAuth: string[];
  requiredPermissions: string[];
  webhook?: {
    url: string;
    methods: string[];
    headers: Record<string, string>;
    secretHeader?: string;
    verificationSecret?: string;
  };
  polling?: {
    intervalMs: number;
    offsetField?: string;
    batchSize?: number;
    dedupField?: string;
  };
  event?: {
    eventTypes: string[];
    channelFilter?: string;
  };
  sampleOutput?: Record<string, unknown>;
  docsUrl?: string;
}

export interface ConnectorManifest {
  manifestVersion: string;
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  sdkVersion: string;
  author: string;
  authorUrl?: string;
  icon: string;
  color: string;
  categories: string[];
  certificationLevel: ConnectorCertificationLevel;
  signature: string | null;
  checksum: string;
  permissions: ConnectorPermission[];
  capabilities: ConnectorCapabilities;
  networkAccess: ConnectorNetworkAccess;
  auth: ConnectorAuthModel[];
  actions: ManifestAction[];
  triggers: ManifestTrigger[];
  sandboxPolicy?: Partial<{
    opTable: string[];
    maxCpuMs: number;
    maxMemoryMb: number;
    maxNetworkRequests: number;
    timeoutMs: number;
    allowedDomains: string[];
    allowedEnvVars: string[];
    allowedReadPaths: string[];
    allowedWritePaths: string[];
    secretsAllowlist: string[];
  }>;
  runtime: {
    minMemoryMb: number;
    minCpuMs: number;
    timeoutMs: number;
    maxNetworkRequests: number;
    requiredOps: string[];
  };
  ui?: {
    color: string;
    icon: string;
    docsUrl?: string;
    supportUrl?: string;
  };
}

export interface SignedManifest extends ConnectorManifest {
  signature: string;
  signerId: string;
  signedAt: string;
}

export interface SandboxPolicy {
  opTable: string[];
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

export interface ConnectorArtifact {
  manifest: ConnectorManifest;
  manifestChecksum: string;
  manifestSignature: string;
  signerId: string;
  signedAt: string;
  artifactRef: string;
  artifactType: "docker" | "npm" | "wasm" | "source";
  artifactChecksum: string;
  effectiveSandboxPolicy: SandboxPolicy;
}

export function validateManifest(manifest: ConnectorManifest): string[] {
  const errors: string[] = [];
  if (!manifest.id) errors.push("id is required");
  if (!manifest.name) errors.push("name is required");
  if (!manifest.displayName) errors.push("displayName is required");
  if (!manifest.version) errors.push("version is required");
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version))
    errors.push("version must be semver");
  if (!manifest.manifestVersion) errors.push("manifestVersion is required");
  if (!manifest.author) errors.push("author is required");
  if (!manifest.certificationLevel)
    errors.push("certificationLevel is required");
  if (
    !["official", "verified", "community", "sandbox"].includes(
      manifest.certificationLevel,
    )
  ) {
    errors.push(
      "certificationLevel must be one of: official, verified, community, sandbox",
    );
  }
  if (!manifest.capabilities) {
    errors.push("capabilities is required");
  }
  if (manifest.permissions.length === 0)
    errors.push("at least one permission is required");
  for (const action of manifest.actions) {
    if (!action.id) errors.push("each action must have an id");
    if (!action.name)
      errors.push(`action ${action.id || "(unnamed)"} must have a name`);
  }
  for (const trigger of manifest.triggers) {
    if (!trigger.id) errors.push("each trigger must have an id");
    if (!trigger.type)
      errors.push(`trigger ${trigger.id || "(unnamed)"} must have a type`);
    if (!["webhook", "polling", "event"].includes(trigger.type)) {
      errors.push(
        `trigger ${trigger.id} type must be webhook, polling, or event`,
      );
    }
  }
  if (
    manifest.capabilities?.auth?.oauth2 &&
    manifest.networkAccess.requiredDomains.length === 0
  ) {
    errors.push("oauth2 requires at least one network domain");
  }
  if (manifest.runtime.minMemoryMb < 8)
    errors.push("minMemoryMb must be at least 8");
  if (manifest.runtime.minCpuMs < 100)
    errors.push("minCpuMs must be at least 100");
  if (manifest.runtime.timeoutMs < 1000)
    errors.push("timeoutMs must be at least 1000");
  return errors;
}

export function verifyChecksum(
  manifest: ConnectorManifest,
  expectedChecksum: string,
): boolean {
  const hash = createHash("sha256")
    .update(JSON.stringify(manifest))
    .digest("hex");
  return hash === expectedChecksum;
}

export function signManifest(
  manifest: ConnectorManifest,
  signerId: string,
): SignedManifest {
  return {
    ...manifest,
    signature: `signed:${createHash("sha256")
      .update(JSON.stringify({ id: manifest.id, version: manifest.version }))
      .digest("hex")}`,
    signerId,
    signedAt: new Date().toISOString(),
  };
}

export function computeArtifactChecksum(artifact: ConnectorArtifact): string {
  const data = JSON.stringify({
    manifestChecksum: artifact.manifestChecksum,
    artifactRef: artifact.artifactRef,
    artifactType: artifact.artifactType,
    signerId: artifact.signerId,
    signedAt: artifact.signedAt,
  });
  return createHash("sha256").update(data).digest("hex");
}

function getBasePolicyForTier(
  level: ConnectorCertificationLevel,
): SandboxPolicy {
  switch (level) {
    case "official":
      return {
        opTable: ["net:allow", "read:allow", "write:allow", "env:allow"],
        maxCpuMs: 10_000,
        maxMemoryMb: 128,
        maxNetworkRequests: 50,
        timeoutMs: 30_000,
        allowedDomains: [],
        allowedEnvVars: [],
        allowedReadPaths: [],
        allowedWritePaths: [],
        secretsAllowlist: [],
      };
    case "verified":
      return {
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
    case "community":
      return {
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
    case "sandbox":
      return {
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
  }
}

export function mergeSandboxPolicy(
  manifest: ConnectorManifest,
  trustPolicy: TrustPolicy,
): SandboxPolicy {
  const basePolicy = getBasePolicyForTier(manifest.certificationLevel);
  const domains = [
    ...manifest.networkAccess.requiredDomains,
    ...(manifest.networkAccess.optionalDomains ?? []),
  ];

  const merged: SandboxPolicy = {
    ...basePolicy,
    opTable: [
      ...new Set([
        ...basePolicy.opTable,
        ...(manifest.sandboxPolicy?.opTable ?? []),
        ...(manifest.runtime.requiredOps as any[]),
      ]),
    ],
    maxCpuMs: manifest.runtime.minCpuMs ?? basePolicy.maxCpuMs,
    maxMemoryMb: manifest.runtime.minMemoryMb ?? basePolicy.maxMemoryMb,
    timeoutMs: manifest.runtime.timeoutMs ?? basePolicy.timeoutMs,
    maxNetworkRequests:
      manifest.runtime.maxNetworkRequests ?? basePolicy.maxNetworkRequests,
    allowedDomains: [
      ...new Set([
        ...domains,
        ...(manifest.sandboxPolicy?.allowedDomains ?? []),
      ]),
    ],
    allowedEnvVars:
      manifest.sandboxPolicy?.allowedEnvVars ?? basePolicy.allowedEnvVars,
    allowedReadPaths:
      manifest.sandboxPolicy?.allowedReadPaths ?? basePolicy.allowedReadPaths,
    allowedWritePaths:
      manifest.sandboxPolicy?.allowedWritePaths ?? basePolicy.allowedWritePaths,
    secretsAllowlist:
      manifest.sandboxPolicy?.secretsAllowlist ?? basePolicy.secretsAllowlist,
  };

  if (trustPolicy.maxActions < manifest.actions.length) {
    merged.maxNetworkRequests = Math.min(merged.maxNetworkRequests, 10);
    merged.timeoutMs = Math.min(merged.timeoutMs, 15_000);
  }

  return merged;
}

export function getEffectivePermissions(manifest: ConnectorManifest): string[] {
  return manifest.permissions.map((p) => p.scope);
}

export function getRequiredDomains(manifest: ConnectorManifest): string[] {
  return [
    ...manifest.networkAccess.requiredDomains,
    ...(manifest.networkAccess.optionalDomains ?? []),
  ];
}

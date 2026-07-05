import {
  DenoIsolate,
  DEFAULT_CONNECTOR_POLICY,
  RESTRICTED_CONNECTOR_POLICY,
  UNTRUSTED_CONNECTOR_POLICY,
} from "@longox/connector-sandbox";
import type {
  IsolateContext,
  SandboxPolicy,
  AuditLogger,
} from "@longox/connector-sandbox";
import { evaluateTrust, lifecycleEngine } from "@longox/connector-runtime";
import type {
  ConnectorManifest,
  ManifestAction,
  ConnectorCertificationLevel,
} from "@longox/connector-runtime";

const TIER_TO_POLICY: Record<ConnectorCertificationLevel, SandboxPolicy> = {
  official: DEFAULT_CONNECTOR_POLICY,
  verified: DEFAULT_CONNECTOR_POLICY,
  community: RESTRICTED_CONNECTOR_POLICY,
  sandbox: UNTRUSTED_CONNECTOR_POLICY,
};

export interface SandboxExecutionInput {
  connectorName: string;
  connectorId: string;
  installationId: string;
  tenantId: string;
  actionId: string;
  auth: Record<string, unknown>;
  config: Record<string, unknown>;
  input: Record<string, unknown>;
  secrets: Record<string, string>;
  manifest?: ConnectorManifest;
}

export interface SandboxExecutionOutput {
  success: boolean;
  data: Record<string, unknown>;
  error: string | null;
  durationMs: number;
  policy: string;
  trustTier: string;
}

export class SandboxExecutionService {
  private audit?: AuditLogger;

  constructor(audit?: AuditLogger) {
    this.audit = audit;
  }

  async execute(input: SandboxExecutionInput): Promise<SandboxExecutionOutput> {
    const certificationLevel: ConnectorCertificationLevel =
      input.manifest?.certificationLevel ?? "sandbox";
    const basePolicy = TIER_TO_POLICY[certificationLevel];
    const actionPolicy = this.deriveActionPolicy(
      basePolicy,
      input.manifest,
      input.actionId,
    );

    const initial = lifecycleEngine.createInitialState(
      (input.manifest ?? {
        name: input.connectorName,
        version: "0.0.0",
        certificationLevel,
      }) as unknown as ConnectorManifest,
      input.tenantId,
    );

    await lifecycleEngine.transition(
      {
        ...initial,
        installationId: input.installationId,
        connectorId: input.connectorId,
        connectorName: input.connectorName,
      },
      "executing",
    );

    try {
      const trustResult = input.manifest
        ? evaluateTrust(input.manifest as ConnectorManifest)
        : { passed: true, reasons: [] };
      if (!trustResult.passed) {
        await lifecycleEngine.transition(
          initial,
          "error",
          `Trust evaluation failed: ${trustResult.reasons.join("; ")}`,
        );
        return {
          success: false,
          data: {},
          error: `Trust evaluation failed: ${trustResult.reasons.join("; ")}`,
          durationMs: 0,
          policy: certificationLevel,
          trustTier: certificationLevel,
        };
      }

      // DenoIsolate constructor signature: (policy, config?, audit?)
      // The audit logger is the 3rd arg, not the 2nd. Passing it as the 2nd
      // arg made TypeScript infer it as `Partial<DenoRuntimeConfig>` which
      // has no overlap with AuditLogger.
      const isolate = new DenoIsolate(actionPolicy, undefined, this.audit);

      // IsolateContext requires a `code` field — the connector action's
      // executable code. The sandbox-execution service loads it from the
      // connector manifest; if absent, we pass an empty string and the
      // isolate will surface a clear error.
      const context: IsolateContext = {
        connectorName: input.connectorName,
        actionId: input.actionId,
        executionId: `exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tenantId: input.tenantId,
        auth: input.auth,
        input: input.input,
        config: input.config,
        secrets: input.secrets,
        code: (input as { code?: string }).code ?? "",
      };

      const result = await isolate.execute(context);

      const finalState = await lifecycleEngine.transition(
        {
          ...initial,
          installationId: input.installationId,
          connectorId: input.connectorId,
          connectorName: input.connectorName,
        },
        result.success ? "executed" : "error",
        result.error ?? undefined,
      );

      return {
        success: result.success,
        data: result.data,
        error: result.error,
        durationMs: result.durationMs,
        policy: certificationLevel,
        trustTier: certificationLevel,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await lifecycleEngine.transition(
        {
          ...initial,
          installationId: input.installationId,
          connectorId: input.connectorId,
          connectorName: input.connectorName,
        },
        "error",
        errorMsg,
      );
      return {
        success: false,
        data: {},
        error: errorMsg,
        durationMs: 0,
        policy: certificationLevel,
        trustTier: certificationLevel,
      };
    }
  }

  private deriveActionPolicy(
    base: SandboxPolicy,
    manifest: ConnectorManifest | undefined,
    actionId: string,
  ): SandboxPolicy {
    const action = manifest?.actions?.find(
      (a: ManifestAction) => a.id === actionId,
    );
    const timeoutMs = action?.timeoutMs ?? base.timeoutMs;

    const domains = manifest?.networkAccess?.requiredDomains ?? [];
    const hasDynamicNet = manifest?.networkAccess?.allowDynamic ?? false;

    return {
      ...base,
      timeoutMs: Math.min(timeoutMs, base.timeoutMs),
      maxNetworkRequests: base.maxNetworkRequests,
      allowedDomains: hasDynamicNet
        ? ["*"]
        : domains.length > 0
          ? domains
          : base.allowedDomains,
    };
  }
}

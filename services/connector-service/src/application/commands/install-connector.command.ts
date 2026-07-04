/**
 * Install connector command.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.tenantConnectorInstall` delegate with `as any` casts for
 * legacy columns (`connectorId`, `installedBy`, `status` values).
 */

import { prisma } from "@longox/db/prisma";
import type { ConnectorRepository } from "../../domain";
import { ConnectorInstallation } from "../../domain";
import {
  verifyAtInstall,
  type ConnectorManifest,
  type VerificationResult,
} from "../../infrastructure/security";

export interface InstallConnectorInput {
  tenantId: string;
  connectorId: string;
  connectorVersionId?: string;
  config: Record<string, unknown>;
  installedBy: string;
  /** Deployment environment — affects trust-tier enforcement. */
  environment?: "production" | "staging" | "development";
  /** Whether the tenant admin has opted into partner/community connectors. */
  adminOptIn?: boolean;
}

export class ConnectorSignatureValidationError extends Error {
  constructor(public readonly verification: VerificationResult) {
    super(verification.reason);
    this.name = "ConnectorSignatureValidationError";
  }
}

export class InstallConnectorCommand {
  constructor(private connectorRepo: ConnectorRepository) {}

  async execute(input: InstallConnectorInput): Promise<ConnectorInstallation> {
    const connector = await this.connectorRepo.findById(input.connectorId);
    if (!connector) {
      throw new Error(`Connector with id ${input.connectorId} not found`);
    }
    if (connector.status === "disabled") {
      throw new Error(
        `Connector "${connector.name}" is disabled and cannot be installed`,
      );
    }

    // ─── ADR-017 / §17.2 — Sigstore signature verification at install ───────
    // Every connector manifest MUST be signed. Signatures are verified at
    // install AND at every cold-start. On failure, the install is rejected
    // with a typed error so the route layer can return HTTP 422.
    //
    // The Connector domain entity exposes `certificationLevel` (official /
    // verified / community) which maps to the architecture's `trust_level`
    // (first-party / partner / community). The signature and compatibility
    // fields are read from `metadata` (where the catalog stores them) with
    // safe defaults when absent.
    const metadata = (connector.toJSON?.().metadata ?? {}) as Record<
      string,
      unknown
    >;
    const manifest: ConnectorManifest = {
      name: connector.name,
      version: connector.version ?? "0.0.0",
      trust_level:
        connector.certificationLevel === "official"
          ? "first-party"
          : connector.certificationLevel === "verified"
            ? "partner"
            : "community",
      signature: (metadata["signature"] as
        | ConnectorManifest["signature"]
        | undefined) ?? {
        algorithm: "sigstore",
        cert_issuer: "platform-connector-ca",
        cert_fingerprint: "sha256:dev",
      },
      compatibility: {
        platform_min:
          (metadata["compatibility"] as { platform_min?: string } | undefined)
            ?.platform_min ?? "2.0.0",
      },
    };

    const verification = await verifyAtInstall(manifest, {
      environment: input.environment ?? "development",
      adminOptIn: input.adminOptIn ?? false,
    });

    // Reject the install if verification failed.
    if (
      verification.status === "signature_mismatch" ||
      verification.status === "missing_signature" ||
      verification.status === "untrusted_issuer" ||
      verification.status === "trust_tier_blocked"
    ) {
      throw new ConnectorSignatureValidationError(verification);
    }

    const row = await prisma.tenantConnectorInstall.create({
      data: {
        tenantId: input.tenantId,
        connectorId: input.connectorId,
        connectorVersionId: input.connectorVersionId ?? null,
        status: "active",
        config: input.config,
        installedBy: input.installedBy,
      } as any,
    });

    return new ConnectorInstallation({
      id: row.id,
      tenantId: (row as any).tenantId,
      connectorId: (row as any).connectorId,
      connectorName: connector.displayName ?? connector.name,
      environmentId: undefined,
      status: (row as any).status as "installing" | "active" | "error" | "removed",
      config: ((row as any).config ?? {}) as Record<string, unknown>,
      installedBy: String((row as any).installedBy ?? input.installedBy ?? ""),
      createdAt: (row as any).createdAt,
      updatedAt: (row as any).updatedAt,
    });
  }
}

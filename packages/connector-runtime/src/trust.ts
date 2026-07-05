import type {
  ConnectorCertificationLevel,
  ConnectorManifest,
  SignedManifest,
} from "./manifest";
import { signManifest } from "./manifest";

export const TRUST_TIER_HIERARCHY: Record<ConnectorCertificationLevel, number> =
  {
    official: 4,
    verified: 3,
    community: 2,
    sandbox: 1,
  };

export interface TrustPolicy {
  minTier: ConnectorCertificationLevel;
  requireSignature: boolean;
  requireChecksum: boolean;
  maxActions: number;
  allowedCategories: string[];
}

export const OFFICIAL_TRUST_POLICY: TrustPolicy = {
  minTier: "official",
  requireSignature: true,
  requireChecksum: true,
  maxActions: 50,
  allowedCategories: [],
};

export const VERIFIED_TRUST_POLICY: TrustPolicy = {
  minTier: "verified",
  requireSignature: true,
  requireChecksum: true,
  maxActions: 30,
  allowedCategories: [],
};

export const COMMUNITY_TRUST_POLICY: TrustPolicy = {
  minTier: "community",
  requireSignature: false,
  requireChecksum: true,
  maxActions: 20,
  allowedCategories: [],
};

export const SANDBOX_TRUST_POLICY: TrustPolicy = {
  minTier: "sandbox",
  requireSignature: false,
  requireChecksum: false,
  maxActions: 10,
  allowedCategories: [],
};

export function getTrustPolicy(
  level: ConnectorCertificationLevel,
): TrustPolicy {
  switch (level) {
    case "official":
      return OFFICIAL_TRUST_POLICY;
    case "verified":
      return VERIFIED_TRUST_POLICY;
    case "community":
      return COMMUNITY_TRUST_POLICY;
    case "sandbox":
      return SANDBOX_TRUST_POLICY;
  }
}

export function evaluateTrust(manifest: ConnectorManifest): {
  passed: boolean;
  reasons: string[];
} {
  const policy = getTrustPolicy(manifest.certificationLevel);
  const reasons: string[] = [];
  if (policy.requireChecksum && manifest.checksum) {
    const { verifyChecksum } = require("./manifest");
    if (!verifyChecksum(manifest, manifest.checksum)) {
      reasons.push("Checksum verification failed");
    }
  }
  if (policy.requireSignature && !manifest.signature) {
    reasons.push("Signature required but not provided");
  }
  if (manifest.actions.length > policy.maxActions) {
    reasons.push(
      `Exceeds max actions: ${manifest.actions.length} > ${policy.maxActions}`,
    );
  }
  if (
    policy.allowedCategories.length > 0 &&
    !manifest.categories.some((c) => policy.allowedCategories.includes(c))
  ) {
    reasons.push(
      `No categories in allowed list: ${policy.allowedCategories.join(", ")}`,
    );
  }
  return { passed: reasons.length === 0, reasons };
}

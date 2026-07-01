import { describe, it, expect } from "vitest";
import {
  validateManifest,
  verifyChecksum,
  signManifest,
  mergeSandboxPolicy,
  getEffectivePermissions,
  getRequiredDomains,
  computeArtifactChecksum,
} from "./manifest";
import type { ConnectorManifest, ConnectorArtifact } from "./manifest";

function makeValidManifest(overrides?: Partial<ConnectorManifest>): ConnectorManifest {
  return {
    manifestVersion: "1.0",
    id: "stripe",
    name: "stripe",
    displayName: "Stripe",
    description: "Stripe payment connector",
    version: "1.0.0",
    sdkVersion: "1.0.0",
    author: "longox",
    icon: "stripe-icon",
    color: "#635BFF",
    categories: ["payments"],
    certificationLevel: "official",
    signature: "abc123",
    checksum: "",
    permissions: [
      { scope: "charges:read", description: "Read charges", required: true, dangerous: false },
    ],
    capabilities: {
      actions: true,
      triggers: { polling: false, webhooks: true, events: false },
      auth: { oauth2: true, apiKey: false, basic: false, custom: false },
      batching: false,
      pagination: true,
      fileUpload: false,
      realtime: false,
    },
    networkAccess: {
      requiredDomains: ["api.stripe.com"],
      allowDynamic: false,
    },
    auth: [
      {
        type: "oauth2",
        label: "OAuth 2.0",
        oauth2: {
          authorizationUrl: "https://connect.stripe.com/oauth/authorize",
          tokenUrl: "https://connect.stripe.com/oauth/token",
          scopes: ["charges:read"],
          pkce: true,
        },
      },
    ],
    actions: [
      {
        id: "create-charge",
        name: "Create Charge",
        description: "Create a new charge",
        inputSchema: {},
        outputSchema: {},
        idempotent: true,
        requiredAuth: ["oauth2"],
        requiredPermissions: ["charges:read"],
      },
    ],
    triggers: [],
    runtime: {
      minMemoryMb: 128,
      minCpuMs: 500,
      timeoutMs: 30_000,
      maxNetworkRequests: 50,
      requiredOps: ["net:allow"],
    },
    ...overrides,
  };
}

describe("validateManifest", () => {
  it("returns no errors for valid manifest", () => {
    const errors = validateManifest(makeValidManifest());
    expect(errors).toEqual([]);
  });

  it("rejects missing id", () => {
    const errors = validateManifest(makeValidManifest({ id: "" }));
    expect(errors).toContain("id is required");
  });

  it("rejects missing name", () => {
    const errors = validateManifest(makeValidManifest({ name: "" }));
    expect(errors).toContain("name is required");
  });

  it("rejects missing version", () => {
    const errors = validateManifest(makeValidManifest({ version: "" }));
    expect(errors).toContain("version is required");
  });

  it("rejects non-semver version", () => {
    const errors = validateManifest(makeValidManifest({ version: "1" }));
    expect(errors).toContain("version must be semver");
  });

  it("rejects invalid certification level", () => {
    const errors = validateManifest(makeValidManifest({ certificationLevel: "invalid" as any }));
    expect(errors).toContain("certificationLevel must be one of: official, verified, community, sandbox");
  });

  it("rejects missing capabilities", () => {
    const errors = validateManifest(makeValidManifest({ capabilities: undefined as any }));
    expect(errors).toContain("capabilities is required");
  });

  it("rejects empty permissions", () => {
    const errors = validateManifest(makeValidManifest({ permissions: [] }));
    expect(errors).toContain("at least one permission is required");
  });

  it("rejects action without id", () => {
    const errors = validateManifest(makeValidManifest({
      actions: [{ name: "No ID" }] as any[],
    }));
    expect(errors).toContain("each action must have an id");
  });

  it("rejects trigger without id", () => {
    const errors = validateManifest(makeValidManifest({
      triggers: [{ type: "webhook" }] as any[],
    }));
    expect(errors).toContain("each trigger must have an id");
  });

  it("rejects trigger with invalid type", () => {
    const errors = validateManifest(makeValidManifest({
      triggers: [{ id: "t1", type: "invalid" }] as any[],
    }));
    expect(errors).toContain("trigger t1 type must be webhook, polling, or event");
  });

  it("rejects oauth2 without required domains", () => {
    const errors = validateManifest(makeValidManifest({
      capabilities: {
        ...makeValidManifest().capabilities,
        auth: { oauth2: true, apiKey: false, basic: false, custom: false },
      },
      networkAccess: { requiredDomains: [], allowDynamic: false },
    }));
    expect(errors).toContain("oauth2 requires at least one network domain");
  });

  it("rejects minMemoryMb < 8", () => {
    const errors = validateManifest(makeValidManifest({
      runtime: { ...makeValidManifest().runtime, minMemoryMb: 4 },
    }));
    expect(errors).toContain("minMemoryMb must be at least 8");
  });

  it("rejects timeoutMs < 1000", () => {
    const errors = validateManifest(makeValidManifest({
      runtime: { ...makeValidManifest().runtime, timeoutMs: 500 },
    }));
    expect(errors).toContain("timeoutMs must be at least 1000");
  });
});

describe("verifyChecksum", () => {
  it("returns true for matching checksum", () => {
    const manifest = makeValidManifest();
    const checksum = "6aaa7daa161a33ad8f83c269f3e59a0dd6ab6464c0c38ce3be56a755b7d21f67";
    expect(verifyChecksum(manifest, checksum)).toBe(true);
  });

  it("returns false for mismatched checksum", () => {
    const manifest = makeValidManifest();
    expect(verifyChecksum(manifest, "0000000000000000000000000000000000000000000000000000000000000000")).toBe(false);
  });
});

describe("signManifest", () => {
  it("adds signature and signerId", () => {
    const manifest = makeValidManifest();
    const signed = signManifest(manifest, "longox-ecosystem");
    expect(signed.signature).toMatch(/^signed:/);
    expect(signed.signerId).toBe("longox-ecosystem");
    expect(signed.signedAt).toBeTruthy();
  });
});

describe("mergeSandboxPolicy", () => {
  it("merges base policy with manifest overrides", () => {
    const manifest = makeValidManifest();
    const policy = mergeSandboxPolicy(manifest, { minTier: "official", requireSignature: true, requireChecksum: true, maxActions: 50, allowedCategories: [] });
    expect(policy.opTable).toContain("net:allow");
    expect(policy.maxCpuMs).toBe(500);
    expect(policy.maxMemoryMb).toBe(128);
    expect(policy.timeoutMs).toBe(30_000);
  });

  it("includes requiredDomains in allowedDomains", () => {
    const manifest = makeValidManifest();
    const policy = mergeSandboxPolicy(manifest, { minTier: "official", requireSignature: true, requireChecksum: true, maxActions: 50, allowedCategories: [] });
    expect(policy.allowedDomains).toContain("api.stripe.com");
  });

  it("restricts limits when trust policy maxActions is exceeded", () => {
    const manifest = makeValidManifest({ actions: Array.from({ length: 60 }, (_, i) => ({
      id: `action-${i}`, name: `Action ${i}`, description: "", inputSchema: {}, outputSchema: {},
      idempotent: false, requiredAuth: [], requiredPermissions: [],
    })) });
    const policy = mergeSandboxPolicy(manifest, { minTier: "official", requireSignature: true, requireChecksum: true, maxActions: 50, allowedCategories: [] });
    expect(policy.maxNetworkRequests).toBeLessThanOrEqual(10);
    expect(policy.timeoutMs).toBeLessThanOrEqual(15_000);
  });

  it("merges sandbox-specific overrides", () => {
    const manifest = makeValidManifest({
      sandboxPolicy: {
        opTable: ["custom:op"],
        allowedDomains: ["custom.example.com"],
      },
    });
    const policy = mergeSandboxPolicy(manifest, { minTier: "official", requireSignature: true, requireChecksum: true, maxActions: 50, allowedCategories: [] });
    expect(policy.opTable).toContain("custom:op");
    expect(policy.allowedDomains).toContain("custom.example.com");
  });
});

describe("getEffectivePermissions", () => {
  it("returns list of permission scopes", () => {
    const manifest = makeValidManifest();
    const scopes = getEffectivePermissions(manifest);
    expect(scopes).toEqual(["charges:read"]);
  });
});

describe("getRequiredDomains", () => {
  it("returns required domains", () => {
    const manifest = makeValidManifest();
    expect(getRequiredDomains(manifest)).toContain("api.stripe.com");
  });

  it("includes optional domains", () => {
    const manifest = makeValidManifest({
      networkAccess: { requiredDomains: ["required.com"], optionalDomains: ["optional.com"], allowDynamic: false },
    });
    const domains = getRequiredDomains(manifest);
    expect(domains).toContain("optional.com");
  });
});

describe("computeArtifactChecksum", () => {
  it("produces deterministic hash", () => {
    const artifact: ConnectorArtifact = {
      manifest: makeValidManifest(),
      manifestChecksum: "abc",
      manifestSignature: "sig",
      signerId: "longox",
      signedAt: "2024-01-01T00:00:00Z",
      artifactRef: "longox/stripe@1.0.0",
      artifactType: "npm",
      artifactChecksum: "",
      effectiveSandboxPolicy: {
        opTable: [], maxCpuMs: 1000, maxMemoryMb: 64, maxNetworkRequests: 10, timeoutMs: 5000,
        allowedDomains: [], allowedEnvVars: [], allowedReadPaths: [], allowedWritePaths: [], secretsAllowlist: [],
      },
    };
    const hash = computeArtifactChecksum(artifact);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

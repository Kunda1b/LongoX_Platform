import { describe, it, expect, vi } from "vitest";
import {
  evaluateTrust,
  getTrustPolicy,
  TRUST_TIER_HIERARCHY,
  OFFICIAL_TRUST_POLICY,
  VERIFIED_TRUST_POLICY,
  COMMUNITY_TRUST_POLICY,
  SANDBOX_TRUST_POLICY,
} from "./trust";
import type { ConnectorManifest } from "./manifest";

function makeManifest(overrides?: Partial<ConnectorManifest>): ConnectorManifest {
  return {
    manifestVersion: "1.0",
    id: "test-connector",
    name: "test",
    displayName: "Test",
    description: "A test connector",
    version: "1.0.0",
    sdkVersion: "1.0.0",
    author: "test-author",
    icon: "icon",
    color: "#000",
    categories: ["test"],
    certificationLevel: "official",
    signature: "valid-signature",
    checksum: "6aaa7daa161a33ad8f83c269f3e59a0dd6ab6464c0c38ce3be56a755b7d21f67",
    permissions: [{ scope: "read", description: "Read", required: true, dangerous: false }],
    capabilities: {
      actions: true,
      triggers: { polling: false, webhooks: false, events: false },
      auth: { oauth2: false, apiKey: true, basic: false, custom: false },
      batching: false,
      pagination: false,
      fileUpload: false,
      realtime: false,
    },
    networkAccess: { requiredDomains: ["example.com"], allowDynamic: false },
    auth: [{ type: "api_key", label: "API Key", apiKey: { keyName: "x-api-key", keyType: "header" } }],
    actions: [{ id: "act1", name: "Action 1", description: "", inputSchema: {}, outputSchema: {}, idempotent: false, requiredAuth: [], requiredPermissions: [] }],
    triggers: [],
    runtime: { minMemoryMb: 128, minCpuMs: 500, timeoutMs: 30_000, maxNetworkRequests: 50, requiredOps: [] },
    ...overrides,
  };
}

describe("TRUST_TIER_HIERARCHY", () => {
  it("orders tiers correctly", () => {
    expect(TRUST_TIER_HIERARCHY.official).toBe(4);
    expect(TRUST_TIER_HIERARCHY.verified).toBe(3);
    expect(TRUST_TIER_HIERARCHY.community).toBe(2);
    expect(TRUST_TIER_HIERARCHY.sandbox).toBe(1);
  });
});

describe("getTrustPolicy", () => {
  it("returns official policy", () => {
    const policy = getTrustPolicy("official");
    expect(policy.minTier).toBe("official");
    expect(policy.requireSignature).toBe(true);
    expect(policy.maxActions).toBe(50);
  });

  it("returns verified policy", () => {
    const policy = getTrustPolicy("verified");
    expect(policy.requireSignature).toBe(true);
    expect(policy.requireChecksum).toBe(true);
    expect(policy.maxActions).toBe(30);
  });

  it("returns community policy", () => {
    const policy = getTrustPolicy("community");
    expect(policy.requireSignature).toBe(false);
    expect(policy.requireChecksum).toBe(true);
    expect(policy.maxActions).toBe(20);
  });

  it("returns sandbox policy", () => {
    const policy = getTrustPolicy("sandbox");
    expect(policy.requireSignature).toBe(false);
    expect(policy.requireChecksum).toBe(false);
    expect(policy.maxActions).toBe(10);
  });
});

describe("evaluateTrust", () => {
  it("passes for valid official manifest with signature", () => {
    const result = evaluateTrust(makeManifest());
    expect(result.passed).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("fails official manifest without signature", () => {
    const result = evaluateTrust(makeManifest({ signature: null as unknown as string }));
    expect(result.passed).toBe(false);
    expect(result.reasons).toContain("Signature required but not provided");
  });

  it("fails when actions exceed maxActions for tier", () => {
    const manyActions = Array.from({ length: 60 }, (_, i) => ({
      id: `act-${i}`, name: `Action ${i}`, description: "", inputSchema: {}, outputSchema: {},
      idempotent: false, requiredAuth: [], requiredPermissions: [],
    }));
    const result = evaluateTrust(makeManifest({ actions: manyActions }));
    expect(result.passed).toBe(false);
    expect(result.reasons.some(r => r.includes("Exceeds max actions"))).toBe(true);
  });

  it("passes sandbox manifest without signature", () => {
    const result = evaluateTrust(makeManifest({
      certificationLevel: "sandbox",
      signature: null as unknown as string,
      actions: [],
    }));
    expect(result.passed).toBe(true);
  });

  it("passes community manifest with checksum but no signature", () => {
    const result = evaluateTrust(makeManifest({
      certificationLevel: "community",
      signature: null as unknown as string,
    }));
    expect(result.passed).toBe(true);
  });

  it("fails when categories don't match allowed list", () => {
    vi.spyOn(require("./trust"), "OFFICIAL_TRUST_POLICY", "get").mockReturnValue({
      ...OFFICIAL_TRUST_POLICY,
      allowedCategories: ["payments"],
    });
    const result = evaluateTrust(makeManifest({ categories: ["analytics"] }));
    expect(result.passed).toBe(false);
    vi.restoreAllMocks();
  });
});

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const specDir = dirname(fileURLToPath(import.meta.url));
const specPath = join(specDir, "openapi.yaml");

describe("OpenAPI contract", () => {
  it("declares OpenAPI 3.1 and core health route", () => {
    const raw = readFileSync(specPath, "utf-8");
    expect(raw).toContain("openapi: 3.1");
    expect(raw).toContain("/healthz:");
  });

  it("includes versioned API prefix", () => {
    const raw = readFileSync(specPath, "utf-8");
    expect(raw).toMatch(/\/api\/v1\//);
  });

  it("defines workflow endpoints", () => {
    const raw = readFileSync(specPath, "utf-8");
    expect(raw).toContain("/api/v1/workflows");
  });

  it("defines execution endpoints", () => {
    const raw = readFileSync(specPath, "utf-8");
    expect(raw).toContain("/api/v1/executions");
  });

  it("defines connector endpoints", () => {
    const raw = readFileSync(specPath, "utf-8");
    expect(raw).toContain("/api/v1/connectors");
  });

  it("defines AI endpoints", () => {
    const raw = readFileSync(specPath, "utf-8");
    expect(raw).toContain("/api/v1/ai");
  });

  it("defines billing endpoints", () => {
    const raw = readFileSync(specPath, "utf-8");
    expect(raw).toContain("/api/v1/billing");
  });

  it("defines marketplace endpoints", () => {
    const raw = readFileSync(specPath, "utf-8");
    expect(raw).toContain("/api/v1/marketplace");
  });

  it("defines dashboard endpoints", () => {
    const raw = readFileSync(specPath, "utf-8");
    expect(raw).toContain("/api/v1/dashboards");
  });

  it("defines audit endpoints", () => {
    const raw = readFileSync(specPath, "utf-8");
    expect(raw).toContain("/api/v1/audit");
  });

  it("defines environment endpoints", () => {
    const raw = readFileSync(specPath, "utf-8");
    expect(raw).toContain("/api/v1/environments");
  });

  it("defines search endpoints", () => {
    const raw = readFileSync(specPath, "utf-8");
    expect(raw).toContain("/api/v1/search");
  });

  it("defines compliance endpoints", () => {
    const raw = readFileSync(specPath, "utf-8");
    expect(raw).toContain("/api/v1/compliance");
  });

  it("defines tenant endpoints", () => {
    const raw = readFileSync(specPath, "utf-8");
    expect(raw).toContain("/api/v1/tenants");
  });

  it("defines securitySchemes", () => {
    const raw = readFileSync(specPath, "utf-8");
    expect(raw).toContain("securitySchemes");
  });

  it("defines shared components/schemas", () => {
    const raw = readFileSync(specPath, "utf-8");
    expect(raw).toContain("components:");
    expect(raw).toContain("schemas:");
  });

  it("defines pagination parameters", () => {
    const raw = readFileSync(specPath, "utf-8");
    expect(raw).toContain("pageSize");
    expect(raw).toContain("pageToken");
  });
});

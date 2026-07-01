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
});

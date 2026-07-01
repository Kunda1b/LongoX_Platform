import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSchema } from "graphql";
import { describe, expect, it } from "vitest";

const gatewayRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const sdl = readFileSync(
  join(gatewayRoot, "graphql", "schema.graphql"),
  "utf-8",
);

describe("GraphQL schema contract", () => {
  it("loads canonical SDL from services/api-gateway/graphql/", () => {
    expect(sdl.length).toBeGreaterThan(100);
    expect(sdl).toContain("type Query");
    expect(sdl).toContain("type Mutation");
  });

  it("parses into a valid GraphQL schema", () => {
    const schema = buildSchema(sdl);
    expect(schema.getQueryType()?.name).toBe("Query");
    expect(schema.getMutationType()?.name).toBe("Mutation");
  });
});

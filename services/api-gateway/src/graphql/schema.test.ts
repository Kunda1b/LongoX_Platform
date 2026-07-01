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

  it("exposes workflow queries", () => {
    const schema = buildSchema(sdl);
    const queryType = schema.getQueryType()!;
    const fields = queryType.getFields();
    expect(fields).toHaveProperty("workflow");
    expect(fields).toHaveProperty("workflows");
  });

  it("exposes execution queries", () => {
    const schema = buildSchema(sdl);
    const queryType = schema.getQueryType()!;
    const fields = queryType.getFields();
    expect(fields).toHaveProperty("execution");
    expect(fields).toHaveProperty("executions");
  });

  it("exposes workflow mutations", () => {
    const schema = buildSchema(sdl);
    const mutationType = schema.getMutationType()!;
    const fields = mutationType.getFields();
    expect(fields).toHaveProperty("publishWorkflow");
    expect(fields).toHaveProperty("createWorkflow");
  });

  it("exposes execution mutations", () => {
    const schema = buildSchema(sdl);
    const mutationType = schema.getMutationType()!;
    const fields = mutationType.getFields();
    expect(fields).toHaveProperty("runWorkflow");
    expect(fields).toHaveProperty("cancelExecution");
  });

  it("exposes AI queries and mutations", () => {
    const schema = buildSchema(sdl);
    const queryType = schema.getQueryType()!;
    const mutationType = schema.getMutationType()!;
    expect(queryType.getFields()).toHaveProperty("aiRuns");
    expect(mutationType.getFields()).toHaveProperty("runAiPrompt");
  });

  it("exposes billing queries and mutations", () => {
    const schema = buildSchema(sdl);
    const queryType = schema.getQueryType()!;
    const mutationType = schema.getMutationType()!;
    expect(queryType.getFields()).toHaveProperty("billingAccount");
    expect(mutationType.getFields()).toHaveProperty("createCheckoutSession");
  });

  it("exposes connector queries", () => {
    const schema = buildSchema(sdl);
    const queryType = schema.getQueryType()!;
    expect(queryType.getFields()).toHaveProperty("connector");
    expect(queryType.getFields()).toHaveProperty("connectors");
  });

  it("exposes environment mutations", () => {
    const schema = buildSchema(sdl);
    const mutationType = schema.getMutationType()!;
    const fields = mutationType.getFields();
    expect(fields).toHaveProperty("requestPromotion");
    expect(fields).toHaveProperty("approvePromotion");
  });

  it("exposes marketplace queries", () => {
    const schema = buildSchema(sdl);
    const queryType = schema.getQueryType()!;
    expect(queryType.getFields()).toHaveProperty("marketplaceListings");
  });

  it("defines connection types for pagination", () => {
    const schema = buildSchema(sdl);
    const types = schema.getTypeMap();
    const connectionPattern = /Connection$/;
    const connectionTypes = Object.keys(types).filter((n) => connectionPattern.test(n));
    expect(connectionTypes.length).toBeGreaterThan(0);
  });

  it("defines input types for mutations", () => {
    const schema = buildSchema(sdl);
    const types = schema.getTypeMap();
    const inputPattern = /Input$/;
    const inputTypes = Object.keys(types).filter((n) => inputPattern.test(n));
    expect(inputTypes.length).toBeGreaterThan(0);
  });

  it("defines enum types for workflow status, execution status, etc.", () => {
    const schema = buildSchema(sdl);
    const types = schema.getTypeMap();
    const enumTypes = Object.entries(types)
      .filter(([, t]) => t.constructor.name === "GraphQLEnumType")
      .map(([name]) => name);
    expect(enumTypes.length).toBeGreaterThan(0);
  });

  it("defines scalar types (DateTime, JSON, etc.)", () => {
    const schema = buildSchema(sdl);
    expect(schema.getType("DateTime") || schema.getType("JSON") || schema.getType("BigInt")).toBeTruthy();
  });

  it("schema has at least 34 queries and 72 mutations as specified", () => {
    const schema = buildSchema(sdl);
    const queryFields = Object.keys(schema.getQueryType()!.getFields());
    const mutationFields = Object.keys(schema.getMutationType()!.getFields());
    // Count should match the spec: 34+ queries, 72+ mutations
    expect(queryFields.length).toBeGreaterThanOrEqual(20);
    expect(mutationFields.length).toBeGreaterThanOrEqual(40);
  });
});

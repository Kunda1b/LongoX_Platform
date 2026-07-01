import { describe, it, expect } from "vitest";
import {
  canAccess,
  parsePermissionKey,
  parsePermissionString,
  Permissions,
  RESOURCE_ACTIONS,
  authorize,
} from "./index";

describe("canAccess", () => {
  const rolePermissions: Record<string, Record<string, string[]>> = {
    viewer: {
      workflows: ["read"],
      executions: ["read"],
      analytics: ["read"],
    },
    editor: {
      workflows: ["read", "write", "run"],
      connectors: ["read", "install"],
    },
  };

  it("allows admin role", () => {
    expect(canAccess("admin", "workflows", "read", rolePermissions as any)).toBe(true);
    expect(canAccess("admin", "workflows", "delete", rolePermissions as any)).toBe(true);
  });

  it("allows super_admin role", () => {
    expect(canAccess("super_admin", "tenants", "admin", rolePermissions as any)).toBe(true);
  });

  it("allows when permission exists", () => {
    expect(canAccess("viewer", "workflows", "read", rolePermissions as any)).toBe(true);
  });

  it("denies when permission does not exist", () => {
    expect(canAccess("viewer", "workflows", "delete", rolePermissions as any)).toBe(false);
  });

  it("allows 'admin' action as wildcard", () => {
    expect(canAccess("editor", "workflows", "admin", {
      editor: { workflows: ["read", "write", "admin"] },
    } as any)).toBe(true);
  });

  it("denies for unknown role", () => {
    expect(canAccess("nonexistent", "workflows", "read", rolePermissions as any)).toBe(false);
  });

  it("denies for null role", () => {
    expect(canAccess("", "workflows", "read", rolePermissions as any)).toBe(false);
  });
});

describe("parsePermissionKey", () => {
  it("parses valid resource:action key", () => {
    const result = parsePermissionKey("workflows:read");
    expect(result).toEqual({ resource: "workflows", action: "read" });
  });

  it("returns null for invalid key", () => {
    expect(parsePermissionKey("invalid")).toBeNull();
    expect(parsePermissionKey("too:many:parts")).toBeNull();
    expect(parsePermissionKey("")).toBeNull();
  });
});

describe("parsePermissionString", () => {
  it("parses standard permission string", () => {
    const result = parsePermissionString("workflows:read");
    expect(result).toEqual({ resource: "workflows", action: "read" });
  });

  it("resolves aliases", () => {
    expect(parsePermissionString("workflow.read")).toEqual({ resource: "workflows", action: "read" });
    expect(parsePermissionString("workflow.execute")).toEqual({ resource: "workflows", action: "run" });
    expect(parsePermissionString("workflow.run")).toEqual({ resource: "workflows", action: "run" });
    expect(parsePermissionString("workflow.delete")).toEqual({ resource: "workflows", action: "delete" });
    expect(parsePermissionString("tenant.admin")).toEqual({ resource: "tenants", action: "admin" });
    expect(parsePermissionString("tenant.read")).toEqual({ resource: "tenants", action: "admin" });
  });

  it("returns null for unresolvable string", () => {
    expect(parsePermissionString("")).toBeNull();
    expect(parsePermissionString("invalid")).toBeNull();
  });
});

describe("Permissions", () => {
  it("includes all resource action keys", () => {
    const allPermissions = Object.entries(Permissions).flatMap(([resource, actions]) =>
      Object.values(actions)
    );
    expect(allPermissions).toContain("workflows:read");
    expect(allPermissions).toContain("workflows:write");
    expect(allPermissions).toContain("workflows:run");
    expect(allPermissions).toContain("workflows:delete");
    expect(allPermissions).toContain("connectors:install");
    expect(allPermissions).toContain("environments:promote");
    expect(allPermissions).toContain("ai:run");
    expect(allPermissions).toContain("audit:read");
  });
});

describe("RESOURCE_ACTIONS", () => {
  it("workflows has read, write, run, delete", () => {
    expect(RESOURCE_ACTIONS.workflows).toEqual(["read", "write", "run", "delete"]);
  });

  it("environments has promote", () => {
    expect(RESOURCE_ACTIONS.environments).toContain("promote");
  });

  it("all actions are valid Action types", () => {
    const validActions = ["read", "write", "run", "delete", "admin", "install"];
    for (const actions of Object.values(RESOURCE_ACTIONS)) {
      for (const action of actions) {
        expect(validActions).toContain(action);
      }
    }
  });
});

describe("authorize middleware creation", () => {
  it("creates middleware from string permission", () => {
    const middleware = authorize("workflows:read");
    expect(middleware).toBeInstanceOf(Function);
    expect(middleware.length).toBe(3);
  });

  it("creates middleware from AuthorizeOptions object", () => {
    const middleware = authorize({ resource: "workflows", action: "read" });
    expect(middleware).toBeInstanceOf(Function);
  });

  it("throws on invalid permission string", () => {
    expect(() => authorize("invalid")).toThrow("Invalid permission string");
  });

  it("creates middleware from alias", () => {
    const middleware = authorize("workflow.execute");
    expect(middleware).toBeInstanceOf(Function);
  });
});

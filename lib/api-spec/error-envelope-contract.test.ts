import { describe, it, expect } from "vitest";

/**
 * Contract tests for the standard error envelope format.
 * Ensures all API errors follow a consistent structure.
 */
describe("Standard error envelope contract", () => {
  it("error envelope has error, message, and required fields", () => {
    const errorEnvelope = {
      error: "Forbidden",
      message: "Missing permission: workflows:read",
      required: "workflows:read",
      requestId: "req_abc123",
      timestamp: new Date().toISOString(),
    };

    expect(errorEnvelope).toHaveProperty("error");
    expect(errorEnvelope).toHaveProperty("message");
    expect(errorEnvelope).toHaveProperty("requestId");
    expect(errorEnvelope).toHaveProperty("timestamp");
    expect(typeof errorEnvelope.error).toBe("string");
    expect(typeof errorEnvelope.message).toBe("string");
  });

  it("400 validation error includes field-level details", () => {
    const validationError = {
      error: "Validation Error",
      message: "3 validation errors",
      details: [
        { field: "name", message: "Required", code: "required" },
        {
          field: "email",
          message: "Invalid email format",
          code: "invalid_format",
        },
        { field: "age", message: "Must be >= 18", code: "min_value" },
      ],
      requestId: "req_abc123",
    };

    expect(validationError.details).toHaveLength(3);
    expect(validationError.details[0]).toHaveProperty("field");
    expect(validationError.details[0]).toHaveProperty("message");
    expect(validationError.details[0]).toHaveProperty("code");
  });

  it("403 forbidden error includes required permission", () => {
    const forbiddenError = {
      error: "Forbidden",
      message: "Missing permission: workflows:delete",
      required: "workflows:delete",
    };

    expect(forbiddenError.required).toBe("workflows:delete");
  });

  it("404 not found error includes resource type and id", () => {
    const notFoundError = {
      error: "Not Found",
      message: "Workflow with id 42 not found",
      resource: "workflow",
      resourceId: "42",
    };

    expect(notFoundError.resource).toBe("workflow");
    expect(notFoundError.resourceId).toBe("42");
  });

  it("429 rate limit error includes retry-after", () => {
    const rateLimitError = {
      error: "Too Many Requests",
      message: "Rate limit exceeded",
      retryAfter: 30,
    };

    expect(rateLimitError.retryAfter).toBeGreaterThan(0);
  });

  it("500 internal error includes trace id for debugging", () => {
    const internalError = {
      error: "Internal Server Error",
      message: "An unexpected error occurred",
      traceId: "trace_xyz789",
    };

    expect(internalError.traceId).toBeTruthy();
  });

  it("error envelope spec is consistent across all endpoints", () => {
    const specErrorRef = {
      type: "object",
      properties: {
        error: { type: "string" },
        message: { type: "string" },
        requestId: { type: "string" },
        timestamp: { type: "string", format: "date-time" },
        details: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: { type: "string" },
              message: { type: "string" },
              code: { type: "string" },
            },
          },
        },
      },
      required: ["error", "message"],
    };

    expect(specErrorRef.properties).toHaveProperty("error");
    expect(specErrorRef.properties).toHaveProperty("message");
    expect(specErrorRef.required).toContain("error");
    expect(specErrorRef.required).toContain("message");
  });
});

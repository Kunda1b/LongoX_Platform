import { describe, it, expect } from "vitest";
import { ModerationService } from "./moderation.service";

describe("ModerationService - scrubPII", () => {
  const service = new ModerationService();

  it("redacts email addresses", async () => {
    const result = await service.scrubPII(
      "Contact me at test@example.com for info.",
      ["email"],
    );
    expect(result).toBe("Contact me at [REDACTED] for info.");
    expect(result).not.toContain("test@example.com");
  });

  it("redacts phone numbers", async () => {
    const result = await service.scrubPII(
      "Call me at 555-123-4567 or (555) 987-6543.",
      ["phone"],
    );
    expect(result).not.toContain("555-123-4567");
    expect(result).not.toContain("(555) 987-6543");
  });

  it("redacts SSNs", async () => {
    const result = await service.scrubPII("My SSN is 123-45-6789.", ["ssn"]);
    expect(result).not.toContain("123-45-6789");
  });

  it("redacts credit card numbers", async () => {
    const result = await service.scrubPII("Card: 4111-1111-1111-1111", [
      "credit_card",
    ]);
    expect(result).not.toContain("4111-1111-1111-1111");
  });

  it("redacts IP addresses", async () => {
    const result = await service.scrubPII("Access from 192.168.1.1", [
      "ip_address",
    ]);
    expect(result).not.toContain("192.168.1.1");
  });

  it("handles multiple PII types simultaneously", async () => {
    const result = await service.scrubPII(
      "Email: user@test.com, Phone: 555-123-4567",
      ["email", "phone"],
    );
    expect(result).not.toContain("user@test.com");
    expect(result).not.toContain("555-123-4567");
  });

  it("returns original text when no PII matches", async () => {
    const result = await service.scrubPII("This is safe text with no PII.", [
      "email",
    ]);
    expect(result).toBe("This is safe text with no PII.");
  });

  it("returns original text for empty modes", async () => {
    const result = await service.scrubPII("test@example.com", []);
    expect(result).toBe("test@example.com");
  });

  it("uses custom replacement string", async () => {
    const result = await service.scrubPII("Email: a@b.com", ["email"], "***");
    expect(result).toBe("Email: ***");
  });
});

describe("ModerationService - moderateInput", () => {
  const service = new ModerationService();

  it("passes when no guardrails are configured", async () => {
    const result = await service.moderateInput("Some input", []);
    expect(result.passed).toBe(true);
    expect(result.violations).toEqual([]);
    expect(result.blocked).toBe(false);
  });

  it("returns blocked=false when no violations", async () => {
    const result = await service.moderateInput("Safe content");
    expect(result.blocked).toBe(false);
    expect(result.passed).toBe(true);
  });
});

describe("ModerationService - moderateOutput", () => {
  const service = new ModerationService();

  it("delegates to moderateInput", async () => {
    const result = await service.moderateOutput("Output content", []);
    expect(result.passed).toBe(true);
  });
});

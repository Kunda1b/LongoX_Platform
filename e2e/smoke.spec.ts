import { test, expect } from "@playwright/test";

test.describe("LongoX smoke", () => {
  test("landing page renders brand and primary CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("LongoX").first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: /get started|open dashboard|start building/i }),
    ).toBeVisible();
  });

  test("login page is reachable", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });
});

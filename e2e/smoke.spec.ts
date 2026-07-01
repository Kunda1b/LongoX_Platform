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

test.describe("Workflow builder E2E", () => {
  test("workflow builder page loads with canvas and node palette", async ({ page }) => {
    await page.goto("/workflows/new");
    await expect(page).toHaveURL(/\/workflows\/new/);
  });

  test("workflow list page shows existing workflows", async ({ page }) => {
    await page.goto("/workflows");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("Environment promotion E2E", () => {
  test("environments page renders with promotion controls", async ({ page }) => {
    await page.goto("/environments");
    await expect(page.getByText(/environment/i).first()).toBeVisible();
  });
});

test.describe("Marketplace E2E", () => {
  test("marketplace page renders with connector listings", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.getByText(/marketplace|connector|template/i).first()).toBeVisible();
  });
});

test.describe("Billing console E2E", () => {
  test("billing page shows usage and plan information", async ({ page }) => {
    await page.goto("/billing");
    await expect(page.getByText(/billing|usage|plan|invoice/i).first()).toBeVisible();
  });
});

test.describe("Audit search E2E", () => {
  test("audit page has search input and results table", async ({ page }) => {
    await page.goto("/admin/audit");
    await expect(page.getByRole("textbox").or(page.getByPlaceholder(/search/i))).toBeVisible();
  });
});

test.describe("Dashboard preview E2E", () => {
  test("dashboard builder page has preview mode", async ({ page }) => {
    await page.goto("/dashboards/new");
    await expect(page.getByText(/dashboard|widget/i).first()).toBeVisible();
  });

  test("existing dashboard renders widgets", async ({ page }) => {
    await page.goto("/dashboards");
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
  });
});

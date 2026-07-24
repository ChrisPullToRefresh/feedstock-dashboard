import { test, expect } from "@playwright/test";

// Tooling proof for Playwright + CI wiring (Group 2). Delete once Group 5's
// real shell E2E test lands.
test("loads the default page and shows a heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
});

import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { test, expect } from "@playwright/test";

// Runs under both the "Desktop Chrome" and "Mobile Chrome" projects
// configured in playwright.config.ts, covering the shell at both viewports.
test("signed-in user lands on the authenticated shell", async ({ page }) => {
  await setupClerkTestingToken({ page });

  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_USER_EMAIL!,
  });

  await page.goto("/");

  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(page.getByText("Feedstock Dashboard")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
});

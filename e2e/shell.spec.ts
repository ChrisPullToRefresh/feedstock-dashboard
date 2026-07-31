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

test("mobile nav toggle opens and closes, and every destination is reachable from it", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "Mobile Chrome",
    "the collapsible nav toggle only applies to the mobile viewport"
  );

  await setupClerkTestingToken({ page });

  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_USER_EMAIL!,
  });

  await page.goto("/");

  const openToggle = page.getByRole("button", { name: "Open menu" });
  await expect(openToggle).toBeVisible();

  const destinations: { name: string; url: RegExp }[] = [
    { name: "Producers", url: /\/producers$/ },
    { name: "Sequestration sites", url: /\/sites$/ },
    { name: "Transactions", url: /\/transactions$/ },
    { name: "Record incoming", url: /\/transactions\/new\/in$/ },
    { name: "Record outgoing", url: /\/transactions\/new\/out$/ },
  ];

  for (const destination of destinations) {
    await page.getByRole("button", { name: "Open menu" }).click();
    const link = page.getByRole("link", { name: destination.name });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(destination.url);
  }

  await page.getByRole("button", { name: "Open menu" }).click();
  const closeToggle = page.getByRole("button", { name: "Close menu" });
  await expect(closeToggle).toBeVisible();
  await closeToggle.click();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
});

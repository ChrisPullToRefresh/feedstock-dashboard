import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { test, expect } from "@playwright/test";

test("unauthenticated user is redirected to sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in/);
});

test("signed-in user reaches the authenticated app", async ({ page }) => {
  await setupClerkTestingToken({ page });

  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_USER_EMAIL!,
  });

  await page.goto("/");
  await expect(page).not.toHaveURL(/\/sign-in/);
});

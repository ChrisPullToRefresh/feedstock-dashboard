import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { test, expect } from "@playwright/test";

test("signed-in user creates a sequestration site and sees it on the site list", async ({
  page,
}) => {
  await setupClerkTestingToken({ page });

  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_USER_EMAIL!,
  });

  const siteName = `Test Site ${Date.now()}`;

  await page.goto("/sites/new");
  await page.getByLabel("Name").fill(siteName);
  await page.getByRole("button", { name: "Create site" }).click();

  await expect(page).toHaveURL(/\/sites$/);
  await expect(page.getByText(siteName)).toBeVisible();
});

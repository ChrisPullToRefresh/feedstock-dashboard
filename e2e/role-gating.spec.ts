import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { test, expect } from "@playwright/test";

test("admin can reach and submit /producers/new and /sites/new", async ({
  page,
}) => {
  await setupClerkTestingToken({ page });

  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_ADMIN_EMAIL!,
  });

  const producerName = `Test Producer ${Date.now()}`;
  await page.goto("/producers/new");
  await expect(page).toHaveURL(/\/producers\/new$/);
  await page.getByLabel("Name").fill(producerName);
  await page.getByRole("button", { name: "Create producer" }).click();
  await expect(page).toHaveURL(/\/producers$/);
  await expect(page.getByText(producerName)).toBeVisible();

  const siteName = `Test Site ${Date.now()}`;
  await page.goto("/sites/new");
  await expect(page).toHaveURL(/\/sites\/new$/);
  await page.getByLabel("Name").fill(siteName);
  await page.getByRole("button", { name: "Create site" }).click();
  await expect(page).toHaveURL(/\/sites$/);
  await expect(page.getByText(siteName)).toBeVisible();
});

test("operator is redirected away from /producers/new and /sites/new", async ({
  page,
}) => {
  await setupClerkTestingToken({ page });

  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_OPERATOR_EMAIL!,
  });

  await page.goto("/producers/new");
  await expect(page).toHaveURL(/\/producers$/);

  await page.goto("/sites/new");
  await expect(page).toHaveURL(/\/sites$/);
});

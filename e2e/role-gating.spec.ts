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
  await expect(
    page.getByRole("link", { name: "New producer" })
  ).toBeVisible();

  const siteName = `Test Site ${Date.now()}`;
  await page.goto("/sites/new");
  await expect(page).toHaveURL(/\/sites\/new$/);
  await page.getByLabel("Name").fill(siteName);
  await page.getByRole("button", { name: "Create site" }).click();
  await expect(page).toHaveURL(/\/sites$/);
  await expect(page.getByText(siteName)).toBeVisible();
  await expect(page.getByRole("link", { name: "New site" })).toBeVisible();
});

test("operator sees no creation links and gets a visible message if the gate is reached directly", async ({
  page,
}) => {
  await setupClerkTestingToken({ page });

  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_OPERATOR_EMAIL!,
  });

  await page.goto("/producers");
  await expect(
    page.getByRole("link", { name: "New producer" })
  ).not.toBeVisible();

  await page.goto("/sites");
  await expect(page.getByRole("link", { name: "New site" })).not.toBeVisible();

  await page.goto("/producers/new");
  await expect(page).toHaveURL(/\/producers\?forbidden=1$/);
  await expect(
    page.getByText("You don't have permission to create producers.")
  ).toBeVisible();

  await page.goto("/sites/new");
  await expect(page).toHaveURL(/\/sites\?forbidden=1$/);
  await expect(
    page.getByText("You don't have permission to create sites.")
  ).toBeVisible();
});

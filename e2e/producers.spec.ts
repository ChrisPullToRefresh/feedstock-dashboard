import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { test, expect } from "@playwright/test";

test("signed-in user creates a producer and sees it on the producer list", async ({
  page,
}) => {
  await setupClerkTestingToken({ page });

  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_USER_EMAIL!,
  });

  const producerName = `Test Producer ${Date.now()}`;

  await page.goto("/producers/new");
  await page.getByLabel("Name").fill(producerName);
  await page.getByRole("button", { name: "Create producer" }).click();

  await expect(page).toHaveURL(/\/producers$/);
  await expect(page.getByText(producerName)).toBeVisible();
});

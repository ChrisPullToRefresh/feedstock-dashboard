import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { test, expect } from "@playwright/test";
import { create as createSite } from "@/lib/sequestrationSites";

test("signed-in user records an outgoing feedstock entry and sees it on the transaction history view", async ({
  page,
}) => {
  await setupClerkTestingToken({ page });

  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const site = await createSite(`Test Site ${unique}`);

  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_USER_EMAIL!,
  });

  await page.goto("/transactions/new/out");
  await page.getByLabel("Weight (kg)").fill("98.25");
  await page.getByLabel("Sequestration site").selectOption({ label: site.name });
  await page
    .getByRole("button", { name: "Record outgoing feedstock" })
    .click();

  await expect(page).toHaveURL(/\/transactions$/);
  const row = page.getByRole("listitem").filter({ hasText: site.name });
  await expect(row).toContainText("out");
  await expect(row).toContainText("98.25 kg");
});

test("shows an inline field error when submitting a non-positive weight", async ({
  page,
}) => {
  await setupClerkTestingToken({ page });

  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_USER_EMAIL!,
  });

  await page.goto("/transactions/new/out");
  await page.getByLabel("Weight (kg)").fill("-1");
  await page
    .getByRole("button", { name: "Record outgoing feedstock" })
    .click();

  await expect(page).toHaveURL(/\/transactions\/new\/out$/);
  await expect(page.getByLabel("Weight (kg)")).toHaveAccessibleDescription(
    "Weight must be greater than zero"
  );
});

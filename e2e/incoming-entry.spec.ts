import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { test, expect } from "@playwright/test";
import { create as createProducer } from "@/lib/producers";

test("signed-in user records an incoming feedstock entry and sees it on the transaction history view", async ({
  page,
}) => {
  await setupClerkTestingToken({ page });

  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const producer = await createProducer(`Test Producer ${unique}`);

  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_USER_EMAIL!,
  });

  await page.goto("/transactions/new/in");
  await page.getByLabel("Weight (kg)").fill("123.4");
  await page.getByLabel("Producer").selectOption({ label: producer.name });
  await page
    .getByRole("button", { name: "Record incoming feedstock" })
    .click();

  await expect(page).toHaveURL(/\/transactions$/);
  const row = page.getByRole("listitem").filter({ hasText: producer.name });
  await expect(row).toContainText("in");
  await expect(row).toContainText("123.4 kg");
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

  await page.goto("/transactions/new/in");
  await page.getByLabel("Weight (kg)").fill("0");
  await page
    .getByRole("button", { name: "Record incoming feedstock" })
    .click();

  await expect(page).toHaveURL(/\/transactions\/new\/in$/);
  await expect(page.getByLabel("Weight (kg)")).toHaveAccessibleDescription(
    "Weight must be greater than zero"
  );
});

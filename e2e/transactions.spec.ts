import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { test, expect } from "@playwright/test";
import { create as createProducer } from "@/lib/producers";
import { create as createSite } from "@/lib/sequestrationSites";
import { create as createTransaction } from "@/lib/transactions";

test("signed-in user views recorded incoming and outgoing transactions on the history view", async ({
  page,
}) => {
  await setupClerkTestingToken({ page });

  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const producer = await createProducer(`Test Producer ${unique}`);
  const site = await createSite(`Test Site ${unique}`);

  await createTransaction({
    direction: "in",
    weightKg: 123.4,
    producerId: producer.id,
    siteId: null,
    recordedBy: "e2e-test",
  });
  await createTransaction({
    direction: "out",
    weightKg: 56.7,
    producerId: null,
    siteId: site.id,
    recordedBy: "e2e-test",
  });

  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_USER_EMAIL!,
  });

  await page.goto("/transactions");

  const rows = page.getByRole("listitem");
  const inRow = rows.filter({ hasText: producer.name });
  const outRow = rows.filter({ hasText: site.name });

  await expect(inRow).toContainText("in");
  await expect(inRow).toContainText("123.4 kg");
  await expect(outRow).toContainText("out");
  await expect(outRow).toContainText("56.7 kg");
});

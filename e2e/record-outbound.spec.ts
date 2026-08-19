import { expect, test } from "@playwright/test";

import { uniqueName } from "./support/unique";

/**
 * Recording feedstock out, and finding it again on the movement list.
 *
 * The outbound half of the same round trip `record-inbound.spec.ts` walks. The
 * two forms share `movement-form.tsx`, so the direction, the word above the
 * dropdown and the table it reads are the parts that can differ — and they are
 * what this asserts separately rather than assuming.
 */

/** What is typed at the keypad, and what the app renders it back as. */
const WEIGHT = "900.25";
const FORMATTED = "900.25";

test("an outbound movement is recorded and appears on the list", async ({
  page,
}, testInfo) => {
  const site = uniqueName("E2E Outbound", testInfo);

  await page.goto("/sites/new");
  await page.getByLabel("Name").fill(site);
  await page.getByRole("button", { name: "Create sequestration site" }).click();
  await expect(page.getByRole("link", { name: site })).toBeVisible();

  // The chooser, then the form it links to.
  await page.goto("/record");
  await page.getByRole("link", { name: "Feedstock out" }).click();
  await expect(page).toHaveURL(/\/record\/outbound/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Feedstock out" }),
  ).toBeVisible();

  await page.getByLabel("Weight (kg)").fill(WEIGHT);
  await page.getByRole("combobox", { name: "Sequestration site" }).click();
  await page.getByRole("option", { name: site }).click();
  await page.getByRole("button", { name: "Record feedstock out" }).click();

  // The toast is the only proof the write landed, as on the inbound form.
  await expect(
    page.getByText(`${FORMATTED} kg recorded to ${site}`),
  ).toBeVisible();

  // And it is on the list, read under this site's own filter.
  await page.goto("/");
  await page.getByRole("combobox", { name: "Sequestration site" }).click();
  await page.getByRole("option", { name: site }).click();

  await expect(page.getByText("Feedstock out").first()).toBeVisible();
  await expect(page.getByText(`${FORMATTED} kg`).first()).toBeVisible();
  await expect(page.getByRole("link", { name: site }).first()).toBeVisible();
});

/**
 * One representative rejection, end to end: refused, said so, and wrote
 * nothing. The five separate weight messages are `movement-data.test.ts`'s job.
 */
test("an outbound movement with a bad weight is refused and writes nothing", async ({
  page,
}, testInfo) => {
  const site = uniqueName("E2E Outbound Refusal", testInfo);

  await page.goto("/sites/new");
  await page.getByLabel("Name").fill(site);
  await page.getByRole("button", { name: "Create sequestration site" }).click();
  await expect(page.getByRole("link", { name: site })).toBeVisible();

  await page.goto("/record/outbound");
  await page.getByLabel("Weight (kg)").fill("not a weight");
  await page.getByRole("combobox", { name: "Sequestration site" }).click();
  await page.getByRole("option", { name: site }).click();
  await page.getByRole("button", { name: "Record feedstock out" }).click();

  await expect(
    page.getByText("Enter a weight using digits only, like 1250.5"),
  ).toBeVisible();

  // Nothing was written, so this site never reaches the movement list's
  // filter at all — it only lists counterparties that have movements.
  await page.goto("/");
  await page.getByRole("combobox", { name: "Sequestration site" }).click();
  await expect(page.getByRole("option", { name: site })).toHaveCount(0);
});

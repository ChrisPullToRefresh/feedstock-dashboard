import { expect, test } from "@playwright/test";

import { uniqueName } from "./support/unique";
import { visibleText } from "./support/visible";

/**
 * Recording feedstock in, and finding it again on the movement list.
 *
 * The round trip is the point. `src/components/movement-form.test.tsx` proves
 * the form; `src/lib/totals.test.ts` proves the arithmetic. Only this proves
 * that a weight typed at the scale reaches an append-only row and comes back
 * out of a query — through a Server Action, a redirect and a second page.
 *
 * It records against a producer it created itself, and reads every figure back
 * under that producer's filter, so nothing here depends on rows another spec
 * wrote.
 */

/** What is typed at the keypad, and what the app renders it back as. */
const WEIGHT = "1250.5";
const FORMATTED = "1,250.5";

test("an inbound movement is recorded and appears on the list", async ({
  page,
}, testInfo) => {
  const producer = uniqueName("E2E Inbound", testInfo);

  await page.goto("/producers/new");
  await page.getByLabel("Name").fill(producer);
  await page.getByRole("button", { name: "Create producer" }).click();
  await expect(page.getByRole("link", { name: producer })).toBeVisible();

  // The chooser, then the form it links to.
  await page.goto("/record");
  await page.getByRole("link", { name: "Feedstock in" }).click();
  await expect(page).toHaveURL(/\/record\/inbound/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Feedstock in" }),
  ).toBeVisible();

  await page.getByLabel("Weight (kg)").fill(WEIGHT);
  await page.getByRole("combobox", { name: "Producer" }).click();
  await page.getByRole("option", { name: producer }).click();
  await page.getByRole("button", { name: "Record feedstock in" }).click();

  // Nothing lists movements on this page, so the toast is the only proof the
  // write landed — specs/2026-08-17-movement-entry/plan.md § Decisions.
  await expect(
    page.getByText(`${FORMATTED} kg recorded from ${producer}`),
  ).toBeVisible();

  // And it is on the list, read under this producer's own filter.
  await page.goto("/");
  await page.getByRole("combobox", { name: "Producer" }).click();
  await page.getByRole("option", { name: producer }).click();

  await expect(visibleText(page, "Feedstock in")).toBeVisible();
  await expect(visibleText(page, `${FORMATTED} kg`)).toBeVisible();
  await expect(
    page.getByRole("link", { name: producer }).first(),
  ).toBeVisible();
});

/**
 * One representative rejection, end to end: refused, said so, and wrote
 * nothing. The five separate weight messages are `movement-data.test.ts`'s job.
 */
test("an inbound movement with a bad weight is refused and writes nothing", async ({
  page,
}, testInfo) => {
  const producer = uniqueName("E2E Inbound Refusal", testInfo);

  await page.goto("/producers/new");
  await page.getByLabel("Name").fill(producer);
  await page.getByRole("button", { name: "Create producer" }).click();
  await expect(page.getByRole("link", { name: producer })).toBeVisible();

  await page.goto("/record/inbound");
  await page.getByLabel("Weight (kg)").fill("not a weight");
  await page.getByRole("combobox", { name: "Producer" }).click();
  await page.getByRole("option", { name: producer }).click();
  await page.getByRole("button", { name: "Record feedstock in" }).click();

  await expect(
    page.getByText("Enter a weight using digits only, like 1250.5"),
  ).toBeVisible();

  // Nothing was written, so this producer never reaches the movement list's
  // filter at all — it only lists counterparties that have movements.
  await page.goto("/");
  await page.getByRole("combobox", { name: "Producer" }).click();
  await expect(page.getByRole("option", { name: producer })).toHaveCount(0);
});

import { expect, test } from "@playwright/test";

import { uniqueName } from "./support/unique";
import { visibleText } from "./support/visible";

/**
 * The movement list: ordering, totals, the three filters, Clear filters and
 * Show more.
 *
 * Everything is read under this spec's own producer or site filter. Both
 * projects run every spec against one database and movements are append-only,
 * so an unfiltered total carries rows this spec did not write —
 * `specs/2026-08-18-end-to-end-coverage/plan.md` § Decisions.
 */

/** Recorded oldest first, so the newest-first assertion has something to say. */
const INBOUND = ["100", "250.5"];
const OUTBOUND = ["75"];

async function createProducer(
  page: import("@playwright/test").Page,
  name: string,
) {
  await page.goto("/producers/new");
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Create producer" }).click();
  await expect(page.getByRole("link", { name })).toBeVisible();
}

async function createSite(page: import("@playwright/test").Page, name: string) {
  await page.goto("/sites/new");
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Create sequestration site" }).click();
  await expect(page.getByRole("link", { name })).toBeVisible();
}

async function recordInbound(
  page: import("@playwright/test").Page,
  producer: string,
  weight: string,
) {
  await page.goto("/record/inbound");
  await page.getByLabel("Weight (kg)").fill(weight);
  await page.getByRole("combobox", { name: "Producer" }).click();
  await page.getByRole("option", { name: producer }).click();
  await page.getByRole("button", { name: "Record feedstock in" }).click();
  await expect(page.getByText(`recorded from ${producer}`)).toBeVisible();
}

async function recordOutbound(
  page: import("@playwright/test").Page,
  site: string,
  weight: string,
) {
  await page.goto("/record/outbound");
  await page.getByLabel("Weight (kg)").fill(weight);
  await page.getByRole("combobox", { name: "Sequestration site" }).click();
  await page.getByRole("option", { name: site }).click();
  await page.getByRole("button", { name: "Record feedstock out" }).click();
  await expect(page.getByText(`recorded to ${site}`)).toBeVisible();
}

test("the list, the totals and the filters describe this spec's movements", async ({
  page,
}, testInfo) => {
  const producer = uniqueName("E2E List Producer", testInfo);
  const site = uniqueName("E2E List Site", testInfo);

  await createProducer(page, producer);
  await createSite(page, site);

  for (const weight of INBOUND) await recordInbound(page, producer, weight);
  for (const weight of OUTBOUND) await recordOutbound(page, site, weight);

  // Filtered to this producer: both inbound rows, newest first.
  await page.goto("/");
  await page.getByRole("combobox", { name: "Producer" }).click();
  await page.getByRole("option", { name: producer }).click();
  await expect(page).toHaveURL(/[?&]producer=/);

  await expect(visibleText(page, "250.5 kg")).toBeVisible();
  await expect(visibleText(page, "100 kg")).toBeVisible();

  // The totals describe the filtered set. Outbound reads 0 kg rather than
  // disappearing, which is what stops a missing figure reading as an unknown.
  const totals = page.getByRole("region", { name: "Running totals" });
  await expect(totals.getByText("350.5 kg")).toBeVisible();
  await expect(totals.getByText("0 kg")).toBeVisible();

  // The filter survives a reload — it is in the URL, not in component state.
  await page.reload();
  await expect(totals.getByText("350.5 kg")).toBeVisible();

  // Clear filters restores the unfiltered view. Asserted as this spec's rows
  // still being reachable, never as a row count.
  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/$/);

  // Filtered to this site: the outbound row, and the mirrored totals.
  await page.getByRole("combobox", { name: "Sequestration site" }).click();
  await page.getByRole("option", { name: site }).click();
  await expect(totals.getByText("75 kg")).toBeVisible();
  await expect(totals.getByText("0 kg")).toBeVisible();
});

test("Show more raises the limit without moving the totals", async ({
  page,
}, testInfo) => {
  const producer = uniqueName("E2E Paged Producer", testInfo);

  await createProducer(page, producer);
  for (const weight of INBOUND) await recordInbound(page, producer, weight);

  // Below this spec's own row count, so the control has to appear.
  await page.goto("/");
  await page.getByRole("combobox", { name: "Producer" }).click();
  await page.getByRole("option", { name: producer }).click();

  // The Select navigates with router.push, so the URL has to have landed
  // before it is read — otherwise `limit` is appended to the unfiltered page
  // and the totals below are the whole facility's.
  await expect(page).toHaveURL(/[?&]producer=/);

  const url = new URL(page.url());
  url.searchParams.set("limit", "1");
  await page.goto(url.toString());

  const totals = page.getByRole("region", { name: "Running totals" });
  await expect(totals.getByText("350.5 kg")).toBeVisible();
  await expect(page.getByRole("link", { name: "Show more" })).toBeVisible();

  await page.getByRole("link", { name: "Show more" }).click();

  // Both rows now, and the same total a second time — this is the assertion
  // that pins why the page runs a second query for the totals.
  await expect(visibleText(page, "100 kg")).toBeVisible();
  await expect(totals.getByText("350.5 kg")).toBeVisible();
  await expect(page.getByRole("link", { name: "Show more" })).toHaveCount(0);
});

/**
 * The archive has to come after the recording. `listProducersWithMovements`
 * filters on `movements: { some: {} }`, so a counterparty with no movements
 * never reaches the filter to be found at all.
 */
test("an archived counterparty is still reachable in the filter", async ({
  page,
}, testInfo) => {
  const producer = uniqueName("E2E Archived Producer", testInfo);

  await createProducer(page, producer);
  await recordInbound(page, producer, "42");

  await page.goto("/producers");
  await page.getByRole("link", { name: producer }).click();
  await page.getByRole("button", { name: "Archive" }).click();
  await page.getByRole("button", { name: "Archive producer" }).click();
  await expect(page).toHaveURL(/\/producers(\?|$)/);

  // Gone from the list it fed, still in the filter that follows the table.
  await page.goto("/");
  await page.getByRole("combobox", { name: "Producer" }).click();
  const option = page.getByRole("option", { name: new RegExp(producer) });
  await expect(option).toBeVisible();
  await expect(option.getByText("Archived")).toBeVisible();

  await option.click();
  const totals = page.getByRole("region", { name: "Running totals" });
  await expect(totals.getByText("42 kg")).toBeVisible();
});

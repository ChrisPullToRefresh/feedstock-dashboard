import { expect, test } from "@playwright/test";

import { uniqueName } from "./support/unique";

/**
 * The producer surface end to end: list, create, detail, edit, archive.
 *
 * Every row this spec touches carries a name unique to the run and the
 * project — `Producer.name` is `@unique` and the whole suite runs twice — so
 * nothing here reads a figure another spec moved.
 */

test("a producer can be created, edited and archived", async ({
  page,
}, testInfo) => {
  const name = uniqueName("E2E Producer", testInfo);
  const renamed = `${name} renamed`;

  // List.
  await page.goto("/producers");
  await expect(
    page.getByRole("heading", { level: 1, name: "Producers" }),
  ).toBeVisible();

  // Create.
  await page.getByRole("link", { name: "Add producer" }).click();
  await expect(page).toHaveURL(/\/producers\/new/);
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Create producer" }).click();

  await expect(page).toHaveURL(/\/producers(\?|$)/);
  await expect(page.getByRole("link", { name })).toBeVisible();

  // Detail. Its total is zero, because nothing has been recorded against it.
  await page.getByRole("link", { name }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(page.getByText("0 kg")).toBeVisible();

  // Edit.
  await page.getByRole("link", { name: "Edit" }).click();
  await expect(page).toHaveURL(/\/producers\/[^/]+\/edit/);
  await page.getByLabel("Name").fill(renamed);
  await page.getByRole("button", { name: "Save changes" }).click();

  // A rename redirects to the list with a toast. The toast component clears
  // its own search parameters once it has fired, so the query is a race and
  // only the path is asserted.
  await expect(page).toHaveURL(/\/producers(\?|$)/);
  await expect(page.getByRole("link", { name: renamed })).toBeVisible();
  await expect(page.getByRole("link", { name, exact: true })).toHaveCount(0);

  // It reaches the inbound dropdown while it is active.
  await page.goto("/record/inbound");
  await page.getByRole("combobox", { name: "Producer" }).click();
  await expect(page.getByRole("option", { name: renamed })).toBeVisible();
  await page.keyboard.press("Escape");

  // Archive, through the dialog that names the row.
  await page.goto("/producers");
  await page.getByRole("link", { name: renamed }).click();
  await page.getByRole("button", { name: "Archive" }).click();
  await expect(
    page.getByRole("heading", { name: `Archive ${renamed}?` }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Archive producer" }).click();

  // Gone from the list, and gone from the dropdown it fed.
  await expect(page).toHaveURL(/\/producers(\?|$)/);
  await expect(page.getByRole("link", { name: renamed })).toHaveCount(0);

  await page.goto("/record/inbound");
  await page.getByRole("combobox", { name: "Producer" }).click();
  await expect(page.getByRole("option", { name: renamed })).toHaveCount(0);
});

/**
 * One representative rejection, end to end. The field-by-field messages are
 * `src/components/reference-form.test.tsx`'s job; what a component test cannot
 * reach is the round trip — refused, said so, and wrote nothing.
 */
test("the create form refuses an empty name and writes nothing", async ({
  page,
}) => {
  await page.goto("/producers");
  const before = await page.getByRole("link").count();

  await page.goto("/producers/new");
  await page.getByRole("button", { name: "Create producer" }).click();

  await expect(page.getByText("Enter a producer name")).toBeVisible();
  await expect(page).toHaveURL(/\/producers\/new/);

  await page.goto("/producers");
  await expect(page.getByRole("link")).toHaveCount(before);
});

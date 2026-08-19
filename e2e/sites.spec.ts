import { expect, test } from "@playwright/test";

import { uniqueName } from "./support/unique";

/**
 * The sequestration site surface end to end: list, create, detail, edit,
 * archive.
 *
 * The same sequence as `producers.spec.ts`, run against the other entity
 * rather than trusting one to stand in for the other —
 * `specs/roadmap.md` Phase 4 built these two surfaces from shared components,
 * and a shared component is exactly what can break for one caller only.
 */

test("a sequestration site can be created, edited and archived", async ({
  page,
}, testInfo) => {
  const name = uniqueName("E2E Site", testInfo);
  const renamed = `${name} renamed`;

  // List.
  await page.goto("/sites");
  await expect(
    page.getByRole("heading", { level: 1, name: "Sequestration sites" }),
  ).toBeVisible();

  // Create.
  await page.getByRole("link", { name: "Add sequestration site" }).click();
  await expect(page).toHaveURL(/\/sites\/new/);
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Create sequestration site" }).click();

  await expect(page).toHaveURL(/\/sites(\?|$)/);
  await expect(page.getByRole("link", { name })).toBeVisible();

  // Detail. Its total is zero, because nothing has been recorded against it.
  await page.getByRole("link", { name }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(page.getByText("0 kg")).toBeVisible();

  // Edit.
  await page.getByRole("link", { name: "Edit" }).click();
  await expect(page).toHaveURL(/\/sites\/[^/]+\/edit/);
  await page.getByLabel("Name").fill(renamed);
  await page.getByRole("button", { name: "Save changes" }).click();

  // A rename redirects to the list with a toast. The toast component clears
  // its own search parameters once it has fired, so the query is a race and
  // only the path is asserted.
  await expect(page).toHaveURL(/\/sites(\?|$)/);
  await expect(page.getByRole("link", { name: renamed })).toBeVisible();
  await expect(page.getByRole("link", { name, exact: true })).toHaveCount(0);

  // It reaches the outbound dropdown while it is active.
  await page.goto("/record/outbound");
  await page.getByRole("combobox", { name: "Sequestration site" }).click();
  await expect(page.getByRole("option", { name: renamed })).toBeVisible();
  await page.keyboard.press("Escape");

  // Archive, through the dialog that names the row.
  await page.goto("/sites");
  await page.getByRole("link", { name: renamed }).click();
  await page.getByRole("button", { name: "Archive" }).click();
  await expect(
    page.getByRole("heading", { name: `Archive ${renamed}?` }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Archive sequestration site" })
    .click();

  // Gone from the list, and gone from the dropdown it fed.
  await expect(page).toHaveURL(/\/sites(\?|$)/);
  await expect(page.getByRole("link", { name: renamed })).toHaveCount(0);

  await page.goto("/record/outbound");
  await page.getByRole("combobox", { name: "Sequestration site" }).click();
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
  await page.goto("/sites");
  const before = await page.getByRole("link").count();

  await page.goto("/sites/new");
  await page.getByRole("button", { name: "Create sequestration site" }).click();

  await expect(page.getByText("Enter a sequestration site name")).toBeVisible();
  await expect(page).toHaveURL(/\/sites\/new/);

  await page.goto("/sites");
  await expect(page.getByRole("link")).toHaveCount(before);
});

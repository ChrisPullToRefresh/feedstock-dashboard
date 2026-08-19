import { expect, test } from "@playwright/test";

/**
 * The first spec to run, and the one that fails when the harness is wrong
 * rather than when the app is.
 *
 * It asks for the only page reachable without a session and without a
 * database — `specs/tech-stack.md` § Auth gates everything else, and the
 * migrations have not run when the web server first answers. So a failure here
 * means the config, the web server or a project is broken, not that a feature
 * regressed.
 */
test("the sign-in page renders", async ({ page }) => {
  await page.goto("/sign-in");

  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
});

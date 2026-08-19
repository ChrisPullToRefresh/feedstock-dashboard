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

// Signed out. `/sign-in` is the one page that means something only without a
// session: Clerk sends a signed-in visitor straight back to the app.
test.use({ storageState: { cookies: [], origins: [] } });

test("the sign-in page renders", async ({ page }) => {
  await page.goto("/sign-in");

  await expect(page).toHaveURL(/\/sign-in/);
  // Clerk's own surface — `specs/tech-stack.md` § Application is explicit that
  // this one component is not shadcn — so the assertion is on the field a
  // person types into rather than on Clerk's copy.
  await expect(page.getByRole("textbox").first()).toBeVisible();
});

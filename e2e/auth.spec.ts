import { expect, test } from "@playwright/test";

/**
 * The gate itself, in a browser.
 *
 * `src/proxy.test.ts` asserts what `config.matcher` contains; nothing until now
 * asserted what a signed-out request actually receives. That is the assertion
 * worth having, because both holes this project has had here — a producer id
 * with a dot in it, and an extension anywhere in the path — were matcher
 * patterns that read as correct.
 */

// The one spec that runs without the session global setup saved.
test.use({ storageState: { cookies: [], origins: [] } });

test("a protected route sends a signed-out visitor to sign in", async ({
  page,
}) => {
  await page.goto("/producers");

  await expect(page).toHaveURL(/\/sign-in/);
});

test("the sign-in page renders for a signed-out visitor", async ({ page }) => {
  await page.goto("/sign-in");

  await expect(page.getByRole("textbox").first()).toBeVisible();
});

/**
 * `specs/roadmap.md` Phase 3 names this exact path: without the trailing `$`
 * anchoring the extension to the end, `/producers/x.svg/edit` reads as a static
 * file and is served with no session. The anchor is in `src/proxy.ts` and this
 * is the browser-level proof that it holds.
 */
test("a path with an extension in a middle segment is still gated", async ({
  page,
}) => {
  await page.goto("/producers/x.svg/edit");

  await expect(page).toHaveURL(/\/sign-in/);
});

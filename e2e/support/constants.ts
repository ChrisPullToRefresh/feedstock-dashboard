/**
 * The things global setup and the specs both have to agree on.
 *
 * Kept out of `playwright.config.ts` so a spec can import them without pulling
 * the config — and its `.env.e2e` side effect — into a worker.
 */

/** Where the signed-in session is saved. Git-ignored: it is a real session. */
export const STORAGE_STATE = "e2e/.auth/user.json";

/**
 * The account global setup signs in as. Provisioned with
 * `npm run provision -- <email>`; `specs/tech-stack.md` § Auth allows no
 * self-service sign-up, so it cannot be created from a test.
 *
 * A function rather than a constant, and that is load-bearing. ES module
 * imports are evaluated before the importing module's body, so a constant read
 * here would be resolved before `playwright.config.ts` calls
 * `process.loadEnvFile(".env.e2e")` — and would always be empty.
 */
export function e2eUserEmail(): string {
  const email = process.env.E2E_USER_EMAIL;

  if (!email) {
    throw new Error(
      "E2E_USER_EMAIL is unset. Copy .env.e2e.example to .env.e2e, or set it in the CI job.",
    );
  }

  return email;
}

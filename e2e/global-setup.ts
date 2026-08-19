import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { chromium, type FullConfig } from "@playwright/test";

import { e2eUserEmail, STORAGE_STATE } from "./support/constants";

/**
 * Everything the suite needs before its first test: a migrated and seeded
 * database, and a signed-in session on disk.
 *
 * Both live here rather than in the CI job's steps, so the local run and the CI
 * run take one path and cannot drift —
 * `specs/2026-08-18-end-to-end-coverage/plan.md` § Decisions.
 *
 * This runs *after* the web server is up: Playwright starts `webServer` as a
 * plugin task and plugin tasks precede `globalSetup`. That is why the config
 * probes `/sign-in` for readiness — every other route would fail here, against
 * a database whose migrations have not been applied yet.
 *
 * A throw aborts the whole run before any spec executes, smoke included, so the
 * output of this file is the only diagnosis available. Both commands inherit
 * stdio for that reason.
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL;

  if (!baseURL) throw new Error("No baseURL is configured for the suite.");

  const email = e2eUserEmail();

  requireThrowawayDatabase();

  // From empty, every CI run. `prisma.config.ts` loads `.env.local` when that
  // file exists, but `process.loadEnvFile` never overwrites a variable that is
  // already set — so the URL `.env.e2e` put in the environment is the one used.
  run("npx", ["prisma", "migrate", "deploy"]);
  run("npm", ["run", "seed"]);

  // Fetches a testing token from the Clerk Backend API and puts CLERK_FAPI and
  // CLERK_TESTING_TOKEN in the environment, which the workers inherit.
  //
  // `dotenv: false` on purpose: the helper otherwise reads `.env.local`, the
  // one file this suite exists to stay away from.
  await clerkSetup({ dotenv: false });

  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });

  try {
    // Clerk has to be loaded before the helper can drive it, and `/sign-in` is
    // the only page reachable without the session we are here to create.
    await page.goto("/sign-in");

    // Over a Backend API sign-in ticket rather than a password, so the only
    // Clerk credential CI holds is the secret key it already needs.
    await clerk.signIn({ page, emailAddress: email });

    // Proves the session before it is written. A storageState saved from a
    // half-finished sign-in fails every spec with a redirect rather than
    // anything that names the cause.
    await page.goto("/producers");
    await page.waitForURL("**/producers");

    mkdirSync(dirname(STORAGE_STATE), { recursive: true });
    await page.context().storageState({ path: STORAGE_STATE });
  } finally {
    await browser.close();
  }
}

/**
 * The last guard before anything is written.
 *
 * `specs/tech-stack.md` § Testing allows an ephemeral or preview database and
 * never production, and `specs/mission.md` § Constraints makes a recorded
 * movement permanent. A hostname check is cheap and the mistake it catches —
 * a `.env.e2e` copied from `.env.local` — is not reversible.
 */
function requireThrowawayDatabase() {
  for (const name of ["DATABASE_URL", "DATABASE_URL_UNPOOLED"]) {
    const url = process.env[name];

    if (!url) {
      throw new Error(
        `${name} is unset. Both are required, and both must name a throwaway database — see .env.e2e.example.`,
      );
    }

    if (/neon\.tech/i.test(url)) {
      throw new Error(
        `${name} points at Neon. The suite writes append-only movements, so it runs against a throwaway database only — see .env.e2e.example.`,
      );
    }
  }
}

/** Inherits stdio, so a failed migration says why in the Playwright output. */
function run(command: string, args: string[]) {
  execFileSync(command, args, { stdio: "inherit" });
}

export default globalSetup;

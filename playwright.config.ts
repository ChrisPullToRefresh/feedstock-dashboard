import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

import { STORAGE_STATE } from "./e2e/support/constants";

/**
 * The end-to-end suite — `specs/2026-08-18-end-to-end-coverage/plan.md`.
 *
 * Local runs read `.env.e2e`, never `.env.local`. `specs/mission.md`
 * § Constraints makes every movement a test records permanent, so a suite
 * pointed at the shared Neon development branch would leave weights in it that
 * nothing can remove. In CI the variables are already in the environment and no
 * file exists, which is what the guard is for — the same shape
 * `prisma.config.ts` uses.
 *
 * `process.loadEnvFile` does not overwrite a variable that is already set, so
 * an explicitly exported URL still wins over the file.
 */
if (existsSync(".env.e2e")) {
  process.loadEnvFile(".env.e2e");
}

/**
 * Not 3000. `next dev` is what a developer already has on that port, and a
 * suite that silently attached to it would drive their database.
 */
const PORT = 3100;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Vitest owns `src/**/*.test.{ts,tsx}` and this owns `e2e/**/*.spec.ts`, so
  // neither runner can collect the other's files.
  testMatch: /.*\.spec\.ts$/,

  // One worker, everywhere. The suite writes to one database and movements are
  // append-only, so two workers recording at once would race on the figures the
  // specs assert. `fullyParallel` off for the same reason.
  workers: 1,
  fullyParallel: false,

  retries: process.env.CI ? 2 : 0,
  forbidOnly: !!process.env.CI,

  reporter: [["html", { open: "never" }], [process.env.CI ? "github" : "list"]],

  use: {
    baseURL: BASE_URL,
    // On the first retry rather than on every failure: a trace costs time and
    // disk on a merge gate, and the run worth diagnosing is the one that failed
    // twice.
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  // Applies the migrations, seeds the reference data and saves the signed-in
  // session the projects below reuse.
  globalSetup: "./e2e/global-setup.ts",

  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"], storageState: STORAGE_STATE },
    },
  ],

  webServer: {
    // A production build, not `next dev`: the suite has to drive the output
    // Vercel serves, or a green gate proves something no deployment runs.
    command: `npm run build && npx next start --port ${PORT}`,
    // `/sign-in` is public and queries nothing, which is why the probe names
    // it. Playwright starts `webServer` as a plugin task and plugin tasks run
    // before `globalSetup`, so at the moment this fires the migrations have not
    // been applied and every other route would fail against an empty database.
    url: `${BASE_URL}/sign-in`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});

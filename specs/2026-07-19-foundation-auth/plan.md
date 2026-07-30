# Plan: Phase 1 — Foundation & Auth

Task groups are sequenced so tooling exists before it's needed: scaffold →
test/CI tooling → data layer → auth → UI shell. Group 2 stands up the
Vitest/RTL/Playwright/GitHub Actions tooling itself, per tech-stack.md's
Testing & CI/CD Practices, so every group after it has something to run
tests against.

Group 6 (commit-message linting) is conceptually repo tooling like Group 2
and would normally sit right after it, but it was added to this plan after
Groups 1–4 had already landed — renumbering/reinserting among completed
groups would rewrite settled history for no benefit, so it's appended at
the end instead. Its CI/Husky wiring doesn't depend on any other group.

## 1. Project scaffold & Vercel deploy

**Status:** Complete

- Scaffold a Next.js (App Router, TypeScript) project.
- Link the repo to a new Vercel project; confirm an initial deploy succeeds
  from `main`.
- Configure base `package.json` scripts (`dev`, `build`, `lint`).

**Test task:** N/A — this group establishes the runnable app itself; there
is no unit under test yet. Verified by the deploy succeeding (folded into
validation.md's Vercel preview check for later PRs).

## 2. Testing & CI tooling

**Status:** Complete

- Install and configure Vitest + React Testing Library (`vitest.config.ts`,
  jsdom environment, RTL setup file).
- Install and configure Playwright (`playwright.config.ts`, including a
  mobile-viewport device profile per tech-stack.md).
- Add a GitHub Actions workflow (`.github/workflows/ci.yml`) running, on
  every PR: lint + typecheck, unit/component tests, E2E tests, production
  build (`next build`). Cache npm deps via `actions/setup-node`, use a
  concurrency group per PR, pin action versions.

**Test task:** Write one trivial Vitest smoke test (e.g. a `sum` or
placeholder component render) and one trivial Playwright smoke test (e.g.
loads the default Next.js page and asserts a heading) purely to prove the
tooling and CI wiring work end-to-end before real features depend on them.
Delete/replace these once Group 5's real shell tests land.

## 3. Neon Postgres provisioning & connection

**Status:** Complete

- Provision a Neon Postgres database and link it to the Vercel project
  (env vars for connection string).
- Add a database client/ORM connection module.
- Add a minimal health-check query (e.g. `SELECT 1`) callable from the app.

**Test task:** Vitest unit test for the database connection module (mocking
the driver) confirming it constructs a client from env vars and the
health-check function returns successfully against a test/dev database.

## 4. Clerk auth integration with roles

**Status:** Complete

- Integrate Clerk into the Next.js app (provider, sign-in route).
- Add Next.js middleware that reads `auth()` and requires a signed-in user
  for all routes except sign-in.
- Set each test/dev user's role via `publicMetadata.role` (`"admin"` or
  `"operator"`) in the Clerk dashboard; read the role off
  `sessionClaims.metadata.role` in middleware so it's available for future
  gating (enforcement itself is Phase 4 scope, per requirements.md).
- **No public sign-up.** There is no `/sign-up` route. New users are
  provisioned only by admins, via Clerk invitations (or, for scripted
  test/dev setup, the Backend API) — never self-service. Enforced at the
  Clerk instance level (`restricted_to_allowlist: true` via
  `PATCH /beta_features/instance_settings`), not just by omitting the page,
  so it can't be reached even if someone finds/guesses the URL.

**Test tasks:**
- Vitest/RTL unit test for the middleware's redirect behavior (signed-out
  user → sign-in page; signed-in user → allowed through; hitting `/sign-up`
  is treated as any other protected route, not a public one), mocking
  Clerk's `auth()`.
- Playwright E2E test covering the primary flow: an unauthenticated user
  hitting the app is redirected to sign-in; after signing in (test Clerk
  credentials from repo/environment secrets, per tech-stack.md), the user
  reaches the authenticated shell.
- Playwright E2E test confirming `/sign-up` offers no self-serve sign-up:
  unauthenticated visitors are redirected to sign-in (same as any other
  route); a signed-in user gets a 404 (the route doesn't exist).

## 5. Base mobile-friendly layout/navigation shell

**Status:** Complete

- Build a minimal authenticated layout: header/nav shell, responsive
  breakpoints (mobile-first per mission.md), empty content area.
- Wire the shell as the landing point after sign-in.

**Test tasks:**
- Vitest/RTL component test rendering the layout/nav shell and asserting
  key structural elements (nav present, responsive classes/attributes
  applied) render correctly.
- Playwright E2E test, run at both a mobile-viewport device profile and a
  desktop viewport, covering the primary flow: sign in → land on the empty
  authenticated shell (this is the scenario validation.md's automated-test
  gate and manual mobile-viewport check both key off of).

## 6. Commit-message linting (commitlint)

- Install and configure `commitlint` with `@commitlint/config-conventional`.
- Add a Husky `commit-msg` git hook so every local commit is linted before
  it's created.
- Add a commit-message lint step to the GitHub Actions CI workflow, linting
  the PR's full commit range (not just the latest commit) as a required
  check, per tech-stack.md.
- Document the convention (allowed types, format, examples) for
  contributors — e.g. in `CONTRIBUTING.md` or this repo's README.

**Test task:** Vitest test invoking commitlint's programmatic API directly
against a table of sample commit messages — confirms the config accepts
well-formed Conventional Commits messages and rejects malformed ones
(missing type, non-imperative-looking noise, oversized summary line), so
the rule set itself is verified independent of the Husky/CI wiring around
it.

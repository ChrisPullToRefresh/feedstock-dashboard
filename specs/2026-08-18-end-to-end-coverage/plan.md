# Phase 7 — End-to-end coverage — Plan

Tasks run in order. Every feature task ships with its paired test task in the same
pull request.

This phase's feature tasks are largely tests themselves, so the right column names what
proves each one is wired up correctly rather than restating it. Where nothing automated
can assert a task — a credential in GitHub secrets, a branch-protection setting — the
column says how it is verified instead, prefixed `Manual:`.

| # | Feature task | Paired test task |
|---|--------------|------------------|
| 1 | Install `@playwright/test` and `@clerk/testing`, pin the browser download to Chromium, and add the `test:e2e` script | `npm run typecheck` and `npm run lint` stay green with the new dependencies and the new directory in scope |
| 2 | Add `playwright.config.ts`: `testDir: "e2e"`, the desktop and mobile Chromium projects, `webServer` running `next build && next start`, `retries: 2` and `workers: 1` under CI, `trace: "on-first-retry"`, and `.env.e2e` loaded before anything else | `e2e/smoke.spec.ts` opens `/sign-in` and asserts it renders — it passes only if the config, the web server and both projects all work, and it is the first thing to run |
| 3 | Keep the two runners apart: Playwright collects only `e2e/**/*.spec.ts`, Vitest keeps `src/**/*.test.{ts,tsx}`, and ESLint, Prettier and `tsconfig.json` all cover `e2e/` | `npm run test` reports the same test count as on `main`, and `npx playwright test --list` shows no `src/` file |
| 4 | Add `.env.e2e` support and `.env.e2e.example`, gitignore the real file, and document the local run in `README.md` | Manual: with `.env.e2e` pointing at a throwaway database, run `npx playwright test` and confirm from the database `.env.local` names that it gained no rows |
| 5 | Provision the dedicated CI Clerk account with `npm run provision -- <email>` and add its email and password to GitHub Actions secrets and to `.env.e2e.example` as named placeholders | Manual: the E2E job's first CI run signs in and reaches the app; a run with the secret removed fails in global setup rather than silently skipping |
| 6 | Write `e2e/global-setup.ts`: apply `prisma migrate deploy`, run the seed, sign the CI account in with `setupClerkTestingToken`, and save `storageState` | Every signed-in spec depends on it, so a broken setup fails all of them; the smoke spec from task 2 passes without it, which is what separates a setup failure from a config failure |
| 7 | Add `e2e/support/unique.ts`, giving each run a short unique suffix for the reference rows its specs create | The producer and site specs assert on rows carrying their own suffix, so two runs against one database do not see each other's |
| 8 | Write `e2e/auth.spec.ts`, running with no stored session | It asserts `/producers` redirects to `/sign-in` and that the sign-in page renders — the browser-level proof of the gate that `src/proxy.test.ts` can only assert as a matcher |
| 9 | Write `e2e/producers.spec.ts`: list, create, detail, edit, archive | It asserts the created producer appears in the list, its detail page carries its name and total, the edit lands, the archive dialog confirms, and the archived name is gone from the inbound form's dropdown |
| 10 | Write `e2e/sites.spec.ts`, the same shape for sequestration sites | It asserts the same sequence against `/sites` and the outbound dropdown, so both CRUD surfaces are covered rather than one standing in for the other |
| 11 | Write `e2e/record-inbound.spec.ts` | It records a weight against a seeded producer, then asserts the movement is on `/` with that weight, that producer and the **Feedstock in** direction |
| 12 | Write `e2e/record-outbound.spec.ts` | It records a weight against a seeded site and asserts the same round trip with **Feedstock out** |
| 13 | Add one representative rejection to each of the four forms' specs — inbound, outbound, producer, site | Each asserts the submit is refused, the message is on screen, and the row count behind it is unchanged, which is the part a component test cannot reach |
| 14 | Write `e2e/movements.spec.ts` covering `/`: the table newest first, the totals, each filter, **Clear filters**, and **Show more** under a lowered limit | It records its own movements first and asserts on those figures, so it depends on no pre-existing rows |
| 15 | Add the `E2E` job to `.github/workflows/ci.yml` with its own `postgres:17` service, the Clerk secrets, the Playwright browser cache, and the HTML report uploaded on failure | The job is green on this pull request, and its log shows both the desktop and the mobile project running |
| 16 | Make **E2E** a required check in `main`'s branch protection | Manual: after the first green run, add the check in the repository settings and confirm it is listed alongside Lint, Typecheck, Test, Database and Commit convention |
| 17 | Prove the gate blocks: push a deliberately broken assertion, confirm **E2E** goes red and the merge button is unavailable, then revert it | Manual: the failed run's uploaded report is opened and shows the broken assertion; the revert's run is green again |
| 18 | Correct the documents this phase makes wrong: `specs/tech-stack.md` § CI/CD check 4 no longer says "Not installed yet", and `specs/roadmap.md` § v0.1 ticks the Playwright checkbox | Manual: read both files on the branch and confirm no sentence still describes Playwright as pending |

## Decisions

Every entry below answers a question asked in this session. Nothing here was inferred.

**The suite runs against a Postgres service container in CI, not a Vercel preview.**
The E2E job stands up its own `postgres:17` service, exactly as the existing `database`
job does, and Playwright starts the app locally against it.
`specs/tech-stack.md` § Testing allows "an ephemeral or preview database" and does not
choose. Rejected: driving the pull request's Vercel preview, which is SSO-protected —
`specs/tech-stack.md` § Hosting — so CI would need a protection-bypass secret, would have
to wait on the deployment, and a failed deploy would surface as an E2E failure. Also
rejected: a dedicated ephemeral Neon branch per run, which needs `NEON_API_KEY` in CI, a
cleanup step that must run even on failure, and pushes against the branch cap that
`specs/tech-stack.md` § Cleanup records already breaking an unrelated pull request once.

**Clerk is authenticated through `@clerk/testing`, against a dedicated development-instance
account.** Global setup signs in once with `setupClerkTestingToken` and saves
`storageState`. Rejected: an env-gated bypass in `src/proxy.ts`, which would ship a code
path that disables authentication into production source — the hole Phases 1 and 3 both
had to close — and would leave the sign-in flow untested. Also rejected: signing in
through the UI in every spec, which is slow and flaky against bot protection.

**CI signs in as a dedicated e2e account, not `chris@pulltorefresh.team`.** Provisioned
with `npm run provision -- <email>` per `specs/tech-stack.md` § Auth. A leaked CI
credential then reaches a throwaway account in the development instance. Rejected:
reusing the real staff account, which would put a working credential into GitHub secrets
and make CI's movements indistinguishable from a person's.

**Test data is isolated by a fresh database per CI run, and by run-unique names locally.**
CI's container is empty every run, so isolation is free there. Specs create their own
reference rows under a run-unique suffix and assert only on what they created, never on a
global total. Rejected: truncating and re-seeding between spec files, which forces serial
execution and puts a destructive script in the repository. Also rejected: asserting only
against seeded data, which cannot work when creating rows is itself a roadmap bullet.

**Migration, seed and sign-in all happen in Playwright's global setup, not in CI job
steps.** The local run and the CI run then take an identical path and cannot drift. The
CI job supplies the container and the secrets and nothing else. Rejected: mirroring the
`database` job's steps in the workflow, which would leave the local run to reproduce them
by hand.

**Specs live in `e2e/` at the repository root, named `*.spec.ts`.** Both the directory and
the suffix keep them outside Vitest's `src/**/*.test.{ts,tsx}` glob, so neither runner can
collect the other's files. Rejected: `tests/e2e/`, an empty layer of nesting for one
suite; and `src/e2e/`, which puts non-shipping code in the application source root and
relies on the suffix alone.

**Two projects: desktop Chromium and mobile Chromium.** Rejected: adding WebKit or the
full three-engine matrix, which multiplies the runtime of a merge gate for engines no
requirement names. Nothing in the constitution names a browser matrix.

**The entire suite runs in both projects.** Every page is exercised at both viewports
rather than only the entry flows at mobile. This exceeds the roadmap's "at least one E2E
pass at a mobile viewport" deliberately. Rejected: mobile for the two entry forms only,
which is the minimum `specs/mission.md` § Constraints strictly requires and leaves the
movement list's stacked phone layout with no browser coverage.

**Playwright serves the app with `next build && next start`.** The suite drives a
production build, so Server Components, caching and `force-dynamic` behave as they will on
Vercel. Rejected: `next dev`, which starts faster but renders differently from anything
that is deployed.

**Each form gets one representative rejection end to end.** The round trip — refused,
message on screen, nothing written — is what a component test cannot make. Rejected:
re-proving every validation rule in the slowest runner on the merge gate, which would
duplicate the Vitest suites and require two edits per message change. Also rejected:
happy paths only, which contradicts the roadmap bullet naming validation paths.

**The unauthenticated boundary gets its own spec, running with no stored session.**
Rejected: signed-in flows only, which would leave the app's one security gate with no
browser-level proof and skip `/sign-in`, a page the bullet says to cover.

**CI retries twice with one worker, traces on the first retry, and uploads the HTML
report on failure.** Rejected: zero retries, which on a hard merge gate lets one flaky
test block everyone; and retries without artifacts, which leaves a non-reproducing
failure with nothing to look at.

**Elements are located by accessible role and name, with `data-testid` only where a Radix
control leaves no alternative.** This matches the queries the existing React Testing
Library tests use, and a selector that breaks because an accessible name changed is a real
signal. Rejected: `data-testid` throughout, which adds test-only attributes to shipping
components and stops the suite noticing a control that lost its accessible name — a defect
Phases 1 and 3 each had to fix by hand.

**Local runs read a separate `.env.e2e`.** The suite cannot reach the Neon development
branch `.env.local` points at, which matters because `specs/mission.md` § Constraints makes
every movement a test records permanent. Rejected: running against `.env.local` with a
README warning, which makes the polluting path the default; and a CI-only suite, which
would leave a red check debuggable only by pushing commits.

**The documentation corrections land in this phase's implementation pull request.**
`specs/tech-stack.md` § CI/CD calls the E2E job "Not installed yet" and `specs/roadmap.md`
§ v0.1 leaves its checkbox unticked; both become false the moment this merges. Rejected: a
follow-up `maint-` alignment pull request, matching the repository's existing pattern but
leaving `main` claiming Playwright is not installed while it is.

## Open questions

None outstanding for the plan.

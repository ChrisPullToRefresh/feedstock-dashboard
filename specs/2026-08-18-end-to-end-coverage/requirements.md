# Phase 7 — End-to-end coverage — Requirements

**Phase:** 7 in `specs/roadmap.md`
**Scope of this spec:** all four of the phase's roadmap bullets — install and configure
Playwright against an ephemeral or preview database and never production; cover every
page, both movement entry flows, both CRUD surfaces and their validation paths; run at
least one E2E pass at a mobile viewport; add the Playwright job to the GitHub Actions
pull request workflow and make it a required check. Nothing is deferred.

## Goal

v0.1 is fully covered by Playwright, running as a merge gate.

Every page the app ships is driven in a real browser against a real database, and a
failing browser test blocks a merge the same way a failing unit test does today. This
phase ships no application behavior. It ships the proof that the behavior already shipped
still works, and the gate that keeps it that way.

## Behavior

**The suite runs against a throwaway database.** In CI the E2E job stands up its own
`postgres:17` service container, empty at the start of every run. Playwright's global
setup applies the checked-in migrations and loads the seed, so the reference data every
movement is recorded against is present before the first test. Locally the runner reads a
separate `.env.e2e`, so the suite cannot reach the Neon development branch that
`.env.local` points at. Production is never in reach from either path.

**The suite signs in as a dedicated account.** `specs/tech-stack.md` § Auth allows no
self-service sign-up, so CI uses an account provisioned through
`npm run provision -- <email>` against the Clerk development instance and used by nothing
else. Global setup signs it in once and saves the session; every spec but one reuses it.

**Every page is covered.** `/sign-in`; `/`, the movement list with its totals, filters
and show-more control; `/record` and both entry forms; `/producers`, `/producers/new`,
a producer's detail page and its edit page; `/sites`, `/sites/new`, a site's detail page
and its edit page.

**Each form is proven to refuse bad input.** One representative rejection per form, end
to end: the submit is refused, the message reaches the screen, and nothing is written.
Field-by-field message assertions stay in the Vitest component suites, which already
carry them.

**The unauthenticated boundary is proven in a browser.** One spec runs with no stored
session: a protected route redirects to `/sign-in`, and the sign-in page renders.
`src/proxy.test.ts` asserts the matcher; nothing today asserts the redirect.

**The whole suite runs twice.** Once at a desktop Chromium viewport and once at a mobile
Chromium device descriptor, so every page is exercised at both.

**A red suite blocks the merge.** The Playwright job joins `.github/workflows/ci.yml` as
its own check and becomes required in `main`'s branch protection. `specs/tech-stack.md`
§ CI/CD already names a failing E2E job as a hard block; this phase makes that true.

## Acceptance criteria

- [ ] The full Playwright suite passes in GitHub Actions and is a required check on
      `main` — the roadmap's **Done when** line, verbatim
- [ ] `npx playwright test` runs the suite locally against `.env.e2e`, never against the
      database `.env.local` names
- [ ] Global setup applies migrations and the seed to an empty database, then saves a
      signed-in session
- [ ] Every page listed under **Behavior** is opened and asserted on in at least one spec
- [ ] Both movement entry flows record a movement and the recorded movement is then found
      on the movement list
- [ ] Both CRUD surfaces create, edit and archive a row, and the archived row leaves the
      entry form's dropdown
- [ ] Each of the four forms refuses one representative invalid submit, showing its
      message and writing nothing
- [ ] A spec with no stored session is redirected from a protected route to `/sign-in`
- [ ] Every spec runs in both the desktop and the mobile Chromium project
- [ ] The E2E job appears in `.github/workflows/ci.yml` with its own Postgres service and
      uploads the HTML report when it fails
- [ ] A deliberately broken assertion turns the E2E check red and the merge button
      unavailable, and is then reverted
- [ ] `specs/tech-stack.md` § CI/CD no longer says the E2E job is not installed, and
      `specs/roadmap.md` § v0.1 has its Playwright checkbox ticked
- [ ] Vitest does not collect the Playwright specs, and Playwright does not collect the
      Vitest tests

## Out of scope

- Any change to application behavior. A test that fails because the app is wrong is a
  finding for a maintenance pull request, not a licence to change the app here.
- Firefox and WebKit. Two Chromium projects only — see `plan.md` § Decisions.
- Visual regression or accessibility scanning. Neither is named anywhere in the
  constitution.
- A coverage threshold. `specs/tech-stack.md` § Testing rules coverage enforcement out.
- Production migrations and the production Clerk instance. Both are Phase 8.

## Constraints inherited from the constitution

- **`specs/tech-stack.md` § Testing** — Playwright is the E2E tool, with full v0.1
  coverage: every page, both movement entry flows, both CRUD surfaces, validation paths.
  At least one run exercises a mobile viewport. Test data runs against an ephemeral or
  preview database, never production. No coverage threshold.
- **`specs/tech-stack.md` § CI/CD** — E2E is check 4 of six, and green CI is a hard merge
  requirement including a failing E2E job.
- **`specs/tech-stack.md` § Auth** — Clerk gates the app from `src/proxy.ts`, and
  accounts exist only via the Backend API. There is no self-service sign-up for a test to
  use.
- **`specs/tech-stack.md` § Branching & pull request workflow** — this phase implements in
  exactly one pull request, on `7-end-to-end-coverage`, squash merged after
  `/code-review`.
- **`specs/mission.md` § Constraints** — movements are immutable once recorded, so
  anything a test records is permanent in whatever database it reaches. This is why the
  local runner gets its own env file.
- **`specs/mission.md` § Constraints** — mobile-first field entry is binding, which is
  what the mobile project exists to hold.

## Open questions

None outstanding for requirements.

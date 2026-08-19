# Phase 7 — End-to-end coverage — Validation

The phase is done when the full Playwright suite passes in GitHub Actions and is a
required check on `main`. That line has two halves, and only one of them is proven by a
green run. The manual pass below proves the other: that a red suite actually stops a
merge. A gate nobody has watched block anything is not a proven gate.

This phase ships no application behavior, so there is no app change for a human to look
at. Everything under **Automated** is the deliverable itself.

## Automated

### Unit and component (Vitest + React Testing Library)

Unchanged. This phase adds no unit or component tests and must not change the count.
`npm run test` reporting the same number of tests as `main` is the assertion that the
Playwright specs were not collected by the wrong runner.

### End-to-end (Playwright)

Two projects — desktop Chromium and mobile Chromium — running every spec below. Each
spec starts from the seeded reference data and the stored signed-in session, except
`auth.spec.ts`, which starts from neither.

**`e2e/smoke.spec.ts`**

- `/sign-in` renders. It is the first spec to run and the one that fails when the config,
  the web server or a project is wrong rather than when the app is.

**`e2e/auth.spec.ts`** — no stored session

- A request for `/producers` lands on `/sign-in`
- The sign-in page renders Clerk's form
- A path with a dot in a later segment — `/producers/x.svg/edit` — is not served without a
  session. `src/proxy.test.ts` pins the matcher; this proves the behavior in a browser

**`e2e/producers.spec.ts`**

- `/producers` lists the seeded producers
- Creating a producer under a run-unique name lands back on the list with that row present
- Its detail page carries the name, the inbound description and a zero total
- Editing the name from `/producers/[id]/edit` shows the new name on the list and the
  detail page
- Archiving through the dialog removes it from `/record/inbound`'s dropdown while its
  detail page still resolves
- Submitting the create form empty is refused, the message is on screen, and the list is
  unchanged behind it

**`e2e/sites.spec.ts`**

- The same sequence against `/sites`, `/sites/new`, `/sites/[id]` and its edit page, with
  the archived site leaving `/record/outbound`'s dropdown
- The same single rejection on the site form

**`e2e/record-inbound.spec.ts`**

- `/record` offers both directions and reaches `/record/inbound`
- A weight recorded against a seeded producer appears on `/` with that weight, that
  producer and **Feedstock in**
- An invalid weight is refused, the message is on screen, and `/` gained no row

**`e2e/record-outbound.spec.ts`**

- The same three assertions against a sequestration site and **Feedstock out**

**`e2e/movements.spec.ts`**

- Movements this spec recorded appear newest first
- The inbound and outbound totals read the figures those movements sum to
- The direction, producer and site filters each narrow the table and survive a reload
- **Clear filters** restores the unfiltered view and a bare URL
- A lowered `limit` renders **Show more**, and the totals are identical before and after
  it is used
- An archived counterparty still appears in the filter, marked

## Manual

Everything below is about the gate rather than the app. Steps 1 to 3 are performed on this
phase's own pull request; steps 4 and 5 need repository settings access.

1. Open the pull request's Actions run. Expect six checks: **Commit convention**,
   **Lint**, **Typecheck**, **Test**, **Database** and the new **E2E**. Expect **E2E**
   green.
2. Open the **E2E** job log. Expect the global setup applying migrations and seeding
   before any test, and expect every spec listed twice — once under the desktop Chromium
   project and once under the mobile one. Expect no spec skipped.
3. Confirm the local path. With `.env.e2e` pointing at a throwaway database and never at
   the URL in `.env.local`, run `npx playwright test`. Expect the suite to pass. Then open
   the movement list against the database `.env.local` names and expect no new movements
   and no run-unique producer or site — the suite must not have reached it.
4. In the repository's branch protection settings for `main`, add **E2E** to the required
   checks. Expect it to sit alongside **Commit convention**, **Lint**, **Typecheck**,
   **Test** and **Database**.
5. Prove the gate blocks. Push one commit that breaks a single assertion — change an
   expected weight in `e2e/record-inbound.spec.ts`. Expect **E2E** to go red, expect the
   merge button to be unavailable with the failing check named, and expect the run to have
   uploaded an HTML report whose trace shows the broken assertion. Revert the commit and
   expect the next run green and the merge button available again.

## CI gate

Every check below must be green before the implementation pull request merges.
`specs/tech-stack.md` § CI/CD makes this a hard requirement. The first five job names are
the real ones in `.github/workflows/ci.yml`; **E2E** is the one this phase adds.

- **Commit convention** — the pull request title against Conventional Commits
- **Lint** — ESLint at zero warnings, then Prettier in `--check` mode, now also over `e2e/`
- **Typecheck** — `tsc --noEmit`, now also over `e2e/`
- **Test** — Vitest, unchanged in count by this phase
- **Database** — migrations applied to an empty Postgres, seeded twice, row counts
  unchanged, and the append-only trigger refusing a rewrite
- **E2E** — the full Playwright suite in both projects, against its own Postgres service

Plus the Vercel preview deployment, which this phase does not exercise: the suite runs
against a locally started production build, not the preview.

**E2E** cannot be a required check while this pull request is open, because a required
check must have run at least once before it can be selected. Step 4 of the manual pass
adds it after the first green run, and step 5 proves it blocks. That ordering is the only
reason the roadmap's **Done when** line is not satisfiable by the automated run alone.

## Open questions

None outstanding for validation.

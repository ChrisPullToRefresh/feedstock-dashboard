# Phase 4 — Sequestration sites — Validation

## Automated

### Unit and component (Vitest + React Testing Library)

Nothing in this section touches a database. No database test harness exists before
`specs/roadmap.md` Phase 7, which is why the Server Actions and query helpers are proven by
the manual pass below rather than here.

Every component assertion runs at both entities — producers and sequestration sites — so
one suite proves the new surface and guards the refactor of the shipped one.
`plan.md` § Decisions.

**The shared name schema** (`src/lib/reference-data.ts`):

- An empty name is rejected
- A whitespace-only name is rejected
- A 101-character name is rejected
- A 100-character name is accepted
- A padded name parses to its trimmed value

**The shared form** (`src/components/reference-form.tsx`), at both entities:

- An empty name is refused
- A whitespace-only name is refused
- A 101-character name is refused
- A valid name submits
- A refusal leaves the typed text on screen rather than resetting the field — the React 19
  behavior `submitted` exists to defeat, carried over from Phase 3
- When the action reports a collision with an archived row, the form renders the restore
  offer rather than a bare error

**The shared list** (`src/components/reference-list.tsx`), at both entities:

- Rows render in name order
- An archived row does not appear
- The stacked rows and the table render the same names
- An empty list renders the explanation and the create link

**The shared archive dialog** (`src/components/archive-dialog.tsx`), at both entities:

- The title names the row being archived
- Confirming invokes the bound action
- Dismissing the dialog does not

**The shared toast** (`src/components/reference-toast.tsx`), at both entities:

- Each of created, renamed, archived and restored renders its message
- An unknown `?toast=` value renders nothing — the `Object.hasOwn` guard from Phase 3, which
  stops `?toast=valueOf` reaching `Object.prototype`
- The parameters are cleared back to that entity's own list path

**The site routes**:

- `/sites/new` renders the form with an empty name field
- `/sites/[id]/edit` renders the form with the site's current name
- `/sites/[id]` renders the site's name with Edit and Archive controls
- `/sites` no longer renders `PlaceholderPage`, while `/` and `/record` still do

**The producer routes**, unchanged from Phase 3 and re-run against the refactor:

- `src/app/(app)/producers/routes.test.tsx` passes with its assertions unchanged
- `src/app/(app)/producers/list-page.test.tsx` passes with its producer assertions
  unchanged. Its one edit is the list of routes that still render `PlaceholderPage`:
  `/sites` leaves it, because the task 10 row above is what makes that false, and `/`
  takes its place
- Any other edited assertion is a behavior change, not a refactor, and needs explaining in
  the pull request

**Migration shape** — `src/test/prisma-migration.test.ts` extended to assert both
case-insensitive indexes are still present in the checked-in SQL: producers' from Phase 3
and sequestration sites' from this phase. Prisma cannot express an expression index, so
nothing regenerates them; this is the same guard the counterparty check constraint uses. It
asserts the SQL is present, not that it works — manual step 10 proves the behavior.

### End-to-end (Playwright)

Not applicable. `specs/roadmap.md` Phase 7 installs Playwright and makes it a required
check; this phase predates it, and `specs/tech-stack.md` § CI/CD records the job as not yet
installed. The manual steps below are what prove the **Done when** line until then.

## Manual

Run against this pull request's Vercel preview deployment, signed in, **on a real phone and
again on a desktop browser**. `specs/mission.md` § Constraints makes one-handed phone use
binding, so a desktop-only pass does not prove this phase.

Record which device each step was run on.

Steps 1 to 12 prove the new surface. Steps 13 to 16 are the producers regression pass:
Phase 3's Server Actions have no automated coverage before Phase 7, so a producer action
broken by the refactor would otherwise ship unnoticed.

1. **The list replaces the placeholder.** Open `/sites`. It shows the seeded sequestration
   sites ordered by name — `Basalt Ridge Injection Site` first, `Harney Basin Storage`
   last — not the "Arrives in Phase 4" placeholder. On the phone the rows are stacked and
   every control is reachable with one thumb; on desktop the same data is a table.
2. **Create a site.** Tap Add, enter `Alkali Flat Storage`, submit. You return to the list,
   a toast confirms the creation, and `Alkali Flat Storage` appears first because it sorts
   before `Basalt Ridge Injection Site`.
3. **An empty name is refused.** Open the create form, submit with the field empty. The form
   refuses it and says why. Nothing is created — the list is unchanged behind it.
4. **Rename a site.** Open `Alkali Flat Storage`, choose Edit, change the name to
   `Alkali Flat Injection Site`, submit. You return to the list, a toast confirms the
   change, and the new name is in place.
5. **A name is stored trimmed.** Create a site named `  Steens Basin  ` with leading and
   trailing spaces. It is stored as `Steens Basin` and sorts under S, not under a space.
6. **Archive asks first.** Open `Steens Basin`, choose Archive. A dialog names the site and
   says what archiving does. Dismiss it — the site is still in the list. Choose Archive
   again and confirm. You return to the list, a toast confirms it, and `Steens Basin` is
   gone from the list.
7. **The archived site is unreachable.** There is no screen anywhere in the app that lists
   archived sites, and no filter or toggle reveals `Steens Basin`.
8. **The archived row still exists.** In the Neon console's SQL Editor against the preview
   branch, `SELECT name, is_active FROM sequestration_sites WHERE name = 'Steens Basin';`
   returns one row with `is_active` false. Nothing deleted it.
9. **A colliding name offers to restore.** Create a site named `steens basin` — the same
   name in different case. The form says the name belongs to an archived site and offers to
   restore it. Accept. You return to the list, a toast confirms the restore, and
   `Steens Basin` is back with its original name and casing.
10. **Case-insensitive uniqueness holds at the database.** In the SQL Editor, run
    `INSERT INTO sequestration_sites (id, name, updated_at) VALUES ('t1', 'STEENS BASIN', now());`.
    Postgres refuses it with a unique violation naming the `lower(name)` index. No
    application surface attempts this, so the SQL Editor is the only place it can be proven.
11. **A name already taken by an active site is refused without a restore offer.** Create a
    site named `harney basin storage`. The form says the name is already a sequestration
    site. There is no Restore button — restoring is only offered for archived rows.
12. **The empty state.** Not reachable with seed data present, so confirm it on the phone by
    a different route if the preview database is ever empty; otherwise record this step as
    covered by the component test above and skip it.
13. **Producers still list.** Open `/producers`. The seeded producers are still there,
    ordered by name, stacked on the phone and a table on desktop, exactly as Phase 3 shipped
    them.
14. **A producer still creates and renames.** Create `Aspen Ridge Timber`, confirm the
    toast, rename it to `Aspen Ridge Timber Co`, confirm that toast too.
15. **A producer still archives behind a confirmation.** Archive `Aspen Ridge Timber Co`.
    The dialog names the producer and says it will leave the inbound movement dropdown — the
    producer wording, not the site wording. Confirm, and it disappears from the list with a
    toast.
16. **The producer restore path still works.** Create `aspen ridge timber co`. The form
    offers to restore the archived producer. Accept, and it returns with its original
    casing.
17. **Clean up.** Archive `Alkali Flat Injection Site`, `Steens Basin` and
    `Aspen Ridge Timber Co`, and delete the `t1` row if step 10 somehow created it.

## CI gate

These GitHub Actions checks must be green before the implementation pull request merges,
and are required on `main` — `specs/tech-stack.md` § CI/CD:

- `Commit convention`
- `Lint`
- `Typecheck`
- `Test`
- `Database`

The `Vercel` deployment check must also be green, which is what produces the preview the
manual steps run against.

This phase adds no CI job. `Database` already applies every checked-in migration to an empty
database and seeds it twice on each pull request, so the task 7 migration is covered by the
job that exists.

## Open questions

- **Nothing automated covers the Server Actions, for either entity.** Steps 2 to 11 prove
  the site actions by hand, once, and steps 13 to 16 prove the producer ones survived the
  refactor. `specs/roadmap.md` Phase 7's Playwright suite is what covers these flows per
  pull request, and it is the phase that should pick this up. Phase 3 carried the same
  question for producers alone.

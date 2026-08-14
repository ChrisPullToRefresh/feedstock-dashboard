# Phase 2 — Schema and migrations — Validation

## Automated

### Unit and component (Vitest + React Testing Library)

Phase 2 ships no components, so everything here is Vitest. Nothing in this section
touches a database.

**Schema shape** — tests reading `prisma/schema.prisma` as text and asserting the
decisions no type-checker guards:

- `Producer` and `SequestrationSite` each have a `cuid()` id, a `@unique` `name`, an
  `isActive` defaulting to `true`, `createdAt`, and `updatedAt`
- Both map to snake_case tables and columns via `@@map` and `@map`
- The `Direction` enum has exactly `INBOUND` and `OUTBOUND`
- `Movement.weightKg` carries `@db.Decimal(12, 3)` exactly
- `Movement`'s `producerId` and `sequestrationSiteId` relations are nullable and declare
  `onDelete: Restrict`
- `Movement.recordedAt` defaults to `now()`, and `Movement` has no `updatedAt` — an
  append-only row has nothing to update

**Migration shape** — a test reading the checked-in initial migration and asserting it
still contains the counterparty check constraint. This is the guard that stops a
regenerated migration from silently dropping hand-written SQL. It asserts the SQL is
present, not that it works; steps 4–7 below prove the behavior.

**Weight** (`src/lib/weight.ts`):

- Whole and fractional kilogram strings parse to the expected `Decimal`
- Negative, empty, non-numeric, and more-than-three-decimal inputs are rejected, with
  errors a form can tell apart
- Formatting a `Decimal` renders the kilogram string an operator would expect

**Totals** (`src/lib/totals.ts`):

- An empty array returns zero for every total
- Mixed inbound and outbound records separate correctly
- Grouping keys off the counterparty matching each record's direction — producers for
  inbound, sequestration sites for outbound
- A set of values that would drift as binary floats sums exactly

**Client singleton** (`src/lib/db.ts`) — two imports return the same instance, and the
instance is cached on `globalThis` outside production.

### Database (GitHub Actions, `Database` job)

On every pull request, the job:

1. Creates a Neon branch named for the workflow run
2. Runs `prisma migrate deploy` against it from empty — this is the phase's **Done when**
   condition, proven per pull request rather than once
3. Runs `npm run seed`, then records the row counts
4. Runs `npm run seed` a second time and asserts the row counts are unchanged
5. Deletes the branch in an `if: always()` step, so a failed or cancelled run does not
   leak it

The teardown is verified once during implementation by forcing a failing run and
confirming the branch is still deleted.

### End-to-end (Playwright)

Not applicable. `specs/roadmap.md` Phase 7 installs Playwright; this phase predates it.

## Manual

Run against a Neon branch created for the purpose. Get its URL into your shell as
`$DB_URL` before starting, and delete the branch when finished.

1. **Environment variables are wired.** Run `vercel env ls`. The Neon connection
   variables appear in development, preview, and production. Run `vercel env pull` and
   confirm `.env.local` now holds a connection URL; `git check-ignore .env.local` exits
   zero.
2. **A clean clone builds.** In a fresh clone, run `npm ci && npm run typecheck && npm run
   test`. All three pass with no manual `prisma generate` — `postinstall` did it.
3. **Migrate and seed the branch.** `DATABASE_URL=$DB_URL npx prisma migrate deploy`
   completes with no error, then `DATABASE_URL=$DB_URL npm run seed` reports the
   producers and sequestration sites it upserted. `psql "$DB_URL" -c '\dt'` lists
   `producers`, `sequestration_sites`, and `movements` in snake_case.
4. **A valid inbound movement is accepted.** In `psql "$DB_URL"`, insert a movement with
   `direction = 'INBOUND'`, `weight_kg = 1250.500`, a `producer_id` taken from
   `SELECT id FROM producers LIMIT 1`, and `sequestration_site_id` null. It inserts.
5. **An inbound movement with a sequestration site is rejected.** Repeat step 4 with
   `direction = 'INBOUND'` and a `sequestration_site_id` instead of a `producer_id`.
   Postgres reports a check constraint violation naming the counterparty constraint.
6. **A movement with both counterparties is rejected.** Insert with `direction =
   'OUTBOUND'` and both `producer_id` and `sequestration_site_id` set. Same violation.
7. **A movement with neither is rejected.** Insert with `direction = 'OUTBOUND'` and both
   null. Same violation.
8. **A movement cannot be updated.** Run `UPDATE movements SET weight_kg = 1 WHERE id =
   '<the row from step 4>';`. Postgres raises the trigger's exception and the row is
   unchanged — confirm with a `SELECT`.
9. **A movement cannot be deleted.** Run `DELETE FROM movements WHERE id = '<the same
   row>';`. Postgres raises the trigger's exception and the row is still there.
10. **A referenced producer cannot be deleted.** Run `DELETE FROM producers WHERE id =
    '<the producer from step 4>';`. Postgres reports a foreign key violation. Deleting a
    producer with no movements succeeds.
11. **Deactivation is not deletion.** Run `UPDATE producers SET is_active = false WHERE id
    = '<the producer from step 4>';`. It succeeds, the row remains, and the movement in
    step 4 still resolves to it.
12. **The preview deployment migrated itself.** Open this pull request's Vercel preview in
    a signed-in browser and confirm it built green. Its Neon branch holds the migrated
    tables and no seed data — `\dt` against the preview branch lists the three tables and
    `SELECT count(*) FROM producers` returns 0.
13. **Branch protection includes the new job.** Run `gh api
    repos/{owner}/{repo}/branches/main/protection --jq
    '.required_status_checks.contexts'`. It returns `Database` alongside
    `Commit convention`, `Lint`, `Typecheck`, and `Test`.
14. **Delete the branch** created for this run.

## CI gate

These GitHub Actions checks must be green before this pull request leaves draft, and are
required on `main` — `specs/tech-stack.md` § CI/CD:

- `Commit convention`
- `Lint`
- `Typecheck`
- `Test`
- `Database` — added by this phase, task 13, and made required by task 14

The Vercel preview deployment must also build green, which after task 12 means its
migration applied.

## Open questions

- **Nothing guards the immutability trigger between pull requests.** Steps 8 and 9 prove
  it once. See `plan.md` § Decisions for the choice and § Open questions for when to
  revisit.

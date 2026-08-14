# Phase 2 — Schema and migrations — Plan

Tasks run in order. Every feature task ships with its paired test task in the same
pull request.

| #  | Feature task | Paired test task |
|----|--------------|------------------|
| 1  | Neon Postgres provisioned through the Vercel Marketplace, with a database branch per preview deployment, and its connection variables present in every Vercel environment and in `.env.local` | Manual: `vercel env ls` lists the connection variables in development, preview, and production; `vercel env pull` gives a local URL that `psql` connects to; `git check-ignore .env.local` exits zero |
| 2  | Prisma installed, `prisma/schema.prisma` created with its datasource and generator, and a `postinstall` script running `prisma generate` | Manual: a fresh clone runs `npm ci && npm run typecheck && npm run test` green with no manual generate step |
| 3  | `Producer` and `SequestrationSite` models — `cuid()` id, a `name` unique within the model, `isActive` defaulting true, `createdAt`, `updatedAt` — with `@@map` and `@map` to snake_case tables and columns | Vitest test reading `prisma/schema.prisma` and asserting, per model: the `cuid()` id, the `@unique` on `name`, `isActive` defaulting true, and the snake_case table and column names |
| 4  | `Direction` enum and the `Movement` model — `cuid()` id, `direction`, `weightKg` as `Decimal @db.Decimal(12, 3)`, nullable `producerId` and `sequestrationSiteId` relations with `onDelete: Restrict`, `recordedAt` defaulting to `now()` — mapped to snake_case | Vitest test asserting the `Direction` enum's two values, the exact `Decimal(12, 3)` attribute, both relations nullable and `onDelete: Restrict`, `recordedAt` defaulting to `now()`, and the absence of any `updatedAt` on this model |
| 5  | A check constraint in the initial migration requiring exactly the counterparty that matches `direction`: inbound has a producer and no site, outbound has a site and no producer | Vitest test asserting the checked-in migration SQL still contains the constraint, so a regenerated migration cannot drop it silently. Behavior is proven by `validation.md` § Manual steps 4–7 |
| 6  | A Postgres trigger in the initial migration raising an exception on `UPDATE` or `DELETE` of a `movements` row | Manual: `validation.md` § Manual steps 8–9 attempt an update and a delete against a seeded movement in `psql` and record the exception each raises |
| 7  | The initial Prisma migration generated and checked in under `prisma/migrations/`, carrying the check constraint and the trigger | The `Database` CI job (task 13) applies it to a fresh Neon branch on every pull request |
| 8  | `src/lib/db.ts` exporting a `db` Prisma client singleton, cached on `globalThis` so Next's dev server does not open a client per hot reload | Vitest test asserting two imports return the same instance and that the instance is stored on `globalThis` outside production |
| 9  | `src/lib/weight.ts` — parse an entered kilogram weight to a `Decimal`, reject invalid input, format a `Decimal` for display | Vitest tests: whole and fractional kilograms parse; negative, zero-length, non-numeric, and more-than-three-decimal inputs are rejected with a distinguishable error; formatting a `Decimal` renders the kilogram string an operator would expect |
| 10 | `src/lib/totals.ts` — pure functions over arrays of movement records returning inbound total, outbound total, total by producer, and total by sequestration site | Vitest tests: an empty array totals zero; mixed directions are separated correctly; grouping keys off the counterparty that matches each movement's direction; summing values that would drift as binary floats stays exact |
| 11 | `prisma/seed.ts` upserting a realistic set of feedstock producers and sequestration sites on `name`, wired to `npm run seed` | The `Database` CI job runs the seed twice against the fresh branch and asserts the row counts are identical after each run |
| 12 | A `vercel-build` script running `prisma migrate deploy` before `next build` | Manual: this pull request's Vercel preview deploys green, and its Neon branch holds the migrated tables and no seed data |
| 13 | A `Database` job in `.github/workflows/ci.yml` that creates a Neon branch named for the run, applies migrations, seeds twice, and deletes the branch in an `if: always()` step, using a Neon API key and project id held in GitHub Actions secrets | The job's own run on this pull request, green — and one deliberately failing run confirming the branch is still deleted |
| 14 | `Database` added to `main`'s required status checks | Manual: `gh api repos/{owner}/{repo}/branches/main/protection --jq '.required_status_checks.contexts'` returns it alongside `Commit convention`, `Lint`, `Typecheck`, and `Test` |

## Decisions

Every entry below answers a question put to the user in the session that wrote this spec.

**A movement carries two nullable foreign keys and a check constraint.**

`specs/roadmap.md` gives a movement "a counterparty"; `specs/mission.md` says inbound
comes from a producer and outbound goes to a sequestration site. Those are two different
shapes. The schema takes both `producerId` and `sequestrationSiteId` as nullable
relations and adds a check constraint requiring exactly the one that matches `direction`.

This keeps real foreign keys, so the database — not application code — guarantees the
counterparty exists, and Phase 6's totals by producer and by site are ordinary Prisma
relations.

The alternatives were a polymorphic `counterpartyType` plus `counterpartyId` pair, and a
single `Counterparty` table with a kind column. The first was rejected because it has no
foreign key, so a deleted producer leaves a dangling movement. The second was rejected
because `specs/mission.md` gives producers and sequestration sites separate CRUD pages,
and Phases 3 and 4 would become two views over one table that diverge as their fields do.

The cost accepted: Prisma cannot express the check constraint, so it is hand-written SQL
in the initial migration, guarded by the test in task 5. Both foreign keys read as
nullable at every call site.

**Weights are `Decimal(12, 3)` kilograms.**

`specs/tech-stack.md` § Data fixes the unit and not the type. Exact decimal arithmetic is
what keeps Phase 6's running totals from drifting, and the stored unit is the kilogram
the constitution names rather than a gram count that anyone querying directly would have
to know to convert.

The alternatives were an integer gram count and a double. The integer was rejected
because the column would be in a unit `specs/mission.md` says the system does not use.
The double was rejected because binary floats do not sum exactly, and Phase 6's totals
are precisely where that surfaces.

The cost accepted: Prisma returns a `Decimal` object rather than a number, so display and
test assertions go through it — which is why task 9 exists.

**Primary keys are `cuid()` strings.**

Prisma's default idiom, URL-safe, and opaque: an id in Phase 3's `/producers/[id]` route
reveals nothing about how many producers exist. Auto-increment integers were rejected
because they are enumerable on an app that is authenticated but has no per-record
authorization. `uuid(7)` was rejected as offering nothing here that `cuid()` does not.

The cost accepted: long ids in URLs and in seed output.

**Referenced producers and sites cannot be deleted — `onDelete: Restrict`.**

Movements are immutable history. Cascading deletes would destroy that history, and
leaving the reference dangling contradicts the foreign key. The database refuses the
delete instead.

The cost accepted, and the reason the next decision exists: a producer that has ever been
used can never be removed by deletion.

**`isActive` is the retire path; delete is for mistakes only.**

Clearing `isActive` removes a producer or site from the movement-entry dropdowns while
its history stays intact and its record stays editable. Delete remains in Phases 3 and 4
for rows created in error, and `onDelete: Restrict` makes the database refuse it once any
movement references the row.

This was asked as a follow-up, because `isActive` and `Restrict` together give a row two
ways to leave the dropdown and the spec should not leave which-is-for-what to the phase
that finds out. The alternatives were dropping delete from Phases 3 and 4 entirely —
rejected because it would require amending both phases' **Done when** lines first — and
dropping `isActive` — rejected because it leaves no way to retire a used producer.

The cost accepted: Phases 3 and 4 build two controls and have to make the difference
legible in the UI. `requirements.md` § Open questions carries the wording question to
those phases.

**Movements carry one timestamp, `recordedAt`, defaulted to the server clock.**

This matches the roadmap bullet literally and matches `specs/mission.md`, whose entry
flows collect only a weight and a counterparty. A separate operator-set `occurredAt` was
rejected because it grows Phase 5's mobile forms a date-time input the mission does not
ask for, on the one-handed-at-the-scale screen the whole design is built around.

The cost accepted: a movement logged an hour after it happened carries the logging time,
and nothing records the difference.

**`direction` is a Postgres enum.**

Enforced by the database and typed in the client, so an invalid direction cannot be
written and the check constraint has a concrete value to key on. A text column with its
own constraint was rejected because TypeScript would see a plain string. A boolean was
rejected as unreadable at the query level and closed to any third movement kind.

The cost accepted: Postgres enums are awkward to alter — adding or renaming a value later
is its own migration.

**Producers and sites carry a name and an `isActive` flag, nothing else.**

Name is the only field any v0.1 screen reads, and the unique constraint the seed upserts
against sits on it. Optional contact and notes fields were rejected as fields nothing
reads that Phases 3 and 4 would still have to validate.

The cost accepted: the first request for a contact or an address is a migration.

**Tables and columns are snake_case via `@@map` and `@map`.**

`sequestration_sites`, `recorded_at` — conventional Postgres, unquoted in `psql`, and
friendlier to any tool later pointed at this database. It also keeps the hand-written SQL
in the migration — the check constraint and the immutability trigger — free of quoted
mixed-case identifiers.

The cost accepted: every model and most fields carry a mapping line, and everything has
two names that have to stay in step.

**The seed is idempotent, upserting on `name`.**

Re-running it is a no-op, which is what makes it safe against a shared database and what
lets the `Database` CI job prove idempotence by running it twice. A truncate-then-insert
seed was rejected because a mis-set `DATABASE_URL` would be unrecoverable with no
confirmation step; an insert-only seed was rejected because it makes seeding a one-shot
per database.

The cost accepted: the schema is committed to a unique `name` on both reference models —
two producers can never share a name.

**Phase 2 owns pure calculation; Phase 6 owns querying and display.**

The last roadmap bullet — "unit tests over any weight or total calculation helpers" —
leaves open whether Phase 2 writes any. It writes both the weight module and the totals
functions, as pure functions over arrays of movement records, testable with no database.

This was raised with the user as a collision: `specs/roadmap.md` Phase 6 carries "unit
tests over the totals calculations", and `specs/tech-stack.md` § Branching says a phase's
work belongs in that phase's pull request. The resolution asked for is a split by layer
rather than a roadmap edit. Phase 6 still fetches, filters, groups by producer and site,
and renders, with its own tests over that; its bullet reads as covering the totals it
builds. Amending the roadmap first was offered and declined; so was reverting to weight
helpers alone.

The cost accepted: where the line sits is a judgment call, and Phase 6 may find the pure
functions need reshaping when the real queries arrive. Prisma `groupBy` wrappers were
rejected for this phase because every test of them needs a live database, which this
phase has no Vitest harness for.

**The Prisma client singleton is `src/lib/db.ts`, exporting `db`.**

Matches the flat, short-named files already in `src/lib/` — `navigation.ts`, `routes.ts`,
`provision-user.ts`, `utils.ts`. `src/lib/prisma.ts` was the alternative, matching
Prisma's own Next.js documentation; rejected for the longer identifier at every call
site.

**`prisma generate` runs from `postinstall`.**

`npm ci` generates the client everywhere — the three existing CI jobs, Vercel's build,
and a fresh clone — with no workflow edit and no way to forget. Explicit steps in each CI
job were rejected as three copies of one step that every new job has to remember.
Committing the generated client was rejected as a large generated directory in every
diff, drifting whenever someone edits the schema without regenerating.

The cost accepted: every install pays the generation time, and a broken schema fails at
install rather than at a named step.

**A required `Database` CI job proves the Done-when line, on a Neon branch it creates
and deletes itself.**

`specs/roadmap.md` Phase 2's **Done when** is "migrations run clean against Neon from a
fresh database and seed data loads". A job that creates a branch per run, migrates,
seeds, and tears down proves exactly that, on every pull request rather than once by
hand — and it is the harness Phase 7's E2E runs will need.

A one-off manual run was offered and rejected; so was a long-lived `ci` branch, which
concurrent pull requests would collide on, and a Postgres service container, which would
not prove anything about Neon. The job is a required check on `main`, because
`specs/tech-stack.md` § CI/CD makes green CI a hard merge requirement and a migration
that will not apply is exactly what should block a merge. A `paths` filter was rejected:
GitHub treats a skipped required check as pending, so it would block the merge button on
documentation pull requests rather than speed them up.

The cost accepted: a Neon API key and project id in GitHub Actions secrets; every pull
request, including documentation-only ones, waits on a branch being created and torn
down; and a runner killed mid-job can leak a branch, which is why the delete step is
`if: always()` and why task 13 tests a failing run.

**The immutability trigger is proven by hand, once.**

No Vitest test can reach a Postgres trigger without a live database, and this phase
builds no database test harness. `validation.md` § Manual carries the `psql` attempts and
the exception each raises. A live-database integration suite was offered and rejected as
a test-infrastructure phase inside a schema phase.

The cost accepted, and stated plainly: nothing guards the trigger afterwards. A later
regenerated migration can drop it with no test turning red. The check constraint has that
guard — task 5 — and the trigger does not. This was the user's choice between the two.

**Deployments migrate themselves — `vercel-build` runs `prisma migrate deploy`.**

With a Neon branch per preview deployment, each preview starts empty. Running
`prisma migrate deploy` before `next build` means every preview and production deployment
migrates itself, so Phases 3 onward have a working preview with no manual step.

Migrating previews by hand was rejected as a step every later phase pays and that looks
like an application bug when forgotten. Parking it was rejected because this phase's own
preview would have an empty database.

The cost accepted: a failed migration fails the deployment, and production migrations run
at build time. `requirements.md` § Open questions carries that to Phase 8.

## Open questions

- **Whether build-time migration is right for production.** Carried in
  `requirements.md` § Open questions; belongs to `specs/roadmap.md` Phase 8.
- **How Phases 3 and 4 word "delete" now that deactivation exists.** Carried in
  `requirements.md` § Open questions; belongs to those phases' specs.
- **Whether the trigger needs a guard.** The decision above accepts that nothing stops a
  later migration from dropping it. If Phase 7's Playwright harness brings a live test
  database, that is the cheapest moment to add one.

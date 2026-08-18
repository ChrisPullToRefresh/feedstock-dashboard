# Phase 2 — Schema and migrations — Plan

Tasks run in order. Every feature task ships with its paired test task in the same
pull request.

| #  | Feature task | Paired test task |
|----|--------------|------------------|
| 1  | Neon Postgres provisioned through the Vercel Marketplace, with a database branch per preview deployment — Storage → the database → Projects → Update Project Connection, which needs *Require Active Resource Before Deploy* on before *Create Database Branch For Deployment → Preview* can be ticked — and its connection variables present in every Vercel environment and in `.env.local` | Manual: `vercel env ls` lists the connection variables in development, preview, and production; `vercel env pull` gives a local URL that Prisma connects to; `git check-ignore .env.local` exits zero |
| 2  | Prisma installed, `prisma/schema.prisma` created with its datasource and generator, `prisma.config.ts` created carrying the migrate connection URL and the seed command, and a `postinstall` script running `prisma generate` | Manual: a fresh clone runs `npm ci && npm run typecheck && npm run test` green with no manual generate step |
| 3  | `Producer` and `SequestrationSite` models — `cuid()` id, a `name` unique within the model, `isActive` defaulting true, `createdAt`, `updatedAt` — with `@@map` and `@map` to snake_case tables and columns | Vitest test reading `prisma/schema.prisma` and asserting, per model: the `cuid()` id, the `@unique` on `name`, `isActive` defaulting true, and the snake_case table and column names |
| 4  | `Direction` enum and the `Movement` model — `cuid()` id, `direction`, `weightKg` as `Decimal @db.Decimal(12, 3)`, nullable `producerId` and `sequestrationSiteId` relations with `onDelete: Restrict`, `recordedAt` defaulting to `now()` — mapped to snake_case | Vitest test asserting the `Direction` enum's two values, the exact `Decimal(12, 3)` attribute, both relations nullable and `onDelete: Restrict`, `recordedAt` defaulting to `now()`, and the absence of any `updatedAt` on this model |
| 5  | A check constraint in the initial migration requiring exactly the counterparty that matches `direction`: inbound has a producer and no site, outbound has a site and no producer | Vitest test asserting the checked-in migration SQL still contains the constraint, so a regenerated migration cannot drop it silently. Behavior is proven by `validation.md` § Manual steps 4–7 |
| 6  | A Postgres trigger in the initial migration raising an exception on `UPDATE` or `DELETE` of a `movements` row | Manual: `validation.md` § Manual steps 8–9 attempt an update and a delete against a seeded movement in Neon's SQL Editor and record the exception each raises |
| 7  | The initial Prisma migration generated and checked in under `prisma/migrations/`, carrying the check constraint and the trigger | The `Database` CI job (task 13) applies it to a fresh Neon branch on every pull request |
| 8  | `src/lib/db.ts` exporting a `db` Prisma client singleton, constructed with the `pg` driver adapter and cached on `globalThis` so Next's dev server does not open a client per hot reload | Vitest test asserting two imports return the same instance, that the instance is stored on `globalThis` outside production, and that it is not stored there in production |
| 9  | `src/lib/weight.ts` — parse an entered kilogram weight to a `Decimal`, reject invalid input, format a `Decimal` for display | Vitest tests: whole and fractional kilograms parse; negative, zero, zero-length, non-numeric, more-than-three-decimal, and larger-than-`Decimal(12, 3)` inputs are rejected with a distinguishable error; formatting a `Decimal` renders the kilogram string an operator would expect |
| 10 | `src/lib/totals.ts` — pure functions over arrays of movement records returning inbound total, outbound total, total by producer, and total by sequestration site | Vitest tests: an empty array totals zero; mixed directions are separated correctly; grouping keys off the counterparty that matches each movement's direction; summing values that would drift as binary floats stays exact |
| 11 | `prisma/seed.ts` upserting a realistic set of feedstock producers and sequestration sites on `name`, wired to `npm run seed` | The `Database` CI job runs the seed twice against the fresh branch and asserts the row counts are identical after each run |
| 12 | A `vercel-build` script running `prisma migrate deploy` before `next build` | Manual: this pull request's Vercel preview deploys green, and its Neon branch holds the migrated tables and no seed data |
| 13 | A `Database` job in `.github/workflows/ci.yml` that applies migrations to an empty Postgres service container and seeds it twice, requiring identical row counts. The Neon half of the **Done when** line is proven once by hand, not by this job — see § Decisions | The job's own run on this pull request, green |
| 14 | `Database` added to `main`'s required status checks | Manual: `gh api repos/{owner}/{repo}/branches/main/protection --jq '.required_status_checks.contexts'` returns it alongside `Commit convention`, `Lint`, `Typecheck`, and `Test` |

## Decisions

Every entry below answers a question put to the user — most in the session that wrote
this spec, and the last two in the session that implemented it, where building against
the real tooling raised a question the spec had not anticipated.

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

**Deletion is soft. Producers and sequestration sites are archived, never removed.**

Clearing `isActive` retires a producer or site from the movement-entry dropdowns while
its record stays editable and every movement that references it stays resolvable. That is
the only removal in the app — Phases 3 and 4 ship an archive control and no delete.
`specs/mission.md` § Constraints and `specs/tech-stack.md` § Data now say so, and
`specs/roadmap.md` Phases 3 and 4 are written in those terms.

A row created in error does not need deletion: producers and sites are editable, so a
mistyped row is corrected by editing it.

`onDelete: Restrict` stays on both relations as the backstop. It is not a rule a user can
reach — nothing in the app attempts a delete — but it stops any future code path from
destroying a movement's counterparty. Validation proves it in Neon's SQL Editor rather
than through a screen.

Cascading deletes were rejected because movements are immutable history; a dangling
reference was rejected because it contradicts the foreign key; and hard delete for
unreferenced rows was rejected because it gives a row two removal paths whose difference
is invisible at the moment of choosing.

The cost accepted: archived rows accumulate in the list surfaces with nothing to prune
them, and a name held by an archived row stays taken, because the unique constraint the
seed upserts against does not distinguish active rows.

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

`sequestration_sites`, `recorded_at` — conventional Postgres, unquoted in any SQL
client, and
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

**A required `Database` CI job proves migration-from-empty per pull request; the Neon
half is proven once, by hand.**

`specs/roadmap.md` Phase 2's **Done when** is "migrations run clean against Neon from a
fresh database and seed data loads". That is two claims — the migration applies to an
empty database and the seed loads, and it happens against Neon — and nothing available
proves both at once.

The `Database` job applies the checked-in migration to an empty Postgres service
container, seeds it, seeds it again, and fails if the row counts moved. Deterministic,
free, and on every pull request.

Against Neon, it was proven once during implementation: `prisma migrate reset` dropped
the schema on the Neon database and re-applied every migration from empty, then the seed
loaded. That is real evidence, and it is a one-off. **Nothing re-proves it per pull
request, and nothing turns red if it stops being true.**

An earlier version of this decision claimed the Vercel preview deployment covered the
Neon half, on the reasoning that branch-per-preview gives each pull request its own empty
Neon branch for `vercel-build` to migrate. That was wrong, and the build log disproved
it: the preview reported "No pending migrations to apply". Neon's preview branches are
copy-on-write clones of the parent, so they arrive already carrying its schema and its
rows — `prisma migrate deploy` finds the migration recorded and does nothing. The preview
deployment proves the application builds and runs against Neon. It proves nothing about
applying a migration to an empty database there.

This decision was rewritten during implementation and replaces the original, which had
the job create and delete a Neon branch per run through the Neon API. That needed a Neon
API key, and the key could not be obtained: the project is Vercel-managed, so the console
is the only place to mint one, and the account-link flow that grants console access
failed repeatedly. Neon's own documentation notes that `neon auth` does not work for
Vercel-managed accounts and CLI access requires an API key, which leaves no way to
bootstrap one. Waiting on Neon support was offered and declined; shipping with the job
unverified was offered and declined.

It does remove a credential from CI, and a class of failure where a killed runner leaks a
branch. It is still a concession: the original decision rejected a service container as
proving "nothing about Neon", and that objection stands.

A long-lived `ci` branch was rejected, as before, because concurrent pull requests would
collide on it. The job stays a required check on `main`, because `specs/tech-stack.md`
§ CI/CD makes green CI a hard merge requirement and a migration that will not apply is
exactly what should block a merge. A `paths` filter was rejected: GitHub treats a skipped
required check as pending, so it would block the merge button on documentation pull
requests rather than speed them up.

The cost accepted, and stated plainly: **no check proves the Neon half.** The container
runs stock Postgres rather than Neon's build, so any divergence between them — a version
difference, an extension, a permission — would not surface here. What guards against that
in practice is that every deployment runs `prisma migrate deploy` against Neon, so a
migration Neon rejects fails the deploy; that is a weaker claim than the **Done when**
line makes, and it is the gap this phase ships with.

**The immutability trigger is proven by hand, once.**

No Vitest test can reach a Postgres trigger without a live database, and this phase
builds no database test harness. `validation.md` § Manual carries the SQL Editor attempts
and
the exception each raises. A live-database integration suite was offered and rejected as
a test-infrastructure phase inside a schema phase.

The cost accepted, and stated plainly: nothing guards the trigger afterwards. A later
regenerated migration can drop it with no test turning red. The check constraint has that
guard — task 5 — and the trigger does not. This was the user's choice between the two.

**That cost was paid off after Phase 5, and the premise turned out to be wrong.** Both
halves were available without a new harness. `src/test/prisma-migration.test.ts` already
guarded the check constraint by reading the checked-in SQL, and the same technique asserts
the trigger is declared and not dropped later. And this phase's own `Database` CI job
already stands up a real Postgres, so it now inserts a movement and requires both the
UPDATE and the DELETE to be refused — the half no search over SQL can answer. Neither
needed Phase 7. See § Open questions.

**Deployments migrate themselves — `vercel-build` runs `prisma migrate deploy`.**

With a Neon branch per preview deployment, each preview starts empty. Running
`prisma migrate deploy` before `next build` means every preview and production deployment
migrates itself, so Phases 3 onward have a working preview with no manual step.

Migrating previews by hand was rejected as a step every later phase pays and that looks
like an application bug when forgotten. Parking it was rejected because this phase's own
preview would have an empty database.

The cost accepted: a failed migration fails the deployment, and production migrations run
at build time. `requirements.md` § Open questions carries that to Phase 8.

**Prisma 7, with connection URLs in `prisma.config.ts` and a driver adapter.**

Raised during implementation. This spec was written against Prisma 6's shape, and the
current major changes three things it assumed. `datasource` no longer accepts `url` or
`directUrl` — connection URLs move to a new `prisma.config.ts`. `PrismaClient` has no
built-in query engine and requires a driver adapter passed to its constructor. The seed
command moves from a `prisma` block in `package.json` to `migrations.seed` in the same
config file.

Pinning Prisma 6 to keep the spec literally true was offered and declined, as was
stopping to amend the spec before writing any code. The user's answer was to build on 7
and record the shape here.

`@prisma/adapter-pg` is the adapter. `@prisma/adapter-neon` was tried first, on the
reasoning that the pooled `DATABASE_URL` runs PgBouncer in transaction mode and Neon's
own driver is built for it. It was replaced once the `Database` job stopped using Neon
(see the decision below): Neon's serverless driver speaks Neon's protocol and cannot
reach a stock Postgres, so CI would have had to construct its client differently from
the application's — testing something other than what ships. node-postgres sends unnamed
statements, so transaction pooling has nothing to trip over. Migrations keep using the
unpooled URL, which is what `prisma.config.ts` carries.

The cost accepted: two files hold what one used to — the schema no longer tells you what
it connects to — and the pooled connection is used through a general-purpose driver
rather than one tuned for this vendor.

**A weight of zero is refused, not stored.**

Raised during implementation. Task 9 lists negative, zero-length, non-numeric, and
over-precise inputs as rejections and says nothing about zero, which left accepting it as
the literal reading.

Zero is refused instead. A movement of nothing is not a movement: it would add a row that
every total in Phase 6 ignores and that no operator could explain later. It gets its own
`not-positive` reason alongside negatives, so Phase 5's form can word the two together or
apart as it finds best.

The alternative — accepting zero because the spec did not name it — was rejected as a
reading that produces junk rows nothing else in the system has a use for.

The cost accepted: an operator who genuinely wants to record a zero-weight event cannot,
and would have to record the fact somewhere the system does not yet have.

## Open questions

- ~~**Whether build-time migration is right for production.**~~ Now a Phase 8 bullet in
  `specs/roadmap.md`, to settle before `main` is promoted. Answered in `requirements.md`
  § Open questions.
- ~~**Whether archived rows ever need pruning.**~~ No — `specs/mission.md` § Constraints
  forbids hard deletion outright, and pruning is that under another name. The related
  question this entry pointed at, whether archived producers ever need a screen, was
  settled after Phase 5: no screen in v0.1, and one is deferred work under
  `specs/roadmap.md` § After v0.1.
- ~~**Whether an archived name should free itself for reuse.**~~ Answered by
  `specs/roadmap.md` Phase 3: it does not. The name stays taken and the archived producer
  is restored instead — `specs/2026-08-14-producers/plan.md` § Decisions, "A name that
  collides with an archived producer offers to restore it".
- ~~**Whether the trigger needs a guard.**~~ It does, and it has one as of the maintenance
  change after Phase 5. This entry assumed the guard had to wait for Phase 7's Playwright
  harness to bring a live database; it did not. `src/test/prisma-migration.test.ts`
  asserts the SQL is still checked in and not dropped by a later migration, and this
  phase's own `Database` CI job inserts a movement and requires both an UPDATE and a
  DELETE to be refused. Append-only history is binding in `specs/mission.md`
  § Constraints and is the one property of this data model that cannot be repaired after
  the fact, so it is guarded at both levels rather than one.

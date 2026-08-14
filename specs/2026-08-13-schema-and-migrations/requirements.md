# Phase 2 — Schema and migrations — Requirements

**Phase:** 2 in `specs/roadmap.md`
**Scope of this spec:** all seven of Phase 2's roadmap bullets. Nothing is deferred to a
later spec.

## Goal

The database exists, with a schema that can hold feedstock producers, sequestration
sites, and append-only movements — provisioned on Neon, migrated from a checked-in
migration, and seeded with realistic reference data.

Phase 2 ships no user interface. Everything it produces is read by Phases 3 through 6.

## Behavior

**Reference data.** A feedstock producer and a sequestration site each have a name that
is unique among their kind, an active flag, and creation and update timestamps. Both are
editable — `specs/mission.md` § Constraints.

Deletion is soft — `specs/mission.md` § Constraints. Clearing the active flag archives a
row, retiring it from the movement-entry dropdowns while leaving its record and its
movement history intact. No surface in the app removes a producer or a sequestration
site, and a row created in error is corrected by editing it. `onDelete: Restrict` stays
on both relations as a backstop, so no future code path can destroy a movement's
counterparty even though none tries.

**Movements.** A movement records a direction (inbound or outbound), a weight in
kilograms, the counterparty it moved to or from, and the timestamp at which it was
recorded. An inbound movement carries a producer and no sequestration site; an outbound
movement carries a sequestration site and no producer. The database rejects any other
combination.

**Immutability.** A movement, once written, cannot be updated or deleted. The database
raises an exception on either. This is `specs/mission.md` § Constraints — "a mistake is
corrected by recording a new adjusting entry, never by editing or deleting history" —
made enforceable rather than remembered.

**Weight arithmetic.** Weights are held as exact decimals in kilograms, to the gram.
Parsing an entered weight, rejecting an invalid one, formatting one for display, and
summing a set of movements into totals are pure functions with no database access, so
Phase 5's forms and Phase 6's totals both build on tested arithmetic.

**Environments.** Local development, every preview deployment, and production each read a
Neon database. Preview deployments get their own Neon branch. Deployments migrate
themselves at build time, so a preview is usable the moment it finishes building.

## Acceptance criteria

- [ ] Migrations run clean against Neon from a fresh database and seed data loads —
      `specs/roadmap.md` Phase 2 **Done when**
- [ ] `prisma/schema.prisma` defines `Producer`, `SequestrationSite`, and `Movement`,
      and is the only source of truth for the data model
- [ ] The initial migration is checked in and no schema change exists outside a migration
- [ ] An inbound movement with a sequestration site, an outbound movement with a
      producer, a movement with both, and a movement with neither are each rejected by
      the database
- [ ] `UPDATE` and `DELETE` against a movement row raise a Postgres exception
- [ ] Deleting a producer or sequestration site that a movement references is refused by
      the database, proven directly in `psql` — no application surface attempts it
- [ ] `npm run seed` run twice against the same database leaves the same rows
- [ ] The `Database` CI job creates a fresh Neon branch, migrates, seeds, and deletes the
      branch, and is a required check on `main`
- [ ] `Lint`, `Typecheck`, and `Test` stay green on a clean clone with no manual
      `prisma generate`
- [ ] Weight parsing, formatting, and totals are covered by Vitest unit tests

## Out of scope

- Any page, form, or component. Phases 3 through 6 build the surfaces that read this
  schema.
- Querying totals from the database. Phase 2 ships the arithmetic; the `groupBy`
  aggregation, filtering, and display are Phase 6's — see `plan.md` § Decisions.
- Playwright. `specs/roadmap.md` Phase 7 installs it.
- Production database promotion. `specs/roadmap.md` Phase 8 owns production.

## Constraints inherited from the constitution

- **Prisma is the source of truth.** `specs/tech-stack.md` § Data — the schema lives in
  `prisma/schema.prisma`, every schema change ships as a checked-in Prisma migration, and
  the database is never edited by hand.
- **Neon through the Vercel Marketplace,** so connection environment variables are wired
  into the project automatically — `specs/tech-stack.md` § Data.
- **Kilograms are the only unit.** `specs/mission.md` § Constraints. No conversion, no
  per-user preference.
- **Movements are append-only; producers and sequestration sites are editable.**
  `specs/mission.md` § Constraints and `specs/tech-stack.md` § Data.
- **TypeScript strict mode** — `specs/tech-stack.md` § Application.
- **Green CI is a hard merge requirement** and direct pushes to `main` are blocked —
  `specs/tech-stack.md` § CI/CD and § Branching & pull request workflow.
- **One pull request for this phase** — `specs/tech-stack.md` § Branching & pull request
  workflow.

## Open questions

- **Whether build-time migration survives Phase 8.** `plan.md` task 12 runs
  `prisma migrate deploy` in `vercel-build`, which means production migrations run during
  a production build. That is acceptable while the app is pre-launch and has no data to
  lose. `specs/roadmap.md` Phase 8 promotes `main` to production and is where this should
  be re-examined.
- **Whether archived rows ever need pruning.** Nothing removes a producer or site, so the
  list surfaces grow monotonically, and an archived row keeps its name reserved. Neither
  matters until Phase 3 renders the list.

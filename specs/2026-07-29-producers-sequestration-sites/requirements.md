# Requirements: Phase 2 — Producers & Sequestration Sites

## Goal

Support managing the two reference lists that weight entries depend on. (roadmap.md, Phase 2)

## Why this matters

Phase 1 delivered an authenticated app skeleton with nowhere yet to put facility data.
mission.md's Key Features call for "Producer and site selection via dropdown lists at time
of entry" — but that dropdown-driven entry (Phase 3) needs somewhere for those dropdown
values to come from first. Phase 2 builds that: the feedstock producer and sequestration
site reference lists, plus the pages to create and view them, so Phase 3's entry forms have
real data to select from instead of being blocked on it.

## Scope

### In scope

All five Phase 2 checklist items from roadmap.md:

1. Data model for feedstock producers
2. Data model for sequestration sites
3. Dedicated page to create a new feedstock producer
4. Dedicated page to create a new sequestration site
5. List views for existing producers and sites

### Out of scope (deferred)

- **Role-based access enforcement** on producer/site creation or viewing — per this spec's
  Key Decisions below, that's deferred to Phase 4 ("Role-based access checks across
  producer/site creation vs. entry"), consistent with how Phase 1's requirements.md already
  deferred the same thing for that phase's scope.
- **Producer/site fields beyond a name** (e.g. contact info, address, capacity) — neither
  mission.md nor roadmap.md's Phase 2 checklist calls for anything beyond what's needed to
  identify an entity in a dropdown. Postgres makes adding columns later straightforward, so
  there's no rebuild risk in starting minimal.
- **Editing or deleting** existing producers/sites — roadmap.md's Phase 2 checklist lists
  only creation and list views; edit/delete aren't mentioned and aren't needed for Phase 3 to
  proceed.
- **Wiring producers/sites into the actual weight-entry dropdowns** — that's Phase 3's job
  ("Record incoming feedstock: weight (kg) + producer selected from dropdown"). Phase 2 only
  needs the reference data and management pages to exist.

## Key decisions

### Role gating: deferred to Phase 4

Any signed-in user (operator or admin) can create and view producers and sites in this
phase — the pages don't check `x-user-role` at all yet.

**Rationale:**
- roadmap.md's Phase 4 explicitly owns "Role-based access checks across producer/site
  creation vs. entry," and Phase 1's requirements.md already established the precedent that
  role *enforcement* is Phase 4 scope even though the role itself exists and is readable
  from Phase 1 onward (`x-user-role` header, per `src/proxy.ts`). Phase 2 follows that same
  boundary rather than re-deciding it.
- roadmap.md's Phase 2 success criteria says "An admin can create and view feedstock
  producers and sequestration sites" — read here as describing who is expected to use these
  pages in practice (facility admin staff), not as a Phase 2 requirement to technically gate
  the routes to the admin role. Enforcing that gate is exactly the Phase 4 item above; until
  then, any authenticated user reaching these pages is acceptable, since Phase 1 already
  restricts the whole app to signed-in facility staff (no public sign-up).

### Data model: minimal fields (name only) per entity

Both `producers` and `sequestration_sites` are modeled as a Postgres table with just an
`id` and a `name` (plus a `created_at` timestamp for auditability, matching tech-stack.md's
rationale for Clerk-based auditability extended to facility reference data).

**Rationale:**
- mission.md's Key Features only ever describe producers and sites as dropdown selections
  ("Producer and site selection via dropdown lists at time of entry") — nothing in
  mission.md or roadmap.md's Phase 2 checklist calls for additional attributes.
- Keeping both tables symmetric (same shape) matches mission.md's framing of producers and
  sequestration sites as parallel entities — the two legs of the same movement.

## Context from mission.md

- Key Features: "Producer and site selection via dropdown lists at time of entry,"
  "Dedicated pages for creating new feedstock producers," "Dedicated pages for creating new
  sequestration sites" — this phase is exactly these two dedicated-page features plus their
  underlying data model.
- Differentiator: "One system for both legs of the movement" — producers (incoming) and
  sequestration sites (outgoing) are modeled as parallel, symmetric entities in the same
  Neon database for this reason.
- The primary persona (Facility Scale Operator) is a field, mobile-first user, but this
  phase's pages are creation/management screens more likely used by admin staff — still
  built mobile-friendly per the app's mobile-first baseline (Phase 1's `Shell`), but without
  the same field-urgency Phase 3's entry forms will have.

## Constraints from tech-stack.md

- Neon Postgres is the fixed store for "producers, sequestration sites, and weight
  transactions" — not a decision to re-litigate here.
- Next.js (React, TypeScript) App Router, using Phase 1's `Shell` component/`(app)` route
  group as the layout these new pages live inside.
- Vitest + React Testing Library for unit/component tests; Playwright E2E for any
  user-facing page, per tech-stack.md's Testing & CI/CD Practices ("anything user-facing...
  also gets a Playwright E2E test covering the primary flow").
- GitHub Actions must run lint + typecheck, unit/component tests, E2E tests, a production
  build, and commit-message lint on every PR; all five green plus at least one review
  approval before merge. This tooling is already stood up (Phase 1) and unchanged here.
- Commit messages follow Conventional Commits, enforced locally (Husky) and in CI — already
  active from Phase 1's Group 6 onward.

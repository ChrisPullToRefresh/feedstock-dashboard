# Requirements: Phase 1 — Foundation & Auth

## Goal

Stand up the app skeleton with authenticated access, ready for facility data
to be entered. (roadmap.md, Phase 1)

## Why this matters

The processing facility has no existing paper log or spreadsheet process to
replace — the app is the system of record from day one (mission.md,
Problem). Before any facility data (producers, sites, transactions) can be
entered, there needs to be a deployed, authenticated app skeleton that the
Facility Scale Operator persona can reach from a phone in the field, and
that an admin can eventually build on top of.

## Scope

### In scope

All seven Phase 1 checklist items from roadmap.md:

1. Next.js project scaffolded, deployed to Vercel
2. Neon Postgres database provisioned and connected
3. Clerk auth integrated with roles (scale operator vs. admin)
4. Base mobile-friendly layout/navigation shell
5. Vitest + React Testing Library configured for unit/component tests
6. Playwright configured for E2E tests
7. GitHub Actions CI pipeline (lint + typecheck, unit tests, E2E tests,
   production build) required on every PR

### Out of scope (deferred)

- **Role-based access *enforcement*** across specific pages/actions (e.g.
  gating producer/site creation to admins only) — this is explicitly a
  Phase 4 item ("Role-based access checks across producer/site creation vs.
  entry"). Phase 1 only needs the role to exist and be readable, not acted
  on anywhere yet since there's no producer/site/entry functionality built
  yet to gate.
- Any producer, sequestration site, or transaction data models or pages —
  Phase 2 and Phase 3.
- Real mobile-device QA pass across "core flows" — Phase 4 explicitly owns
  this ("Basic QA pass across core flows on real mobile devices"); there are
  no core flows yet beyond sign-in and reaching an empty shell.

## Key decisions

### Role modeling: Clerk `publicMetadata` + middleware checks

Roles (scale operator vs. admin) are stored in each Clerk user's
`publicMetadata.role` field, set via the Clerk dashboard for now. Next.js
middleware/route handlers read the role off the session claims
(`auth().sessionClaims.metadata.role`) to make it available for gating
later.

**Rationale:**
- No new Postgres table is needed — Clerk remains the single source of
  truth for both identity and role, keeping Phase 1 a true skeleton.
- Matches the phase boundary in roadmap.md: Phase 1 needs roles to "exist,"
  Phase 4 needs them "enforced." A metadata field is enough to support that
  split without premature structure.
- Tech-stack.md's rationale for choosing Clerk is auditability of who
  recorded each transaction and future separation of producer/site creation
  from day-to-day entry — `publicMetadata.role` directly supports both
  without adding a second system of record for roles (rejected alternative:
  a Neon-backed roles table, which would duplicate identity data across two
  systems this early; also rejected: Clerk Organizations, which models
  multi-tenant orgs that mission.md's single-facility context doesn't call
  for).

## Context from mission.md

- Primary persona (Facility Scale Operator) works in the field, often
  outdoors near a scale, entering data on a phone/tablet — the mobile
  shell must be usable one-handed or in a hurry from day one, even though
  it has no content yet in this phase.
- The app has no legacy process to interoperate with, so there's no
  migration/import concern for this phase — a clean skeleton is sufficient.

## Constraints from tech-stack.md

- Next.js (React, TypeScript), hosted on Vercel, Neon Postgres, Clerk for
  auth — all fixed choices, not decisions to re-litigate in this phase.
- Vitest + React Testing Library for unit/component tests; Playwright for
  E2E, including mobile-viewport emulation.
- GitHub Actions must run lint + typecheck, unit/component tests, E2E
  tests, and a production build (`next build`) on every PR; all four must
  be green, plus at least one review approval, before merge. PRs open as
  drafts and move to ready only once CI is green and the test plan is
  filled in.

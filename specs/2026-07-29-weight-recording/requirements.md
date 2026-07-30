# Requirements: Phase 3 — Weight Recording

## Goal

Enable the core field workflow — recording feedstock in and processed feedstock out.
(roadmap.md, Phase 3)

## Why this matters

Phase 2 gave the app producer and sequestration site reference lists with nowhere yet to use
them. This is the phase mission.md is really about: the Facility Scale Operator persona
weighing trucks/loads as they arrive and depart, entering data on a phone near the scale, not
at a desk. mission.md's Key Features ("Record incoming feedstock: weight (kg) + feedstock
producer," "Record outgoing processed feedstock: weight (kg) + sequestration site") and its
central differentiator ("One system for both legs of the movement... enabling mass-balance
and yield reporting") are both delivered in this phase.

## Scope

### In scope

All four Phase 3 checklist items from roadmap.md:

1. Record incoming feedstock: weight (kg) + producer selected from dropdown
2. Record outgoing processed feedstock: weight (kg) + sequestration site selected from
   dropdown
3. Transaction history view (raw list of recorded entries)
4. Mobile-optimized entry forms (fast, low-friction, usable in the field)

### Out of scope (deferred)

- **The full mobile UX polish pass** — roadmap.md's Phase 4 owns "Mobile UX pass on entry
  forms and navigation (field-usability focus)" as its own item. This phase's "mobile-optimized
  entry forms" means the entry forms are usable and fast on a phone from day one (large touch
  targets, minimal required fields, numeric keyboard for weight, dropdown instead of free text)
  — not the deeper iteration/refinement pass Phase 4 is explicitly scoped to do afterward.
- **Form validation and error-handling depth** — roadmap.md's Phase 4 explicitly owns
  "Validation and error handling for entry forms." This phase implements baseline validation
  only (weight required and numeric, producer/site required) needed for the form to function
  correctly, not a comprehensive error-handling pass.
- **Role-based access enforcement** on who can record transactions — roadmap.md's Phase 4 owns
  "Role-based access checks across producer/site creation vs. entry," consistent with how
  Phase 1 and Phase 2's requirements.md already deferred the same thing. Any signed-in user can
  record a transaction in this phase.
- **Formal real-device QA pass across all core flows** — roadmap.md's Phase 4 explicitly owns
  "Basic QA pass across core flows on real mobile devices." This phase includes only a
  lightweight, scoped real-device spot-check of entry speed (per this spec's validation
  answer), not the comprehensive multi-flow QA pass Phase 4 is responsible for.
- **Editing or deleting recorded transactions** — roadmap.md's Phase 3 checklist lists only
  recording and a history view; edit/delete aren't mentioned and would work against the
  auditability tech-stack.md calls out as the reason for per-user Clerk accounts.
- **Reporting/analytics views** (totals in/out, trends, mass-balance/yield reporting) —
  roadmap.md lists this explicitly under "Later (Not Yet Scheduled)," not Phase 3. The
  transaction history view here is a raw list, not an aggregated report.

## Key decisions

### Data model: single `transactions` table, not two direction-specific tables

Both incoming and outgoing movements are recorded in one Neon `transactions` table: `id`,
`direction` (`in` | `out`), `weight_kg`, `producer_id` (nullable FK to `producers`, set only
when `direction = 'in'`), `site_id` (nullable FK to `sequestration_sites`, set only when
`direction = 'out'`), `recorded_by` (Clerk user id, for auditability), `created_at`.

**Rationale:**
- mission.md's central differentiator is "One system for both legs of the movement...
  enabling mass-balance and yield reporting that separate/ad hoc logs can't easily support."
  A single table with a `direction` column is what makes a later mass-balance report (Later /
  Not Yet Scheduled) a straightforward query instead of a UNION across two tables — the
  rejected two-table alternative (mirroring Phase 2's producers/sequestration_sites symmetry)
  optimizes for entry-time symmetry at the cost of the reporting use case mission.md actually
  calls out as the reason to unify.
- `recorded_by` directly serves tech-stack.md's rationale for choosing Clerk with per-user
  accounts: "auditability of who recorded each transaction."
- This phase's history view (in scope) is a raw list ordered by `created_at`, which a single
  table with a `direction` column serves directly; splitting into two tables would require
  merging two result sets for that same list.

### Mobile-optimized entry forms: baseline field-usability now, deeper polish in Phase 4

Entry forms use large touch targets, a numeric input for weight (mobile numeric keyboard),
and dropdown-only producer/site selection (no free text) from day one — but iteration on the
UX beyond that baseline is explicitly Phase 4's job.

**Rationale:**
- roadmap.md draws this exact line: Phase 3's checklist item is "Mobile-optimized entry forms
  (fast, low-friction, usable in the field)," while Phase 4's is "Mobile UX pass on entry
  forms and navigation (field-usability focus)" — two distinct items, meaning Phase 3 ships a
  working fast/low-friction form and Phase 4 refines it further, rather than Phase 3 needing
  to reach some final polished state.
- Matches the precedent already set across Phase 1 and Phase 2's requirements.md of taking
  roadmap.md's phase boundaries as intentional rather than re-litigating them here.

## Context from mission.md

- Primary persona (Facility Scale Operator): "Fast, low-friction entry of a weight and a
  producer/site selection per transaction; a UI usable one-handed or in a hurry" — this is
  the phase that delivers exactly that need, not a supporting phase.
- Differentiator: "Mobile-first structured entry, from day one... dropdown-driven
  producer/site selection instead of the paper or spreadsheet tracking that would otherwise
  fill the gap" — directly maps to this phase's dropdown-based entry requirement (no free-text
  producer/site entry).
- Differentiator: "Built for future automation... intended to integrate with an IoT framework
  (e.g. Viam) to capture weights automatically — designed so manual entry can be phased out
  without a rebuild." The `transactions` table's shape (weight_kg + direction + linked
  entity, independent of *how* the weight was captured) is what keeps a future automated
  weight-capture integration from requiring a schema rebuild.

## Constraints from tech-stack.md

- Neon Postgres is the fixed store for "producers, sequestration sites, and weight
  transactions" — not a decision to re-litigate here. This phase adds the `transactions`
  table alongside Phase 2's `producers`/`sequestration_sites` tables.
- Next.js (React, TypeScript) App Router, using Phase 1's `Shell` component/`(app)` route
  group as the layout these new pages live inside, and Phase 2's producer/site data-access
  modules and dropdown-sourcing pattern for the entry forms' producer/site selectors.
- Vitest + React Testing Library for unit/component tests; Playwright E2E for any
  user-facing page, per tech-stack.md's Testing & CI/CD Practices.
- GitHub Actions must run lint + typecheck, unit/component tests, E2E tests, a production
  build, and commit-message lint on every PR; all five green plus at least one review
  approval before merge. This tooling is already stood up (Phase 1) and unchanged here.
- Commit messages follow Conventional Commits, enforced locally (Husky) and in CI — already
  active from Phase 1's Group 6 onward.

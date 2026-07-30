# Plan: Phase 3 — Weight Recording

Task groups are sequenced data layer → transaction history view → incoming entry → outgoing
entry. The history view is built right after the data layer (ahead of either entry form) so
Groups 3 and 4's E2E tests have a real page to confirm a submitted entry actually landed,
mirroring how Phase 1 sequenced tooling before the work that depends on it.

## 1. Data model & transactions data-access module

**Status:** Not started

- Add a Neon migration creating a `transactions` table: `id`, `direction` (`'in' | 'out'`),
  `weight_kg`, `producer_id` (nullable FK to `producers`, set only when `direction = 'in'`),
  `site_id` (nullable FK to `sequestration_sites`, set only when `direction = 'out'`),
  `recorded_by` (Clerk user id), `created_at` — per requirements.md's single-table decision.
- Add a data-access module (e.g. `src/lib/transactions.ts`) exposing `create({ direction,
  weightKg, producerId, siteId, recordedBy })` and `list()` (ordered by `created_at` desc),
  built on the existing `src/lib/db.ts` connection module.

**Test task:** Vitest unit tests for the data-access module (mocking the `pg` driver):
`create` inserts an `'in'` row with `producer_id` set and `site_id` null, and an `'out'` row
with `site_id` set and `producer_id` null; `list` returns all rows ordered by `created_at`
descending.

## 2. Transaction history view

**Status:** Not started

- List view page (e.g. `/transactions`) inside the `(app)` route group, rendering all
  transactions via Group 1's `list()`: direction, weight (kg), the linked producer name (for
  `'in'` rows) or site name (for `'out'` rows) resolved via Phase 2's `producers`/
  `sequestrationSites` data-access modules, and a formatted timestamp.
- Add a nav link to the transaction history from Phase 1's `Shell` component.

**Test tasks:**
- Vitest/RTL component test for the history view: renders one row per transaction with the
  correct direction/weight/producer-or-site-name for both `'in'` and `'out'` rows given a
  list of transactions, and an empty state when given none.
- Playwright E2E test covering the primary flow: sign in, seed one `'in'` and one `'out'`
  transaction directly via Group 1's data-access module, navigate to the transaction history
  page, and confirm both rows render with the correct direction, weight, and linked
  producer/site name.

## 3. Record incoming feedstock entry

**Status:** Not started

- Dedicated entry page (e.g. `/transactions/new/in`) inside the `(app)` route group: a
  mobile-optimized form with a numeric weight (kg) input (numeric keyboard on mobile, large
  touch target) and a producer dropdown sourced from Phase 2's `producers` `list()` — no
  free-text producer entry. On submit, calls Group 1's `create()` with `direction: 'in'`,
  then redirects to the transaction history view (Group 2).
- Baseline validation only (per requirements.md's scope boundary with Phase 4): weight is
  required and numeric, producer is required; reject submission otherwise.
- Add a nav link to the incoming-entry page from Phase 1's `Shell` component.

**Test tasks:**
- Vitest/RTL component test for the form: renders the producer dropdown populated from a
  given producer list, and rejects submission when weight is empty/non-numeric or no
  producer is selected.
- Playwright E2E test covering the primary flow: sign in, navigate to the incoming-entry
  page, select a producer, enter a weight, submit, and confirm the new entry appears on the
  transaction history view (Group 2) with the correct direction/weight/producer.

## 4. Record outgoing processed feedstock entry

**Status:** Not started

- Dedicated entry page (e.g. `/transactions/new/out`) inside the `(app)` route group,
  mirroring Group 3's incoming form but with a sequestration site dropdown (sourced from
  Phase 2's `sequestrationSites` `list()`) in place of the producer dropdown, and
  `direction: 'out'` on submit.
- Same baseline validation as Group 3 (weight required/numeric, site required).
- Add a nav link to the outgoing-entry page from Phase 1's `Shell` component, alongside the
  incoming-entry link added in Group 3.

**Test tasks:**
- Vitest/RTL component test for the form: renders the site dropdown populated from a given
  site list, and rejects submission when weight is empty/non-numeric or no site is selected.
- Playwright E2E test covering the primary flow: sign in, navigate to the outgoing-entry
  page, select a site, enter a weight, submit, and confirm the new entry appears on the
  transaction history view (Group 2) with the correct direction/weight/site.

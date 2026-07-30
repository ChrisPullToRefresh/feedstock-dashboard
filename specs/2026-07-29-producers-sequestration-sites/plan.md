# Plan: Phase 2 — Producers & Sequestration Sites

Task groups are sequenced data layer → producer UI → sequestration site UI, since both
entities share the same shape and the data-access layer needs to exist before either UI can
be built against it.

## 1. Data models for producers & sequestration sites

**Status:** Complete

- Add a Neon migration creating `producers` (`id`, `name`, `created_at`) and
  `sequestration_sites` (`id`, `name`, `created_at`) tables, per requirements.md's minimal
  data-model decision.
- Add a data-access module (e.g. `src/lib/producers.ts`, `src/lib/sequestrationSites.ts`)
  exposing `list()` and `create(name)` for each entity, built on the existing `src/lib/db.ts`
  connection module from Phase 1.

**Test task:** Vitest unit tests for both data-access modules (mocking the `pg` driver),
confirming `create` inserts and returns the new row and `list` returns all rows, for both
producers and sequestration sites.

## 2. Feedstock producer management UI

**Status:** Complete

- Dedicated creation page (e.g. `/producers/new`) inside Phase 1's `(app)` route group: a
  form with a `name` field that calls the Group 1 data-access module to insert a producer,
  then redirects to the list view.
- List view page (e.g. `/producers`) rendering all existing producers via Group 1's `list()`.
- Add a nav link to the producer list from Phase 1's `Shell` component.

**Test tasks:**
- Vitest/RTL component test for the creation form: renders the `name` field, and rejects
  submission with an empty name (client-side validation).
- Vitest/RTL component test for the list view: renders a row per producer given a list of
  producers, and an empty state when given none.
- Playwright E2E test covering the primary flow: sign in, navigate to the producer creation
  page, submit a new producer, and confirm it appears on the producer list view.

## 3. Sequestration site management UI

**Status:** Not started

- Dedicated creation page (e.g. `/sites/new`) inside the `(app)` route group, mirroring
  Group 2's producer creation page but backed by the sequestration site data-access module.
- List view page (e.g. `/sites`) rendering all existing sequestration sites, mirroring
  Group 2's producer list view.
- Add a nav link to the site list from Phase 1's `Shell` component, alongside the producer
  link added in Group 2.

**Test tasks:**
- Vitest/RTL component test for the creation form: renders the `name` field, and rejects
  submission with an empty name.
- Vitest/RTL component test for the list view: renders a row per site given a list of sites,
  and an empty state when given none.
- Playwright E2E test covering the primary flow: sign in, navigate to the sequestration site
  creation page, submit a new site, and confirm it appears on the site list view.

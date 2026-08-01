# Roadmap

## Phase 1: Foundation & Auth

**Goal:** Stand up the app skeleton with authenticated access, ready for
facility data to be entered.

- [x] Next.js project scaffolded, deployed to Vercel
- [x] Neon Postgres database provisioned and connected
- [x] Clerk auth integrated with roles (e.g. scale operator vs. admin); no
      public self-serve sign-up — admin-issued invitations only
- [x] Base mobile-friendly layout/navigation shell
- [x] Vitest + React Testing Library configured for unit/component tests
- [x] Playwright configured for E2E tests
- [x] GitHub Actions CI pipeline (lint + typecheck, unit tests, E2E tests,
      production build) required on every PR
- [x] Commit-message linting (Conventional Commits via commitlint) enforced
      both locally (Husky `commit-msg` hook) and in CI

**Success criteria:** A logged-in user can reach an empty authenticated
shell of the app on both mobile and desktop, and a PR against `main` runs
the full CI pipeline (lint, typecheck, unit tests, E2E tests, build,
commit-message lint) automatically and must pass before merge.

## Phase 2: Producers & Sequestration Sites

**Goal:** Support managing the two reference lists that weight entries
depend on.

- [x] Data model for feedstock producers
- [x] Data model for sequestration sites
- [x] Dedicated page to create a new feedstock producer
- [x] Dedicated page to create a new sequestration site
- [x] List views for existing producers and sites

**Success criteria:** An admin can create and view feedstock producers and
sequestration sites, which then populate dropdown lists.

## Phase 3: Weight Recording

**Goal:** Enable the core field workflow — recording feedstock in and
processed feedstock out.

- [x] Record incoming feedstock: weight (kg) + producer selected from dropdown
- [x] Record outgoing processed feedstock: weight (kg) + sequestration site
      selected from dropdown
- [x] Transaction history view (raw list of recorded entries)
- [x] Mobile-optimized entry forms (fast, low-friction, usable in the field)

**Success criteria:** A scale operator can record an incoming or outgoing
weight transaction end-to-end from a mobile device in under a few taps.

## Phase 4: Mobile Polish & Version 1.0

**Goal:** Harden the mobile field experience and ship version 1.0.

- [x] Mobile UX pass on entry forms and navigation (field-usability focus)
- [x] Validation and error handling for entry forms
- [x] Role-based access checks across producer/site creation vs. entry
- [x] Basic QA pass across core flows on real mobile devices

**Success criteria:** Facility staff can reliably use the app in the field
for day-to-day intake and outflow recording. This marks version 1.0.

## Phase 5: Terminology & Entity Management (v2.0)

**Goal:** Rename "producers" to "feedstock suppliers" throughout the
product, and let admins maintain the supplier/site lists as they change
over time instead of only creating new entries.

- [ ] Rename "producers" to "feedstock suppliers" across the UI
- [ ] Edit feedstock suppliers and sequestration sites
- [ ] Archive (soft-delete) feedstock suppliers and sequestration sites —
      archived entities are hidden from active entry dropdowns but their
      historical transactions are preserved, not removed

**Success criteria:** An admin can rename, edit, and archive a feedstock
supplier or sequestration site without losing any of its historical
transaction data, and the UI no longer uses the term "producer" anywhere.

## Phase 6: Logging UX Overhaul (v2.0)

**Goal:** Replace the separate incoming/outgoing/history tabs with a single
fast-entry "Logging" view built for high-volume, repeat-supplier field use.

- [ ] Consolidated "Logging" view: dropdown to select incoming/outgoing,
      transaction list below a dividing line, set as the default landing
      page
- [ ] App defaults to the most-recently-used feedstock supplier/site on
      load, so back-to-back entries against the same supplier don't require
      re-selecting it
- [ ] Enlarge the touch target on the existing whole-kg increment control
- [ ] Add a second increment control for 0.1kg precision entry
- [ ] Add timestamp and transaction ID to each recorded transaction

**Success criteria:** A scale operator can log 100+ consecutive
transactions against the same feedstock supplier without leaving the
Logging view or re-selecting the supplier, using either whole-kg or
0.1kg increments.

## Phase 7: Supplier Reporting (v2.0)

**Goal:** Give facility staff at-a-glance totals per feedstock supplier to
support manual end-of-month invoicing.

- [ ] Display 3 metrics per supplier on the Feedstock Suppliers tab: today's
      total, last calendar month's total, and total since the 1st of the
      current month
- [ ] Make the supplier list sortable by any of the 3 metrics, defaulting
      to "total since 1st of month"

**Success criteria:** Facility staff can view and sort feedstock suppliers
by any of the 3 rolling totals, and use those totals to manually assemble
an end-of-month invoice. This marks version 2.0.

## Later (Not Yet Scheduled)

- Desktop-oriented data analysis/reporting views (totals in/out, trends,
  mass-balance/yield reporting)
- IoT integration (e.g. Viam) to capture weights automatically instead of
  manual entry
- Automatically build invoices from IoT load-cell data, complete with
  transaction log reports
- Single-click end-of-month invoice and report generation
- Payment logging to track earnings and collections against invoices
- Supplier/sequestration-site portal logins: a stripped-down, read-only
  view scoped to a single supplier's or site's own transaction history for
  auditing, with no data-entry ability and no visibility into other
  suppliers' or sites' data

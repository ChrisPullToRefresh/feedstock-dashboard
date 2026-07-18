# Roadmap

## Phase 1: Foundation & Auth

**Goal:** Stand up the app skeleton with authenticated access, ready for
facility data to be entered.

- [ ] Next.js project scaffolded, deployed to Vercel
- [ ] Neon Postgres database provisioned and connected
- [ ] Clerk auth integrated with roles (e.g. scale operator vs. admin)
- [ ] Base mobile-friendly layout/navigation shell

**Success criteria:** A logged-in user can reach an empty authenticated
shell of the app on both mobile and desktop.

## Phase 2: Producers & Sequestration Sites

**Goal:** Support managing the two reference lists that weight entries
depend on.

- [ ] Data model for feedstock producers
- [ ] Data model for sequestration sites
- [ ] Dedicated page to create a new feedstock producer
- [ ] Dedicated page to create a new sequestration site
- [ ] List views for existing producers and sites

**Success criteria:** An admin can create and view feedstock producers and
sequestration sites, which then populate dropdown lists.

## Phase 3: Weight Recording

**Goal:** Enable the core field workflow — recording feedstock in and
processed feedstock out.

- [ ] Record incoming feedstock: weight (kg) + producer selected from dropdown
- [ ] Record outgoing processed feedstock: weight (kg) + sequestration site
      selected from dropdown
- [ ] Transaction history view (raw list of recorded entries)
- [ ] Mobile-optimized entry forms (fast, low-friction, usable in the field)

**Success criteria:** A scale operator can record an incoming or outgoing
weight transaction end-to-end from a mobile device in under a few taps.

## Phase 4: Mobile Polish & Version 1.0

**Goal:** Harden the mobile field experience and ship version 1.0.

- [ ] Mobile UX pass on entry forms and navigation (field-usability focus)
- [ ] Validation and error handling for entry forms
- [ ] Role-based access checks across producer/site creation vs. entry
- [ ] Basic QA pass across core flows on real mobile devices

**Success criteria:** Facility staff can reliably use the app in the field
for day-to-day intake and outflow recording. This marks version 1.0.

## Later (Not Yet Scheduled)

- Desktop-oriented data analysis/reporting views (totals in/out, trends,
  mass-balance/yield reporting)
- IoT integration (e.g. Viam) to capture weights automatically instead of
  manual entry

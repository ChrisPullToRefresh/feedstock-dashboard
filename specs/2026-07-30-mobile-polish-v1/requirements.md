# Requirements: Phase 4 — Mobile Polish & Version 1.0

## Goal

Harden the mobile field experience and ship version 1.0. (roadmap.md, Phase 4)

## Why this matters

Phase 3 delivered the core field workflow — a scale operator can record an incoming or
outgoing transaction from a phone. This phase is what roadmap.md calls out as turning that
working baseline into something "facility staff can reliably use in the field for day-to-day
intake and outflow recording" — the roadmap's stated definition of version 1.0. It closes
three gaps every prior phase's requirements.md explicitly deferred to "Phase 4": deeper
mobile UX iteration on entry forms (deferred by Phase 3), validation/error-handling depth
beyond baseline required/numeric checks (deferred by Phase 3), and role-based access
enforcement (deferred by Phase 1 and Phase 2), plus a real-device QA pass across the whole
app that no earlier phase attempted at this breadth.

## Scope

### In scope

All four Phase 4 checklist items from roadmap.md:

1. Mobile UX pass on entry forms and navigation (field-usability focus)
2. Validation and error handling for entry forms
3. Role-based access checks across producer/site creation vs. entry
4. Basic QA pass across core flows on real mobile devices

### In-scope detail per item

- **Mobile UX pass:** Iterates on Phase 3's baseline (`EntryForm.module.css`'s 48px touch
  targets, numeric-keyboard weight input, dropdown-only producer/site selection) and Phase
  1's `Shell` nav, which has grown to five links (Producers, Sequestration sites,
  Transactions, Record incoming, Record outgoing) with no visual grouping or mobile
  collapsing — a plain flex row that will wrap awkwardly on narrow viewports. This pass
  covers: reorganizing `Shell`'s nav for small viewports (e.g. a mobile-appropriate grouping
  or condensed presentation, not a full redesign), and any entry-form field-usability
  refinement the E2E/real-device passes surface as friction (e.g. spacing, label sizing,
  submit-button placement) — refinement of the existing forms, not a new form design.
- **Validation and error handling:** `IncomingEntryForm`/`OutgoingEntryForm` currently
  validate only "weight required and numeric" and "producer/site required," each surfaced as
  a single shared `role="alert"` paragraph that both fields share and that resets only on
  the next submit attempt. This item adds: per-field inline error messages (distinguishing
  which field failed rather than one shared alert), a check that weight is a positive number
  (rejecting zero/negative, which the baseline never checked), and handling for the case
  where the `create()` server action itself throws (e.g. a transient database error) —
  surfacing a submit-failure message instead of leaving the user on a form that silently did
  nothing. `ProducerForm`/`SequestrationSiteForm` (Phase 2) get the same per-field/submit-
  failure treatment for consistency, since they use the identical `useState`/`useTransition`
  pattern.
- **Role-based access checks:** Per this spec's key-decision answer, admins-only gates
  producer/site *creation* (`/producers/new`, `/sites/new`, and their `"use server"` create
  actions); transaction entry (`/transactions/new/in`, `/transactions/new/out`) and the
  transaction history view (`/transactions`) stay open to any authenticated user, matching
  mission.md's framing of the Facility Scale Operator doing day-to-day entry without admin
  privileges. Enforcement reads the `x-user-role` header `src/proxy.ts` has forwarded since
  Phase 1 (currently unused past that point) — a non-admin visiting a creation page is
  redirected away (e.g. to `/producers` or `/sites`) rather than shown the form, and the
  paired server action re-checks role server-side (not just hiding the link), since a client
  relying only on nav-link visibility isn't a real access boundary.
- **Real-device QA pass:** A manual pass, on an actual phone, across every core flow now
  shipped: create a producer, create a sequestration site, record an incoming transaction,
  record an outgoing transaction, view transaction history, and (new) confirm role gating
  behaves correctly for both an admin and a non-admin account. Broader than Phase 3's single
  entry-speed spot check, which covered only the two entry forms.

### Out of scope (deferred)

- **Desktop-oriented data analysis/reporting views** (totals in/out, trends, mass-balance/
  yield reporting) — roadmap.md lists this under "Later (Not Yet Scheduled)," unchanged by
  this phase.
- **IoT integration** (e.g. Viam) to capture weights automatically — also "Later (Not Yet
  Scheduled)" per roadmap.md; this phase does not touch how weight is captured, only how the
  existing manual-entry flow is hardened.
- **New features or entities.** This phase polishes what Phases 1–3 already shipped
  (producers, sites, transactions, entry forms, Shell nav); it does not add new data models,
  pages, or roles beyond the `admin`/`operator` distinction Clerk already has configured
  (Phase 1).
- **Editing Clerk role assignment UI.** Roles remain assigned via `publicMetadata.role` in
  the Clerk dashboard, as Phase 1 set up — this phase reads that role for gating, it doesn't
  build an in-app role-management screen.
- **Changing which fields are captured on entry** (still weight (kg) + producer-or-site) —
  this phase is about validation/error-handling *depth* and UX *polish* on the existing
  fields, not new fields.

## Key decisions

### Role-based access: admins-only for producer/site creation, entry stays open to any signed-in user

Producer and sequestration-site *creation* pages/actions require `role === 'admin'`.
Transaction *entry* (incoming and outgoing) and the transaction *history view* remain open to
any authenticated user, unchanged from Phase 3.

**Rationale:**
- Matches mission.md's persona split directly: the Facility Scale Operator's need is "fast,
  low-friction entry... a UI usable one-handed or in a hurry," with no mention of managing
  producers or sites — that's implicitly admin/back-office work, consistent with
  tech-stack.md's Clerk rationale ("support the future need to manage producer/site creation
  separately from day-to-day entry").
- Every prior phase's requirements.md deferred "role-based access enforcement" as a unit
  without narrowing it further (Phase 1: "Any signed-in user can perform any action";
  Phase 2 and Phase 3 repeat the same deferral) — this is the first phase that has to decide
  the actual boundary, and the natural one is creation-vs-entry, which is also the only
  split `tech-stack.md`'s rationale names explicitly.
- Restricting transaction *history* to admins (the rejected broader option) would work
  against mission.md's implication that an operator needs to see what's already been
  recorded (e.g. to avoid duplicate entries) — it's not called out anywhere as an admin-only
  concern the way producer/site creation is.

### Enforcement point: page-level redirect + server-action re-check, both reading `x-user-role`

Gating happens twice per creation flow: the page component checks the role (from the
`x-user-role` header `proxy.ts` already forwards) and redirects a non-admin away before
rendering the form, and the paired `"use server"` action independently re-checks the same
role before writing to the database.

**Rationale:**
- `src/proxy.ts` (Phase 1) already decodes the Clerk session claim and forwards it as
  `x-user-role` specifically "for future gating (enforcement itself is Phase 4 scope, per
  requirements.md)" — this phase is that future, and the header is the mechanism Phase 1
  built for it rather than a new one.
- A server action is directly callable independent of which page rendered the form it's
  bound to; checking role only in the page component (hiding the form) would leave the
  underlying mutation unprotected. Checking it in both places matches how `src/proxy.ts`
  already treats `auth.protect()` as the non-negotiable boundary and page-level UI as a
  presentation concern layered on top.

### Validation depth: per-field errors, positive-weight check, and submit-failure handling — still no schema library

Validation stays hand-written (matching the `useState`/`useTransition` pattern already used
by all four forms) rather than introducing a validation library (e.g. Zod); the additions are
per-field error state instead of one shared alert, a `weightKg > 0` check, and a caught/
surfaced error path around the `onSubmit` call for server-action failures.

**Rationale:**
- tech-stack.md doesn't name a validation library as part of the stack, and introducing one
  now for four small forms would be a bigger change than this phase's "harden what exists"
  framing calls for — three near-identical forms already share one validation shape
  (`ProducerForm`/`SequestrationSiteForm`/`IncomingEntryForm`/`OutgoingEntryForm`), so
  extending that shape is simpler than replacing it.
- Phase 3's requirements.md explicitly named "baseline validation only... not a comprehensive
  error-handling pass" as deferred to this phase and specifically called out per-field
  distinction and submit-failure handling as the kind of depth still missing — this phase
  implements exactly that gap, not a broader rewrite.

## Context from mission.md

- Primary persona (Facility Scale Operator): "a UI usable one-handed or in a hurry" — the
  mobile UX pass and clearer per-field validation errors both serve this directly, since a
  vague shared error message is exactly what slows down a hurried, one-handed user trying to
  figure out which field is wrong.
- "The processing facility is new — there is no existing paper log or spreadsheet process to
  replace" — this phase's real-device QA pass matters more than it would for an app
  replacing a known-good process, since there's no fallback if the mobile flow breaks in a
  way only a real device surfaces (e.g. numeric-keyboard quirks, touch-target overlap).
- Roadmap.md's Phase 4 success criterion — "Facility staff can reliably use the app in the
  field for day-to-day intake and outflow recording. This marks version 1.0." — is the
  explicit bar this spec's validation.md is built against.

## Constraints from tech-stack.md

- Next.js (React, TypeScript) App Router; role gating uses Next.js `redirect()` from a server
  component reading the `x-user-role` header (already set by `proxy.ts`), consistent with
  how Phase 2/3 pages already read data server-side before rendering.
- Clerk auth with roles in `publicMetadata.role` — this phase is the first to *read* that
  role for enforcement; it doesn't change how roles are assigned.
- Vitest + React Testing Library for unit/component tests; Playwright E2E for any user-facing
  change, per tech-stack.md's Testing & CI/CD Practices — role gating, per-field validation,
  and nav changes are all user-facing and need E2E coverage of both the allowed and denied
  paths where applicable.
- GitHub Actions must run lint + typecheck, unit/component tests, E2E tests, a production
  build, and commit-message lint on every PR; all five green plus at least one review
  approval before merge. Unchanged from Phase 1.
- Commit messages follow Conventional Commits, enforced locally (Husky) and in CI —
  unchanged from Phase 1.

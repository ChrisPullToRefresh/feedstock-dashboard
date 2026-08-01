# Plan: Phase 4 — Mobile Polish & Version 1.0

Task groups are sequenced role-based access (a security boundary, independent of the other
three items) → validation/error-handling depth (correctness on the existing forms) → mobile
UX pass (polish layered on top of the now-hardened forms and nav) → real-device QA (a final
pass across everything the first three groups touched, plus the flows Phases 2–3 already
shipped). Fixing behavior before polishing appearance mirrors how earlier phases sequenced
data layer before UI.

## 1. Role-based access checks for producer/site creation

**Status:** Complete

- Add `src/lib/roles.ts` exporting `getUserRole()`, reading the `x-user-role` header
  `src/proxy.ts` (Phase 1) already forwards via `next/headers()`, returning
  `"admin" | "operator" | undefined`.
- Gate `src/app/(app)/producers/new/page.tsx` and `src/app/(app)/sites/new/page.tsx`: call
  `getUserRole()` and `redirect()` a non-admin to `/producers` / `/sites` respectively before
  rendering the form, per requirements.md's admins-only decision.
- Re-check `getUserRole() === "admin"` inside the `createProducer`/`createSite` `"use server"`
  actions (`src/app/(app)/producers/new/page.tsx`, `src/app/(app)/sites/new/page.tsx`) and
  reject the mutation if not — the server action is independently callable, so page-level
  redirect alone isn't a real boundary, per requirements.md's enforcement-point decision.
- Provision a second Clerk test user with the `operator` role (the existing
  `E2E_CLERK_USER_EMAIL` account's role needs confirming/setting to `admin` for this to work)
  and add `E2E_CLERK_ADMIN_EMAIL` / `E2E_CLERK_OPERATOR_EMAIL` to `.env.local` and to the
  `e2e-tests` job's secrets in `.github/workflows/ci.yml`, alongside the existing
  `E2E_CLERK_USER_EMAIL` pattern.

**Test tasks:**
- Vitest unit test for `getUserRole()`: returns `"admin"`/`"operator"` when the header is
  set, `undefined` when it's missing.
- Playwright E2E test: signed in as the admin test user, `/producers/new` renders and a
  submission succeeds; signed in as the operator test user, `/producers/new` redirects to
  `/producers`. Same coverage for `/sites/new` → `/sites`.

## 2. Validation and error handling for entry forms

**Status:** Complete

- Replace the single shared `role="alert"` paragraph in `ProducerForm`, `SequestrationSiteForm`,
  `IncomingEntryForm`, and `OutgoingEntryForm` with per-field error state, associating each
  error with its input via `aria-describedby` so a screen reader (and a hurried user) can
  tell which field failed.
- Add a `weightKg > 0` check to `IncomingEntryForm`/`OutgoingEntryForm` (baseline validation
  only checked required/numeric, not sign).
- Wrap each form's `onSubmit` call inside `startTransition` in a try/catch; on rejection, set
  a distinct submit-failure message (e.g. "Something went wrong — try again") separate from
  field-level errors, so a failed `create()` server action doesn't leave the user on a form
  that silently did nothing.

**Test tasks:**
- Vitest/RTL component tests (one per form, extending each form's existing test file):
  field-level errors render against the correct field, zero/negative weight is rejected
  (entry forms only), and a rejected `onSubmit` surfaces the submit-failure message.
- Extend the existing Playwright E2E specs (`producers.spec.ts`, `sites.spec.ts`,
  `incoming-entry.spec.ts`, `outgoing-entry.spec.ts`) with an assertion that submitting
  invalid input shows the correct inline field error, rather than adding new spec files —
  this group changes existing forms' primary flow, it doesn't add a new page.

## 3. Mobile UX pass on entry forms and navigation

**Status:** Complete

- Rework `Shell.tsx`/`Shell.module.css`'s nav, which has grown to five links (Producers,
  Sequestration sites, Transactions, Record incoming, Record outgoing) with no grouping —
  a plain flex row that wraps awkwardly at narrow widths. Reorganize into a mobile-appropriate
  presentation (e.g. a togglable menu below a fixed width, or grouped "Manage" vs. "Record"
  sections) without a full visual redesign.
- Apply any entry-form field-usability refinements (spacing, label sizing, submit-button
  placement) that Group 2's expanded validation states or the Group 4 device pass surface as
  friction, on top of Phase 3's existing `EntryForm.module.css` touch-target baseline.

**Test tasks:**
- Vitest/RTL component test for `Shell`'s reworked nav: the new structure (e.g. toggle
  button, grouped links) renders with correct roles/labels and all five destination links
  are still present and correctly `href`-ed.
- Playwright E2E test on the `Mobile Chrome` project: the mobile nav presentation is usable
  — toggle (if added) opens/closes and every nav destination is reachable from it.

## 4. Real-device QA pass across core flows

**Status:** Complete

- Fix a UX gap surfaced by an early pass of this group's manual QA: a non-admin visiting
  `/producers/new` or `/sites/new` gets bounced back to `/producers`/`/sites` with zero
  explanation — indistinguishable from a broken form ("the screen blinks and no form
  appears"). Two changes, without loosening the admins-only gate itself (the
  page-level-redirect-plus-server-action-recheck boundary from Group 1 is unchanged):
  - `producers/page.tsx`/`sites/page.tsx`: only render the "New producer"/"New site" link
    when `getUserRole() === "admin"`, so a non-admin is never offered an action they can't
    complete.
  - `producers/new/page.tsx`/`sites/new/page.tsx`: carry a `?forbidden=1` query param on the
    redirect; the list pages read it (via the `searchParams` prop) and render a visible
    message ("You don't have permission to create producers/sites.") for the case where a
    non-admin still reaches the gate directly (bookmark, typed URL, stale link).
- This group's remaining deliverable is still the real-device verification pass, run after
  the fix above and Groups 1–3 have landed. On an actual phone (not Playwright's emulated
  viewport), execute and confirm: create a producer (admin), create a sequestration site
  (admin), a non-admin sees no creation links and is redirected with a visible message if
  they reach the gate directly, record an incoming transaction, record an outgoing
  transaction, view transaction history, and confirm the reworked mobile nav from Group 3 is
  usable throughout.
- Record the manual-pass outcome directly in this spec's validation.md manual-verification
  checklist (see below) rather than as a separate code change.

**Test task:**
- Extend `e2e/role-gating.spec.ts`: signed in as the operator test account, `/producers` and
  `/sites` render without a "New producer"/"New site" link, and visiting `/producers/new` or
  `/sites/new` directly redirects to the list page with the visible forbidden message.

**Test task:** None — this group's task is itself the manual verification requirement in
validation.md's "Manual verification" section, not a new automated test.

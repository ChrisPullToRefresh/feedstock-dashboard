# Phase 1 — Auth — Requirements

**Phase:** 1 in `specs/roadmap.md`
**Scope of this spec:** all nine of Phase 1's roadmap bullets, shipped as three pull
requests in the order `plan.md` sets out — the two Phase 0 carry-overs, then the commit
convention check, then Clerk. Nothing is deferred to a follow-up spec.
`specs/tech-stack.md` § Branching & pull request workflow allows a phase to take several
pull requests as long as each is a coherent slice of one phase. The carry-overs go first
because `specs/roadmap.md` Phase 1 says both should land before more code is built on
top of them.

## Goal

The app is gated by Clerk and only provisioned staff can reach it.

Two corrections to what Phase 0 shipped ride along, for the reason the roadmap gives:
the accent color and the active navigation cue are both wrong today, and every screen
Phases 3 and 4 add would inherit them.

## Behavior

**Reaching the app signed out.** A visitor who is not signed in is redirected to
`/sign-in`, whatever URL they asked for. The sign-in page renders without the app
shell — no bottom tab bar, no sidebar — because every destination behind it is
protected and offering them to a signed-out visitor is a dead end.

**Signing in.** The visitor signs in with an email and password on a Clerk sign-in
surface styled to this project's theme: Inter, the neutral gray palette, and the emerald
accent, in whichever theme the operating system asks for. On success they land on the
app shell.

**Signing out.** A signed-in user has a visible way to sign out from the app shell, on a
phone and on desktop: a slim header above the page content, with the control
right-aligned. It is the shell's first top chrome — Phase 0 shipped a bottom tab bar and
a sidebar and nothing above the content. See `plan.md` § Decisions for why it goes there
rather than into the tab bar. Signing out returns the user to `/sign-in`.

**Getting an account.** Accounts are created by a script that calls the Clerk Backend
API. There is no self-service sign-up and no invitation email —
`specs/tech-stack.md` § Auth records that Clerk's invitation flow is broken for this
account with a support ticket open. Every authenticated user has the same access;
roles are not modeled in v0.1.

**The accent, corrected.** The single accent becomes the theme-dependent pair
`specs/tech-stack.md` § Application names — `emerald-700` in light with white on it,
`emerald-500` in dark with near-black on it. Phase 0 shipped `emerald-600` throughout,
which measures 3.67:1 on white and fails WCAG AA for text.

**The active tab, legible without color.** The current navigation destination is marked
by something other than hue. Today `text-primary` against `text-muted-foreground`
differs by 1.30:1 in relative luminance — 1.13:1 once the accent becomes `emerald-700` —
and the desktop pill is `#f5f5f5` on `#ffffff` at 1.09:1.

**The title gate.** A pull request whose title does not parse as a Conventional Commit
turns CI red and cannot merge. Correcting the title re-runs the check.

## Acceptance criteria

- [ ] An unauthenticated visitor is redirected to sign in, and a user provisioned via the
      Clerk Backend API can sign in and reach the app shell.
- [ ] A signed-out visitor requesting any route — `/`, `/record`, `/producers`,
      `/sites` — arrives at `/sign-in`, and that page renders without the tab bar or
      sidebar.
- [ ] A signed-in user can sign out from the app shell at a phone width and at a desktop
      width, and lands back at `/sign-in`.
- [ ] `--primary` and `--sidebar-primary` are `emerald-700` in light and `emerald-500` in
      dark, with `--primary-foreground` flipping to match, and both pairs clear 4.5:1.
- [ ] The active navigation destination is distinguishable from the inactive ones with
      color removed.
- [ ] A pull request titled `add auth` turns the commit convention check red and the
      merge button stays disabled; editing the title to `feat(auth): add sign-in` re-runs
      the check green.
- [ ] The commit convention check is listed in `main`'s required status checks alongside
      Lint, Typecheck, and Test.
- [ ] The provisioning script creates a user from the command line against Clerk, and the
      path is documented along with why invitations are not used.
- [ ] Initial staff accounts exist, including one for Arin, and each can sign in.

## Out of scope

- Roles and per-role permissions. `specs/tech-stack.md` § Auth does not model them in
  v0.1 and `specs/roadmap.md` defers them to After v0.1.
- Self-service sign-up, and any external access for feedstock producers or sequestration
  site operators (`specs/mission.md` § Non-goals).
- Clerk's invitation flow, until the open support ticket resolves
  (`specs/tech-stack.md` § Auth).
- Playwright and any end-to-end test — `specs/roadmap.md` places Playwright in Phase 5.
- Neon, Prisma, and any schema — Phase 2. No user record is mirrored into a database in
  this phase; Clerk holds the user list.
- Producer and sequestration site pages — Phase 3. Movement forms and totals — Phase 4.
- Promoting `main` to a production Vercel deployment — Phase 5.

## Constraints inherited from the constitution

- Clerk as the provider, gating the app through its Next.js middleware, with users
  provisioned via the Clerk Backend API rather than invitations
  (`specs/tech-stack.md` § Auth).
- Roles are not modeled; every authenticated user can record movements and manage
  reference data (`specs/tech-stack.md` § Auth).
- shadcn/ui for all components, Tailwind classes and theme tokens only, never a raw CSS
  file (`specs/tech-stack.md` § Application). See `plan.md` § Decisions for the one
  recorded exception this phase takes.
- Emerald is the only accent, as the theme-dependent pair, everything else neutral gray
  (`specs/tech-stack.md` § Application).
- Light and dark follow the operating system through `prefers-color-scheme`; there is no
  toggle and no stored preference, so every color decision has to hold in both palettes
  (`specs/tech-stack.md` § Application).
- Mobile-first. The sign-in surface and the sign-out control are designed for a phone
  first and widened (`specs/tech-stack.md` § Application, `specs/mission.md` §
  Constraints).
- Vitest with React Testing Library, no coverage threshold
  (`specs/tech-stack.md` § Testing).
- Green CI is a hard merge requirement; `main` is branch-protected and takes no direct
  pushes (`specs/tech-stack.md` § CI/CD, § Branching & pull request workflow).
- The Vercel account and the browser-automation Chrome profile are different accounts, so
  preview deployments are verified by hand or via the Vercel CLI, never by browser
  automation (`specs/tech-stack.md` § Hosting & deployment).

## Open questions

- **How this project connects to Clerk.** Left to the session that implements the Clerk
  tasks, on the user's instruction. Clerk separates development and production instances,
  each with its own keys and its own user list, and preview deployments on `*.vercel.app`
  can only use development keys — so staff accounts provisioned against production cannot
  sign in to a preview. `plan.md` § Open questions carries the verified constraints,
  including the one that reaches past this phase: a Clerk production instance requires a
  domain this project has not yet named, which Phase 5's production promotion also
  depends on.

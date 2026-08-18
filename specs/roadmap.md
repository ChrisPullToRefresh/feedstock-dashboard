# Roadmap

All phases below lead to v0.1. Work proceeds in order. Expected total: a few weeks, a
few days per phase.

Branches are named after the phase they belong to — see `specs/tech-stack.md`.

## Phase 0 — Foundation

**Goal:** a deployed, themed, empty Next.js app with CI gating every pull request.

**Done when:** a pull request to `main` runs lint, typecheck, and unit tests in GitHub
Actions, gets a Vercel preview deployment, and cannot merge while red.

- Create the Next.js App Router project with TypeScript in strict mode
- Add Tailwind CSS, initialize shadcn/ui, and configure ESLint and Prettier
- Load Inter via `next/font` and set the shadcn/ui theme to a neutral gray palette with
  `emerald-600` as the single accent
- Build the app shell: mobile-first navigation that widens to a desktop layout
- Configure Vitest with React Testing Library, plus `test`, `lint`, and `typecheck` npm
  scripts
- Add the GitHub Actions workflow running lint, typecheck, and unit tests on every pull
  request
- Enable branch protection on `main`, require passing checks, and auto-delete merged
  branches
- Connect the repository to the company Vercel team and confirm PR preview deployments

## Phase 1 — Auth

**Goal:** the app is gated by Clerk and only provisioned staff can reach it.

**Done when:** an unauthenticated visitor is redirected to sign in, and a user
provisioned via the Clerk Backend API can sign in and reach the app shell.

The first two bullets are Phase 0 carry-overs, not auth work, and are parked here
deliberately: both are corrections to what Phase 0 shipped, and both should land before
more code is built on top of them. The accent replacement is the contrast fix code review
found too late to ship in Phase 0 — see `specs/2026-08-12-foundation/plan.md`
§ Decisions. The pull request title check is the fifth check `specs/tech-stack.md`
§ CI/CD requires and Phase 0's workflow did not install.

- Replace Phase 0's `emerald-600` accent with the theme-dependent pair in
  `specs/tech-stack.md` — `emerald-700` in light, `emerald-500` in dark, with
  `--primary-foreground` flipped to match — across `--primary` and `--sidebar-primary`,
  and re-run the shell's color check at both themes
- Give the active navigation destination a cue that is not color, in the same pull
  request as the accent change above. `text-primary` against `text-muted-foreground`
  differs by 1.30:1 in relative luminance today and by 1.13:1 once the accent becomes
  `emerald-700`, and the desktop pill is `#f5f5f5` on `#ffffff` at 1.09:1 — so nothing
  but hue marks the current tab, which WCAG 2.2 SC 1.4.1 does not allow. A weight change
  on the active link is the smallest fix
- Enforce the Conventional Commits rule in `specs/tech-stack.md` by machine: add a
  GitHub Actions job that checks the pull request title, make it a required check in
  `main`'s branch protection, and confirm a malformed title turns the run red and blocks
  the merge button. The job must re-run when the title is edited, not only on push, or a
  bad title stays green after being fixed
- Install Clerk and wire the Next.js middleware to protect all app routes
- Add sign-in and sign-out UI to the app shell, styled with shadcn/ui
- Configure Clerk environment variables in Vercel and locally
- Write a script that provisions users through the Clerk Backend API
- Provision the initial staff accounts, including one for Arin
- Document the provisioning path

## Phase 2 — Data model

**Goal:** the database exists, with a schema that can hold producers, sequestration
sites, and append-only movements.

**Done when:** migrations run clean against Neon from a fresh database and seed data
loads.

- Provision Neon Postgres through the Vercel Marketplace and confirm connection
  environment variables land in Vercel and locally
- Define the Prisma schema: feedstock producers, sequestration sites, and movements
- Model movements as append-only records with a direction (inbound or outbound), a
  weight in kilograms, a counterparty, and a recorded timestamp
- Generate and check in the initial Prisma migration
- Write a seed script with a realistic set of producers and sequestration sites
- Add the Prisma client singleton for use in server code
- Add unit tests over any weight or total calculation helpers

## Phase 3 — Producers

**Goal:** staff can manage the feedstock producer list that the inbound dropdown reads
from.

**Done when:** a producer can be created, edited, listed, and archived in the deployed app.

- List, create, edit, and archive pages for feedstock producers. Deletion is soft:
  archiving clears `isActive`, which drops the producer from the inbound dropdown while
  its record and its movement history stay intact. Nothing removes a producer row
- Narrow the route matcher in `src/proxy.ts` before the first dynamic route
  exists. It currently skips any path whose last segment contains a dot, so with a
  `/producers/[id]` route in place, `/producers/acme.co` is served to an unauthenticated
  request — measured at 200 with page content, against `/producers/acme` at 307. Clerk's
  documented matcher, which excludes a named extension list rather than any dot, is the
  starting point, and it still skips `/favicon.ico`. It is not sufficient on its own:
  Phase 3 found that without a trailing `$` anchoring the extension to the end of the
  path, `/producers/x.svg/edit` is skipped and served with no session — the same hole in
  a new place. `src/proxy.ts` carries the anchor and `src/proxy.test.ts` pins
  it. Pair it with a test over `config.matcher`, which nothing asserts today
- Form validation with shadcn/ui's Field components. `@shadcn/form` resolves to an empty
  stub under this project's `radix-nova` style, so Field is the form primitive here and
  validation runs against the shared zod schema rather than react-hook-form
- Component tests for the form's validation behavior

## Phase 4 — Sequestration sites

**Goal:** staff can manage the sequestration site list that the outbound dropdown reads
from.

**Done when:** a sequestration site can be created, edited, listed, and archived in the
deployed app.

This phase exists to be small. Phase 3 establishes the pattern; this one follows it, and
anything the two surfaces genuinely share is extracted here rather than duplicated.

- List, create, edit, and archive pages for sequestration sites, reusing the producer
  patterns rather than duplicating them. Deletion is soft here too
- Form validation with shadcn/ui's Field components, following Phase 3 — see its bullet
  for why Field rather than Form
- Component tests for the form's validation behavior

## Phase 5 — Movement entry

**Goal:** operators can record feedstock in and out on a phone.

**Done when:** an inbound movement and an outbound movement recorded on a phone are
stored as append-only records.

- Mobile-first inbound form: weight in kilograms plus a producer selected from a dropdown
- Mobile-first outbound form: weight in kilograms plus a sequestration site from a
  dropdown, sharing structure with the inbound flow where it makes sense
- Validate weights and require a counterparty on both forms
- Write movements as append-only records
- Component tests for both forms' validation and submission

## Phase 6 — Movement list and totals

**Goal:** managers can review every movement with running totals on desktop.

**Done when:** the movements recorded in Phase 5 appear in the desktop movement list and
are reflected in the totals.

- Desktop-oriented movement table, newest first, filterable by direction, producer, and
  sequestration site, and still readable on a phone
- Running totals: inbound and outbound weight overall, and broken down by producer and by
  sequestration site
- Unit tests over the totals calculations

## Phase 7 — End-to-end coverage

**Goal:** v0.1 is fully covered by Playwright, running as a merge gate.

**Done when:** the full Playwright suite passes in GitHub Actions and is a required check
on `main`.

- Install and configure Playwright against an ephemeral or preview database, never
  production
- Cover every page: both movement entry flows, both CRUD surfaces, and their validation
  paths
- Run at least one E2E pass at a mobile viewport
- Add the Playwright job to the GitHub Actions pull request workflow and make it a
  required check

## Phase 8 — Production launch

**Goal:** v0.1 is running in production and demoable to Arin.

**Done when:** the production deployment is live and Arin has been walked through it end
to end.

- Stand up a Clerk production instance, which needs a domain with DNS records we control —
  no domain is named anywhere in this constitution yet, and there is no path to production
  authentication until one is
- Re-provision the staff accounts, including Arin's, against that production instance.
  Phase 1's accounts live in Clerk's development instance, which backs preview deployments
  only; see `specs/2026-08-13-auth/plan.md` § Open questions
- Promote `main` to the production Vercel deployment
- Verify the deployed app manually on a phone and on desktop
- Walk Arin through recording an inbound movement, an outbound movement, reference data
  management, and the movement list with totals

## v0.1 — Definition of done

- [ ] Inbound movements are recorded with a weight in kilograms and a producer selected
      from a dropdown
- [ ] Outbound movements are recorded with a weight in kilograms and a sequestration site
      selected from a dropdown
- [x] Feedstock producers can be created, edited, listed, and archived
- [x] Sequestration sites can be created, edited, listed, and archived
- [ ] The movement list shows every movement, filterable, with running totals by producer
      and by sequestration site
- [ ] Movement entry is usable one-handed on a phone; review is comfortable on desktop
- [x] Clerk gates the app and staff accounts are provisioned via the Backend API
- [x] The Prisma schema and all migrations are checked in and run clean on a fresh
      database
- [ ] Lint, typecheck, Vitest, and the full Playwright suite pass in GitHub Actions and
      are required to merge
- [x] `main` is branch-protected and no commit has landed on it outside a pull request
- [ ] The app is deployed to production on the company Vercel team
- [ ] Arin has been walked through the deployed app end to end

## After v0.1

Deferred, unordered, unlabeled. Nothing here is committed to a version.

- IoT weight capture, so weights are not entered by hand — Viam is the candidate
  framework named in `specs/VISION.md`
- Offline-tolerant data entry with queue and sync
- Multiple facilities
- Charts and trend dashboards beyond the movement list and totals
- CSV export
- External access for feedstock producers and sequestration site operators
- Compliance, MRV, or carbon-credit reporting
- User roles and per-role permissions

## Open questions

None outstanding for the roadmap.

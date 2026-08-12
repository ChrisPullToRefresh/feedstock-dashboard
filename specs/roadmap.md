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
- Document the provisioning path and why invitations are not used

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

## Phase 3 — Reference data

**Goal:** staff can manage the producer and sequestration site lists that the movement
dropdowns read from.

**Done when:** a producer and a sequestration site can each be created, edited, listed,
and deleted in the deployed app.

- List, create, edit, and delete pages for feedstock producers
- List, create, edit, and delete pages for sequestration sites, reusing the producer
  patterns rather than duplicating them
- Form validation with shadcn/ui form components on both surfaces
- Component tests for each form's validation behavior

## Phase 4 — Movements

**Goal:** operators can record feedstock in and out on a phone, and managers can review
every movement with running totals on desktop.

**Done when:** an inbound and an outbound movement recorded on a phone appear in the
desktop movement list and are reflected in the totals.

- Mobile-first inbound form: weight in kilograms plus a producer selected from a dropdown
- Mobile-first outbound form: weight in kilograms plus a sequestration site from a
  dropdown, sharing structure with the inbound flow where it makes sense
- Validate weights and require a counterparty on both forms
- Write movements as append-only records
- Desktop-oriented movement table, newest first, filterable by direction, producer, and
  sequestration site, and still readable on a phone
- Running totals: inbound and outbound weight overall, and broken down by producer and by
  sequestration site
- Component tests for both forms' validation and submission, and unit tests over the
  totals calculations

## Phase 5 — Ship

**Goal:** v0.1 is fully covered by E2E tests, running in production, and demoable to
Arin.

**Done when:** the full Playwright suite passes in CI as a merge gate and the production
deployment is live.

- Install and configure Playwright against an ephemeral or preview database, never
  production
- Cover every page: both movement entry flows, both CRUD surfaces, and their validation
  paths
- Run at least one E2E pass at a mobile viewport
- Add the Playwright job to the GitHub Actions pull request workflow and make it a
  required check
- Promote `main` to the production Vercel deployment
- Verify the deployed app manually on a phone and on desktop
- Walk Arin through recording an inbound movement, an outbound movement, reference data
  management, and the movement list with totals

## v0.1 — Definition of done

- [ ] Inbound movements are recorded with a weight in kilograms and a producer selected
      from a dropdown
- [ ] Outbound movements are recorded with a weight in kilograms and a sequestration site
      selected from a dropdown
- [ ] Feedstock producers have full CRUD pages
- [ ] Sequestration sites have full CRUD pages
- [ ] The movement list shows every movement, filterable, with running totals by producer
      and by sequestration site
- [ ] Movement entry is usable one-handed on a phone; review is comfortable on desktop
- [ ] Clerk gates the app and staff accounts are provisioned via the Backend API
- [ ] The Prisma schema and all migrations are checked in and run clean on a fresh
      database
- [ ] Lint, typecheck, Vitest, and the full Playwright suite pass in GitHub Actions and
      are required to merge
- [ ] `main` is branch-protected and no commit has landed on it outside a pull request
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

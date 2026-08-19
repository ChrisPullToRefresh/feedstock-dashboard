# Roadmap

Phases 0–7 shipped v0.1. Phases 8–15 lead to v0.2, and are planned from Arin's feedback
on v0.1 — `specs/vision0.2/v01feedback.md`. Work proceeds in order. Expected: a few days
per phase.

Phases 0–7 say "producer" throughout. Phase 8 renames it to "feedstock supplier"
everywhere in the app; the shipped phases keep the old word because their branches, spec
folders, and merged pull requests are named after it.

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
- Extract the shared reference detail page before rendering totals into it.
  `/producers/[id]` and `/sites/[id]` are near-identical and differ in five things — the
  query, the archive action, one sentence of description, the edit path, and the confirm
  label. Phase 4 generalized the form, the list, the archive dialog and the toast, and
  stopped one short of this one. This phase gives both pages a counterparty's movements
  and totals, so it extracts them first rather than adding the same block twice
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

## v0.1 — Definition of done

- [x] Inbound movements are recorded with a weight in kilograms and a producer selected
      from a dropdown
- [x] Outbound movements are recorded with a weight in kilograms and a sequestration site
      selected from a dropdown
- [x] Feedstock producers can be created, edited, listed, and archived
- [x] Sequestration sites can be created, edited, listed, and archived
- [x] The movement list shows every movement, filterable, with running totals by producer
      and by sequestration site
- [x] Movement entry is usable one-handed on a phone; review is comfortable on desktop
- [x] Clerk gates the app and staff accounts are provisioned via the Backend API
- [x] The Prisma schema and all migrations are checked in and run clean on a fresh
      database
- [x] Lint, typecheck, Vitest, and the full Playwright suite pass in GitHub Actions and
      are required to merge
- [x] `main` is branch-protected and no commit has landed on it outside a pull request


## Phase 8 — Feedstock supplier rename

**Goal:** the word "producer" is gone from the app, the code, and the database.

**Done when:** every screen, route, model, table, and column reads "feedstock supplier",
and the renamed schema runs clean from a fresh database.

Phases 0–7 above keep the old word. They are the record of what shipped, and their
branches and spec folders are named after it.

- Rename the Prisma model, the `producers` table, and the `producer_id` column in a
  checked-in migration
- Rename the `/producers` routes and every heading, label, and empty state that names
  them
- Rename the components, helpers, and tests carrying the old word
- Update the E2E specs and fixtures to the new vocabulary

## Phase 9 — Archiving takes its movements

**Goal:** archiving a feedstock supplier or sequestration site hides its movements too.

**Done when:** archiving a counterparty removes its movements from the list, from its own
totals, and from the facility totals, and unarchiving brings them all back.

Nothing is deleted. The rows stay exactly where they are and the archive flag is what
every read filters on — see `specs/mission.md` § Constraints.

- Exclude archived counterparties' movements from the movement list queries
- Exclude them from the facility inbound and outbound totals
- Confirm unarchiving restores both, since the rows were never removed
- Unit tests over the archived-counterparty case in the totals

## Phase 10 — The logging view

**Goal:** one Logging view replaces the Movements and Record tabs and is where the app
opens.

**Done when:** the app's landing screen carries the direction picker, the entry form, a
separator, and the reverse-chronological transaction list, and the tab bar shows three
destinations.

- Merge movement entry and the movement list into one route, with an incoming/outgoing
  dropdown selecting what is being recorded
- Separate the entry area from the list with a rule, and put a compact inbound and
  outbound total above it
- Move every filter into a popup that shows when a filter is active
- Retire the per-counterparty breakdown blocks, which Phase 14 replaces with sortable
  per-counterparty metrics
- Reduce the navigation to Logging, feedstock suppliers, and sequestration sites
- Rewrite the E2E specs against the merged view, keeping the mobile viewport pass

## Phase 11 — Faster field entry

**Goal:** recording a movement on a phone takes fewer and larger taps.

**Done when:** a weight can be set without typing, in gloves, and the form opens on the
counterparty that device last recorded against.

- Add −1 kg, −0.1 kg, +0.1 kg, and +1 kg buttons around the weight field, sized for a
  gloved hand per `specs/mission.md` § Constraints
- Keep the number field editable, so a large weight does not have to be tapped up to
- Default the counterparty to the last one recorded on that device, for both directions
- Component tests for the steppers and the remembered default
- Extend the mobile E2E pass to record a movement using the buttons alone

## Phase 12 — Receipt numbers

**Goal:** every movement carries a number a person can read out loud.

**Done when:** each movement shows a short sequential receipt number in the list and on
the confirmation after recording.

- Add a sequential receipt number to the movement schema in a checked-in migration
- Backfill the existing movements
- Show the receipt number in the transaction list and on the entry confirmation
- Unit tests over allocation, including that two movements never share a number

## Phase 13 — Transaction downloads

**Goal:** a single transaction can be downloaded for auditing.

**Done when:** any transaction downloads both as a CSV row and as a printable PDF
receipt, each carrying its receipt number, timestamp, direction, counterparty, and
weight.

- Add the CSV download for one transaction
- Choose the PDF library and record it in `specs/tech-stack.md` § Application
- Add the printable PDF receipt for one transaction
- Put the download control on the transaction in the logging view
- Tests over both formats' contents

## Phase 14 — Counterparty metrics and sorting

**Goal:** each feedstock supplier and sequestration site shows what it moved, and the
lists sort by it.

**Done when:** both lists show today's total, last calendar month's total, and the total
since the first of this month, sorted by the last of those, and the sort can be changed.

- Ask Arin what timezone the facility keeps and record it as the constant every period
  boundary is computed from. "Today" and "since the 1st" are undefined without it, and
  the movement list renders UTC today —
  `specs/2026-08-18-movement-list-and-totals/requirements.md` § Open questions
- Compute the three period totals per counterparty
- Show them beside each row on both the feedstock supplier and sequestration site lists
- Add a sort control over the three metrics, defaulting to the total since the 1st,
  descending
- Keep sorting by name available, so a counterparty with no movement this month is still
  findable
- Unit tests over the period boundaries, including a month boundary and an empty period

## Phase 15 — Production launch

**Goal:** v0.2 is running in production and demoable to Arin.

**Done when:** the production deployment is live and Arin has been walked through it end
to end.

- Stand up a Clerk production instance, which needs a domain with DNS records we control —
  no domain is named anywhere in this constitution yet, and there is no path to production
  authentication until one is
- Re-provision the staff accounts, including Arin's, against that production instance.
  Phase 1's accounts live in Clerk's development instance, which backs preview deployments
  only; see `specs/2026-08-13-auth/plan.md` § Open questions
- Decide how production migrations run, before promoting. `vercel-build` is
  `prisma migrate deploy && next build`, so a production migration runs inside the
  production build today. That was accepted while the app was pre-launch with nothing to
  lose — `specs/2026-08-13-schema-and-migrations/plan.md` § Decisions — and this is the
  phase that was named as where to re-examine it. What changes here is that the database
  starts holding records nobody can re-enter: a migration that half-applies fails the
  build after the fact, and nothing separates changing the schema from shipping the code
- Clear the test data with SQL run directly against the database, before the first real
  movement is recorded. The app has no delete — `specs/mission.md` § Non-goals
- Promote `main` to the production Vercel deployment
- Verify the deployed app manually on a phone and on desktop
- Walk Arin through recording an inbound movement, an outbound movement, reference data
  management, and the logging view

## v0.2 — Definition of done

- [ ] Nothing in the app, the code, or the database says "producer"
- [ ] Archiving a counterparty hides its movements from the list and from every total,
      and unarchiving restores them
- [ ] The app opens on the logging view: direction picker, entry form, separator,
      reverse-chronological transactions
- [ ] Every filter lives in a popup, and the list defaults to reverse chronological
- [ ] A weight can be set in gloves with the ±1 kg and ±0.1 kg buttons, and the
      counterparty defaults to the last one recorded on that device
- [ ] Every movement shows a readable receipt number and downloads as CSV and as a PDF
      receipt
- [ ] Both counterparty lists show today, last calendar month, and since-the-1st totals,
      sortable, defaulting to since the 1st
- [ ] The facility timezone is recorded and every period boundary is computed from it
- [ ] Lint, typecheck, Vitest, and the full Playwright suite pass in GitHub Actions and
      are required to merge
- [ ] The app is live in production and Arin has been walked through it

## After v0.2

Deferred, unordered, unlabeled. Nothing here is committed to a version. The last six come
from Arin's feedback in `specs/vision0.2/v01feedback.md`: "we'll address the future
concepts after that".

- IoT weight capture, so weights are not entered by hand — "let's evolve this to take the
  load cell data from our IoT device", and Viam is the candidate framework named in
  `specs/vision0.1/VISION.md`. This is also what settles the movement timestamp:
  `recordedAt` is entry time rather than scale time only because a person is typing after
  the fact, and a machine reading the scale records both at once
- Automatic invoice generation — "automatically build an invoice complete with transaction
  log reports". v0.2 makes the manual version possible: Phase 14's monthly totals are what
  an invoice is read from, and Phase 13's downloads are the transaction log
- Audit photos on every logged weight — "add audit photos to every logged weight"
- A single-click end-of-month process — "this will allow for a single-click end-of-month
  process"
- Payment logging, to track earnings and collections — "enable payment logging so we can
  track earnings and collections"
- External access for feedstock suppliers and sequestration site operators — "add logins
  so suppliers and sequestration sites can access this portal and see their own totals and
  balances due", seeing only their own transaction history, with no ability to log data
- A screen for archived feedstock suppliers and sequestration sites. The only route back
  to an archived row is typing its name into the create form and taking the restore offer,
  so a row nobody can name exactly cannot be reached. Phase 9 makes this sharper: an
  archived counterparty's movements leave every view with it, and unarchiving is the only
  way back
- Bulk CSV export across transactions. Phase 13 ships the single-transaction download only
- Offline-tolerant data entry with queue and sync
- Multiple facilities
- Charts and trend dashboards beyond the logging view and the counterparty metrics
- Compliance, MRV, or carbon-credit reporting
- User roles and per-role permissions

## Open questions

None outstanding for the roadmap.

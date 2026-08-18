# Phase 4 — Sequestration sites — Plan

Tasks run in order. Every feature task ships with its paired test task in the same
pull request.

The extraction comes first, tasks 1 to 6: the shared components are built by generalizing
the producer ones and proven against producers before a single site screen exists. That
order keeps the refactor separable from the new surface, so a failure in tasks 7 onward
cannot be confused with a regression in Phase 3's shipped work.

| #  | Feature task | Paired test task |
|----|--------------|------------------|
| 1  | `src/lib/reference-data.ts` exporting the one name schema — required, trimmed, 1–100 characters — with `src/lib/producers.ts` deleted and its importers pointed here. Nothing server-only, because both client forms import it | Vitest: empty, whitespace-only and 101-character names are rejected; a 100-character name is accepted; a padded name parses to its trimmed value. `src/lib/producers.test.ts` moves to `src/lib/reference-data.test.ts` |
| 2  | `src/components/reference-form.tsx` — Phase 3's producer form generalized, taking the singular label, the submit label and the restore copy as props, still built on shadcn/ui's Field | React Testing Library, every assertion run at both entities: an empty name is refused, a whitespace-only name is refused, a 101-character name is refused, a valid name submits, a refusal leaves the typed text on screen, and a reported collision renders the restore offer rather than a bare error |
| 3  | `src/components/reference-list.tsx` — the list and its header generalized, taking the plural label, the list and create paths, and the empty-state icon and copy | React Testing Library at both entities: rows render in name order, an archived row is absent, the stacked rows and the table show the same names, and an empty list renders the explanation and the create link |
| 4  | `src/components/archive-dialog.tsx` — the confirmation generalized, naming the row and saying which dropdown it leaves | React Testing Library at both entities: the title names the row, confirming invokes the bound action, dismissing does not |
| 5  | `src/components/reference-toast.tsx` — the toast generalized, taking the list path it clears its parameters back to | React Testing Library at both entities: each event renders its message, an unknown `?toast=` value renders nothing — the `Object.hasOwn` guard Phase 3 added — and the parameters are cleared to that entity's own list path |
| 6  | `/producers`, `/producers/new`, `/producers/[id]` and `/producers/[id]/edit` rendering the shared components, with no producer-specific component file left in `src/components/` | The existing `src/app/(app)/producers/routes.test.tsx` and `src/app/(app)/producers/list-page.test.tsx` pass against the refactor with their assertions unchanged, plus `validation.md` § Manual steps 13–16, the producers regression pass |
| 7  | A case-insensitive unique index on `sequestration_sites.name`, hand-written as `CREATE UNIQUE INDEX … ON sequestration_sites (lower(name))` in a checked-in migration | Vitest: `src/test/prisma-migration.test.ts` extended to read the checked-in SQL and assert both `lower(name)` indexes — producers' and sites' — are still present |
| 8  | `src/lib/site-queries.ts` query helpers — list active sites by name, find one by id, find one by case-insensitive name through `lower(name)` rather than Prisma's `mode: "insensitive"` | Manual: `validation.md` § Manual steps 1–10 exercise every helper through the app. No database test harness exists before `specs/roadmap.md` Phase 7 |
| 9  | Server Actions in `src/app/(app)/sites/actions.ts` to create, rename, archive and restore a site, each re-validating with the task 1 schema and each redirecting to `/sites` carrying the toast event | Manual: `validation.md` § Manual steps 2–9, plus the rejection paths in steps 3 and 10 |
| 10 | `/sites` list — active sites only, ordered by name, replacing the `PlaceholderPage` that stands there today | Vitest asserting `src/app/(app)/sites/page.tsx` no longer renders `PlaceholderPage`, and the existing shell test still passes for `/` and `/record`, which keep theirs |
| 11 | `/sites/new` and `/sites/[id]/edit`, both rendering the task 2 form | React Testing Library: the create route renders an empty field, the edit route renders the site's current name |
| 12 | `/sites/[id]` detail page showing the site with Edit and Archive controls | React Testing Library: the page renders the site's name and both controls |
| 13 | The restore path — creating a site whose name matches an archived one offers to restore it instead of failing | Task 2's collision assertion at the site entity, plus `validation.md` § Manual step 9 end to end |

## Decisions

Every entry below answers a question put to the user in the session that wrote this spec.

**The four reference-data components are generalized, and producers is refactored onto
them.**

The form, the list, the archive dialog and the toast become entity-neutral components
taking labels, routes, icon and copy as props. `src/components/producer-*.tsx` are renamed
into them and `/producers` renders the shared versions. This is what `specs/roadmap.md`
Phase 4 asks for in as many words: "anything the two surfaces genuinely share is extracted
here rather than duplicated."

Extracting only the dialog and the toast — the two that are near-identical already — was
rejected: it would leave two forms and two list layouts to keep in step from Phase 5
onward, which is most of the duplication the bullet is aimed at. Copying the producer
components as `site-*.tsx` files was rejected outright as the thing the bullet forbids.

The cost accepted, and it is this phase's sharpest trade: the implementation pull request
touches shipped Phase 3 code. Producers' behavior has to be proven unchanged, which is why
tasks 2 to 5 run every assertion at both entities and why `validation.md` carries a
producers regression pass.

**The name schema is shared; the queries and the Server Actions are mirrored, not
generalized.**

One module, `src/lib/reference-data.ts`, holds the name rules both entities validate
against. Below that, `src/lib/site-queries.ts` and `src/app/(app)/sites/actions.ts` are
their own files, written to the same shape as the producer ones.

A generic factory taking the Prisma delegate, the route and the labels was offered and
declined. Prisma's delegates are separate types, so the factory would need generics
threaded through the collision check, the restore branch and the unique-violation handler —
the exact code that decides what gets written to the database, made harder to read to save
duplication in code that is already short.

The cost accepted: the two action modules read very similarly, and a fix to one has to be
remembered in the other. The shared schema is what stops the part that would actually
diverge — the name rules — from drifting.

**Sequestration site names are unique regardless of case, enforced by an expression
index.**

A migration adds `CREATE UNIQUE INDEX … ON sequestration_sites (lower(name))`, mirroring
what `specs/2026-08-14-producers/plan.md` § Decisions did for producers and for the same
reason: `specs/roadmap.md` Phase 6 groups totals by sequestration site and Phase 5 puts
sites in a dropdown, so `Cascade Basin` and `cascade basin` as two rows would split the
numbers. It also makes the restore-on-collision path below reliable, which it is not if the
lookup and the constraint disagree about case.

Leaving the column case-sensitive was offered and declined. Parking it as an open question
was offered and declined — Phase 6 is the phase that would feel it, and by then the rows
exist.

The column keeps its own case-sensitive unique index as well, exactly as producers did: it
is redundant while this one exists, but the seed's upsert-on-name resolves against it.

The cost accepted is the one Phase 3 already accepted and answered: the index is invisible
to `prisma/schema.prisma`. Task 2 of Phase 3 established that `prisma migrate diff` reports
no drift in either direction, so no routine command drops it, and the guard test extended
in task 7 covers the remaining case — someone recreating the migration history from the
schema.

**A sequestration site has a detail page, mirroring producers.**

`/sites/[id]` shows the site with Edit and Archive on it, and the list links through. One
interaction model across both reference surfaces, and `specs/roadmap.md` Phase 6 gets
somewhere to hang a site's movements and totals.

Archiving from the edit page instead, with no detail route, was offered and declined:
producers and sites would then archive from different places, which is the divergence this
phase exists to prevent. Removing the detail page from both entities — answering Phase 3's
open question by deletion — was offered and declined as reversing a shipped decision.

The cost accepted: a second screen displaying a single field, and Phase 3's open question
about whether the detail page earns its place now applies to two surfaces.
`requirements.md` § Open questions carries that.

**A name that collides with an archived site offers to restore it.**

Mirrors producers. With no screen listing archived sites, refusing the name leaves the user
in a dead end — told a name is taken, shown a list that does not contain it, given nothing
to act on. It also falls out of the shared form almost for free, since task 2 generalizes
the branch that renders the offer.

Refusing the name while naming the archived site was offered and declined for the
dead-end reason. No archived-name detection at all — letting the database unique violation
surface as a generic "already taken" — was offered and declined: the message would not
explain why the name is refused, and the archived site would be unreachable permanently.

The cost accepted is Phase 3's: restoring is reachable only by typing a name you cannot
see.

**A sequestration site name is required, trimmed, and 1–100 characters — the same schema
producers use.**

One module, one set of rules, both entities. Trimming happens before validation and before
storage, so `" Cascade Basin "` and `"Cascade Basin"` cannot become two rows that look
identical on screen. The 100-character bound keeps the list and Phase 5's dropdown readable
on a phone, which is as true of sites as of producers.

Separate bounds per entity were offered and declined: there would be two numbers to
justify, and the dropdown-readability argument applies equally to both. A site-specific
schema module was offered and declined as the drift the one-schema decision exists to
prevent.

**The shared files are flat, with entity-neutral names.**

`src/components/reference-form.tsx`, `reference-list.tsx`, `archive-dialog.tsx`,
`reference-toast.tsx`, and `src/lib/reference-data.ts`. Phase 3's `producer-*.tsx` files are
renamed into these, so the git history records the move rather than a delete and an add.
Consistent with the flat layout `specs/2026-08-14-producers/plan.md` § Decisions kept when
it declined a `src/features/producers/` folder.

A `src/components/reference-data/` folder was offered and declined as a second organising
principle. Keeping the `producer-*` filenames and importing them from the sites routes was
offered and declined: `src/app/(app)/sites/` importing `producer-form.tsx` is a name that
lies, and every later reader has to learn that it does.

**The route stays `/sites`; the words on the screen say "sequestration site".**

The nav destination and the `/sites` path shipped in Phase 0 and do not move. Page
headings, the empty state, the archive dialog and the toasts use the full term
`specs/mission.md` and `specs/roadmap.md` use.

"Sites" everywhere was offered and declined as diverging from the constitution's language.
"Sequestration sites" everywhere, including a `/sequestration-sites` route and a renamed nav
label, was offered and declined: it is a long label in a mobile tab bar and it changes a
shipped Phase 0 route.

The cost accepted: two names for one thing, mitigated by the nav label reading as the
abbreviation of the heading directly below it.

**The shared components take individual props, not a per-entity config object.**

Each screen passes what it needs — the list path, the singular and plural labels, the
submit label, the icon, the empty-state copy. TypeScript catches a missing one, and the
words stay next to the screen they appear on.

A `PRODUCERS` / `SEQUESTRATION_SITES` config constant in `src/lib/reference-data.ts`,
passed whole, was offered and declined, as was a half-measure carrying only labels and
routes. Both put an indirection between a screen and the words on it, and the config grows
whenever one entity needs something the other does not.

The cost accepted: the same handful of props is repeated across four routes per entity, and
Phase 5's dropdowns will have to name the routes themselves rather than importing them.

**Both reference lists render per request, never prerendered.**

Decided during implementation, after `/code-review` found it. `/sites` and `/producers`
are Server Components awaiting a database query with no dynamic API, so Next prerendered
them: `next build` ran the query and baked the rows it found into `sites.html`. Both pages
now carry `export const dynamic = "force-dynamic"`.

Only the Server Actions call `revalidatePath`, so a write that does not go through one is
never reflected — and `vercel-build` is `prisma migrate deploy && next build` while
seeding is a separate `npm run seed`. On a freshly seeded database the build would
prerender the empty state, and the list would keep offering "Add the first sequestration
site" while the create form refused every seeded name as already taken. That is
`validation.md` § Manual step 1 failing on a correctly-built deployment. It also made the
build itself depend on the database being reachable.

`specs/tech-stack.md` pins no rendering strategy. These lists are small and read by
authenticated staff only, so a query per request is the right trade.

Producers shipped static in Phase 3 and is corrected in the same commit. Leaving the two
reference surfaces rendering differently is the divergence this phase exists to remove.
The cost accepted: a Phase 3 defect is fixed under Phase 4's number, outside what this
plan's task table asked for.

The rule binds forward. Phases 5 and 6 add pages that read the database, and the same
prerendering applies to them unless they say otherwise.

**Phase 3's component tests move with the components and run at both entities.**

`producer-form.test.tsx`, `producer-list.test.tsx`, `archive-producer-dialog.test.tsx` and
`producer-toast.test.tsx` follow their components' renames, and each assertion is
parameterized over producers and sequestration sites. This is the guard on the refactor:
one suite proves both surfaces.

Keeping them running against producers only was offered and declined — nothing automated
would then prove the site labels, routes and copy are wired correctly. Rewriting them fresh
against the generalized API was offered and declined, because Phase 3's specific regression
cases are easy to lose in a rewrite: the React 19 form-reset behavior that `submitted`
exists to defeat, and the `Object.hasOwn` guard in the toast.

The cost accepted: the test files grow, and a behavior genuinely specific to one entity has
no obvious place to live in them.

## Open questions

- **Whether archived rows ever need a screen.** Carried in `requirements.md`
  § Open questions, and now for both entities rather than one.
- **Whether the detail page earns its place before Phase 6.** Carried in `requirements.md`
  § Open questions. Phase 3 parked it; this phase doubles the cost of getting it wrong.

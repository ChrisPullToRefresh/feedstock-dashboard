# Phase 3 — Producers — Requirements

**Phase:** 3 in `specs/roadmap.md`
**Scope of this spec:** all four of Phase 3's roadmap bullets. Nothing is deferred to a
later spec.

## Goal

Staff can manage the feedstock producer list that Phase 5's inbound dropdown reads from:
create a producer, edit its name, see the list, and archive one that is no longer used.

This is the first phase to put a form and a database write in front of a person. The
patterns it settles — Server Actions, a schema shared by client and server, a
confirmation before archiving — are what Phase 4 follows for sequestration sites and
Phase 5 follows for movement entry.

## Behavior

**The list.** `/producers` shows active producers, ordered by name. Archived producers do
not appear, and there is no screen that lists them. An empty list explains what producers
are for and links to the create form. On a phone the list is stacked rows with the
actions reachable by thumb; at desktop width the same data is a table.

**Creating and editing.** `/producers/new` creates one; `/producers/[id]/edit` renames an
existing one. Both render the same form. A name is required, trimmed before validation
and before storage, and between 1 and 100 characters. The same schema runs in the browser
for immediate feedback and again inside the Server Action, which is a public endpoint and
does not trust its caller.

**Names are unique regardless of case.** `Cascade Timber Mill` and `cascade timber mill`
are the same producer. Phase 2 shipped a case-sensitive constraint; this phase adds a
case-insensitive one, because `specs/roadmap.md` Phase 6 groups totals by producer and
two spellings of one producer would split the numbers.

**Archiving.** A producer is archived from its detail page, behind a confirmation dialog
naming it and saying what archiving does. Archiving clears `isActive`, which drops the
producer from Phase 5's inbound dropdown while its record and its movement history stay
intact — `specs/mission.md` § Constraints. Nothing deletes a producer row.

**Restoring is only reachable through a name collision.** Because no screen lists
archived producers, the one route back is creating a producer whose name matches an
archived one: the form says the name belongs to an archived producer and offers to
restore it, movement history attached. This is deliberate and it is narrow — see
`plan.md` § Decisions.

**Feedback.** Creating, editing, archiving and restoring return to the list and confirm
with a toast. Archiving especially needs saying, because the row simply disappears.

**Route protection.** `src/proxy.ts` currently skips any path whose last segment
contains a dot. `/producers/[id]` is the first dynamic route in the app, so
`/producers/acme.co` would be served to an unauthenticated visitor. The matcher narrows to
Clerk's documented form, which excludes a named extension list rather than any dot.

## Acceptance criteria

- [ ] A producer can be created, edited, listed, and archived in the deployed app —
      `specs/roadmap.md` Phase 3 **Done when**
- [ ] The producers list shows active producers ordered by name, and no archived producer
      appears on any screen
- [ ] An empty producers list explains what producers are for and links to the create form
- [ ] The list is usable one-handed on a phone and renders as a table at desktop width
- [ ] A name that is empty, whitespace-only, or longer than 100 characters is refused, in
      the browser and again in the Server Action
- [ ] A name is stored trimmed
- [ ] Two producers whose names differ only in case cannot both exist, enforced by the
      database
- [ ] Creating a producer whose name matches an archived one offers to restore that
      producer rather than failing
- [ ] Archiving asks for confirmation, names the producer, and removes it from the list
      without deleting its row
- [ ] An unauthenticated request to `/producers/acme.co` is redirected to sign in, and
      `/favicon.ico` and Next's build output are still skipped by the middleware
- [ ] `config.matcher` is covered by a test, which nothing asserts today

## Out of scope

- Sequestration sites. `specs/roadmap.md` Phase 4 builds the same surfaces for them,
  reusing whatever this phase establishes rather than duplicating it.
- Movement entry and the inbound dropdown that reads this list. Phase 5.
- The movement list and totals by producer. Phase 6.
- Playwright. `specs/roadmap.md` Phase 7 installs it; this phase's end-to-end proof is
  the manual pass in `validation.md`.
- Any screen that lists archived producers, and any bulk or pruning operation over them.

## Constraints inherited from the constitution

- **Mobile-first.** `specs/mission.md` § Constraints — recording must work one-handed on
  a phone, and desktop layouts widen from that, never the reverse.
- **Nothing is ever hard-deleted.** `specs/mission.md` § Constraints and
  `specs/tech-stack.md` § Data — producers are archived, so every movement's counterparty
  stays resolvable.
- **shadcn/ui for all components,** Tailwind classes and theme tokens only, never a raw
  CSS file, and lucide-react for icons — `specs/tech-stack.md` § Application.
- **Prisma is the source of truth,** every schema change ships as a checked-in migration,
  and the database is never edited by hand — `specs/tech-stack.md` § Data.
- **TypeScript strict mode** — `specs/tech-stack.md` § Application.
- **Green CI is a hard merge requirement** and direct pushes to `main` are blocked —
  `specs/tech-stack.md` § CI/CD and § Branching & pull request workflow.
- **One implementation pull request for this phase**, following this spec pull request —
  `specs/tech-stack.md` § Branching & pull request workflow.

## Open questions

- **Whether archived producers ever need a screen of their own.** This phase deliberately
  ships none, so the only way to reach an archived producer is the name-collision restore
  path. If that proves too narrow in use — an archived producer someone wants back but
  cannot name exactly — a list behind a filter is the smallest fix.
- **Whether the detail page earns its place before Phase 6.** It shows one field today.
  It exists because `specs/roadmap.md` Phase 6 will want somewhere to hang a producer's
  movements and totals, and that is a guess about Phase 6 rather than a requirement of
  this one.

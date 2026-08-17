# Phase 4 — Sequestration sites — Requirements

**Phase:** 4 in `specs/roadmap.md`
**Scope of this spec:** all three of Phase 4's roadmap bullets. Nothing is deferred to a
later spec.

## Goal

Staff can manage the sequestration site list that Phase 5's outbound dropdown reads from:
create a site, edit its name, see the list, and archive one that is no longer used.

Phase 3 built these surfaces for producers and settled the patterns. `specs/roadmap.md`
Phase 4 says this phase follows them, and that "anything the two surfaces genuinely share
is extracted here rather than duplicated". So this phase does two things at once: it ships
the sites surface, and it generalizes the producer components the sites surface would
otherwise have copied.

## Behavior

**The list.** `/sites` shows active sequestration sites, ordered by name. Archived sites do
not appear, and there is no screen that lists them. An empty list explains what
sequestration sites are for and links to the create form. On a phone the list is stacked
rows with the actions reachable by thumb; at desktop width the same data is a table.

**Creating and editing.** `/sites/new` creates one; `/sites/[id]/edit` renames an existing
one. Both render the same form. A name is required, trimmed before validation and before
storage, and between 1 and 100 characters — the same schema producers use, from one shared
module. It runs in the browser for immediate feedback and again inside the Server Action,
which is a public endpoint and does not trust its caller.

**Names are unique regardless of case.** `Cascade Basin` and `cascade basin` are the same
site. Phase 2 shipped a case-sensitive constraint on `sequestration_sites.name`; this phase
adds a case-insensitive one, exactly as Phase 3 did for producers, because
`specs/roadmap.md` Phase 6 groups totals by sequestration site and two spellings of one
site would split the numbers.

**Archiving.** A site is archived from its detail page at `/sites/[id]`, behind a
confirmation dialog naming it and saying what archiving does. Archiving clears `isActive`,
which drops the site from Phase 5's outbound dropdown while its record and its movement
history stay intact — `specs/mission.md` § Constraints. Nothing deletes a site row.

**Restoring is only reachable through a name collision.** Because no screen lists archived
sites, the one route back is creating a site whose name matches an archived one: the form
says the name belongs to an archived site and offers to restore it, movement history
attached. This mirrors producers, and it is deliberate and narrow for the same reason —
see `specs/2026-08-14-producers/plan.md` § Decisions.

**Feedback.** Creating, editing, archiving and restoring return to the list and confirm
with a toast. Archiving especially needs saying, because the row simply disappears.

**The producer surface is refactored, not duplicated.** The form, the list, the archive
dialog and the toast become entity-neutral components taking labels, routes, icon and copy
as props. `src/components/producer-*.tsx` are renamed into them and `/producers` renders
the shared components. Producers' behavior does not change; this is why the phase carries a
producers regression pass.

**Naming.** The route stays `/sites` and the nav label stays "Sites", both shipped in
Phase 0. Page headings, the empty state, the archive dialog and the toasts say
"sequestration site", the term `specs/mission.md` and `specs/roadmap.md` use.

## Acceptance criteria

- [ ] A sequestration site can be created, edited, listed, and archived in the deployed app
      — `specs/roadmap.md` Phase 4 **Done when**
- [ ] The sites list shows active sites ordered by name, and no archived site appears on
      any screen
- [ ] An empty sites list explains what sequestration sites are for and links to the create
      form
- [ ] The list is usable one-handed on a phone and renders as a table at desktop width
- [ ] A name that is empty, whitespace-only, or longer than 100 characters is refused, in
      the browser and again in the Server Action
- [ ] A name is stored trimmed
- [ ] Two sites whose names differ only in case cannot both exist, enforced by the database
- [ ] Creating a site whose name matches an archived one offers to restore that site rather
      than failing
- [ ] Archiving asks for confirmation, names the site, and removes it from the list without
      deleting its row
- [ ] `/producers` renders the same shared components as `/sites`, and every Phase 3
      producer behavior still holds
- [ ] `/sites` no longer renders `PlaceholderPage`

## Out of scope

- Movement entry and the outbound dropdown that reads this list. `specs/roadmap.md`
  Phase 5.
- The movement list and totals by sequestration site. Phase 6.
- Playwright. Phase 7 installs it; this phase's end-to-end proof is the manual pass in
  `validation.md`.
- Any screen that lists archived sites or archived producers, and any bulk or pruning
  operation over them.
- Any change to what a producer or a site stores. `prisma/schema.prisma` gives both a name
  and an `isActive` flag and nothing else — `specs/2026-08-13-schema-and-migrations/plan.md`
  § Decisions. This phase adds an index, not a column.
- Removing `PlaceholderPage`. `/` and `/record` still use it until Phases 5 and 6.

## Constraints inherited from the constitution

- **Mobile-first.** `specs/mission.md` § Constraints — entry must work one-handed on a
  phone, and desktop layouts widen from that, never the reverse.
- **Nothing is ever hard-deleted.** `specs/mission.md` § Constraints and
  `specs/tech-stack.md` § Data — sites are archived, so every movement's counterparty stays
  resolvable.
- **shadcn/ui for all components,** Tailwind classes and theme tokens only, never a raw CSS
  file, and lucide-react for icons — `specs/tech-stack.md` § Application.
- **Prisma is the source of truth,** every schema change ships as a checked-in migration,
  and the database is never edited by hand — `specs/tech-stack.md` § Data.
- **TypeScript strict mode** — `specs/tech-stack.md` § Application.
- **Green CI is a hard merge requirement** and direct pushes to `main` are blocked —
  `specs/tech-stack.md` § CI/CD and § Branching & pull request workflow.
- **One implementation pull request for this phase**, following this spec pull request —
  `specs/tech-stack.md` § Branching & pull request workflow.

## Open questions

- **Whether archived sites and archived producers ever need a screen of their own.** This
  phase ships none, so the only way to reach an archived row is the name-collision restore
  path. Phase 3 carried this question for producers; generalizing the surface now carries it
  for both. If it proves too narrow in use, a list behind a filter is the smallest fix, and
  it would be one fix for both entities rather than two.
- **Whether the detail page earns its place before Phase 6.** It shows one field, for
  producers and now for sites. It exists because `specs/roadmap.md` Phase 6 will want
  somewhere to hang a counterparty's movements and totals, and that is still a guess about
  Phase 6 rather than a requirement of this one. Phase 3 parked this; this phase doubles the
  cost of getting it wrong.

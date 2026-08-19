# Phase 6 — Movement list and totals — Requirements

**Phase:** 6 in `specs/roadmap.md`
**Scope of this spec:** all four of the phase's roadmap bullets — the filterable movement
table, the running totals and their two breakdowns, the extraction of the shared reference
detail page, and unit tests over the totals calculations

## Goal

Managers can review every movement with running totals on desktop.

This is the first phase that reads the `movements` table back. Phase 2 built it and wrote
the totals arithmetic in `src/lib/totals.ts` against the day this phase would need it —
"Phase 2 owns the arithmetic and Phase 6 owns the querying, filtering, and display it
feeds". Phase 5 filled the table and showed the operator a toast and nothing else. Phase 6
is the screen that reads it.

## Behavior

**The movement list is `/`.** The nav's first destination already points there and
`src/app/(app)/page.tsx` is the `PlaceholderPage` saying "Arrives in Phase 6". This phase
replaces it, and `/` becomes what a signed-in manager lands on. `PlaceholderPage` has no
other caller after that and is deleted with it.

**The page is four blocks, in this order.**

1. The filters — direction, producer, sequestration site.
2. The running totals for whatever the filters select: inbound weight and outbound weight.
3. The movement table, newest first.
4. Two breakdown tables — inbound by producer, outbound by sequestration site.

**Filters live in the URL.** `/?direction=INBOUND&producer=<id>` is the whole state, so a
filtered view survives a reload and can be sent to someone. Each of the three controls
navigates when it changes; a **Clear filters** control appears once any is set. An
unrecognized value in a parameter is treated as unset rather than as an error.

**The filter dropdowns offer every counterparty that has movements**, archived ones
included, marked as archived. `specs/roadmap.md` § After v0.1 settles that this phase still
shows archived counterparties carrying movement history — what is deferred is managing
them, not seeing them. A filter that could not reach a name already in the table would be a
table nobody can narrow.

**The totals follow the filters.** Filter to one producer and the totals describe that
producer. They are computed over every row the filters select, not over the rows currently
on screen, so they do not move when more rows are loaded.

**The table shows the newest 100, with a Show more control.** Show more is a link that
raises a `limit` parameter in the same URL. Changing any filter starts over at 100.

**Each movement row carries** its recorded time, its direction in the yard's words —
**Feedstock in** and **Feedstock out**, as Phase 5's screens already say it — its
counterparty, linked to that counterparty's detail page, and its weight in kilograms.

**Times are shown in UTC, labeled.** Formatted on the server so nothing depends on the
reader's clock and nothing mismatches on hydration. The facility's own timezone is not
named anywhere in this constitution — see Open questions.

**The breakdowns are heaviest first**, each name linking to its detail page, archived names
marked. Inbound weight is only ever attributed to a producer and outbound weight only ever
to a sequestration site, which is what the database's check constraint already guarantees.

**Nothing here changes a movement.** No edit control, no delete control, no row action. The
surface is read-only because `specs/mission.md` § Constraints makes it so.

**Both detail pages are one component after this phase.** `/producers/[id]` and
`/sites/[id]` are near-identical today and differ in five things — the query, the archive
action, one sentence of description, the edit path, and the confirm label. This phase
extracts `ReferenceDetail` before adding a sixth thing to both, and each page then shows
its counterparty's total, its newest ten movements, and a **See all** link into the
movement list already filtered to it.

**Empty is two different situations.** A facility with no movements at all gets an
explanation and a link to `/record`. Filters that match nothing say so and offer **Clear
filters**. They are not the same screen, because they do not have the same way out.

## Acceptance criteria

- [ ] The movements recorded in Phase 5 appear in the desktop movement list and are
      reflected in the totals
- [ ] `/` renders the movement list and no longer renders `PlaceholderPage`, which is
      deleted
- [ ] The table is newest first, and shows each movement's time, direction, counterparty
      and weight in kilograms
- [ ] Direction, producer and sequestration site filters each narrow the table, are carried
      in the URL, and survive a reload
- [ ] The filter dropdowns list every counterparty that has movements, archived ones
      included and marked
- [ ] The inbound and outbound totals describe the filtered set, and do not change when
      **Show more** is used
- [ ] The table shows at most 100 rows, with **Show more** present when more match and
      absent when they do not
- [ ] Inbound weight is broken down by producer and outbound weight by sequestration site,
      heaviest first, each name linking to its detail page
- [ ] Every weight on screen is exact to the gram — no total is rounded on its way to the
      page
- [ ] A movement's counterparty name links to that counterparty's detail page
- [ ] `/producers/[id]` and `/sites/[id]` render from one shared component, each showing
      that counterparty's total, its newest ten movements, and a **See all** link into the
      filtered movement list
- [ ] With no movements at all the page explains that and links to `/record`; with filters
      matching nothing it says so and offers **Clear filters**
- [ ] The page is readable on a phone with no horizontal scrolling, at both themes

## Out of scope

- **Editing or deleting a movement.** Append-only — `specs/mission.md` § Constraints. This
  phase adds no control that writes.
- **Filtering by date or date range.** `specs/roadmap.md` names direction, producer and
  sequestration site, and no more.
- **A net figure.** In minus out is not shown; see `plan.md` § Decisions.
- **A screen for archived producers and sequestration sites.** `specs/roadmap.md`
  § After v0.1. Archived counterparties are visible here — in the table, the filters and
  the breakdowns — but nothing manages them.
- **CSV export and charts.** `specs/roadmap.md` § After v0.1.
- **Playwright coverage.** `specs/roadmap.md` Phase 7 installs it and makes the job a
  required check. `specs/tech-stack.md` § CI/CD records it as not installed yet.
- **Roles.** `specs/tech-stack.md` § Auth: every authenticated user sees every movement.

## Constraints inherited from the constitution

- **Kilograms only.** `specs/mission.md` § Constraints. Every weight and every total is in
  kilograms, with no conversion and no unit control.
- **Movements are immutable.** `specs/mission.md` § Constraints. A read-only surface is not
  a limitation of this phase, it is the rule.
- **Nothing is ever hard-deleted.** `specs/mission.md` § Constraints — "every movement's
  counterparty stays resolvable for the life of the record", which is what lets an archived
  producer still be named in a breakdown.
- **Mobile-first.** `specs/mission.md` § Constraints and `specs/tech-stack.md` § Responsive
  strategy. Desktop is the review target here, but the phone layout is still the one the
  design starts from.
- **shadcn/ui for all components.** `specs/tech-stack.md` § Application. `Table`, `Select`
  and `Empty` are all already in the project.
- **Emerald accent, neutral everything else, in both themes.** `specs/tech-stack.md`
  § Application. Inter's tabular numerals are why the font was chosen — "so columns of
  weights align" — and this is the phase with the columns.
- **Pages that read the database render per request.**
  `specs/2026-08-16-sequestration-sites/plan.md` § Decisions binds this forward: "Phases 5
  and 6 add pages that read the database, and the same prerendering applies to them unless
  they say otherwise."
- **One implementation pull request for the phase.** `specs/tech-stack.md` § Branching &
  pull request workflow.

## Open questions

- **What timezone the facility keeps.** Nothing in this constitution names a location, so
  timestamps render in UTC with the zone labeled rather than in a zone this spec guessed.
  Ask Arin before `specs/roadmap.md` Phase 8's walkthrough; changing it is a formatting
  constant, not a schema change, because `recorded_at` stores an instant either way.

  `specs/roadmap.md` Phase 8 now carries this as a bullet, so it is work with an owner
  rather than a note in a shipped spec. It stays open here because only Arin can close
  it.

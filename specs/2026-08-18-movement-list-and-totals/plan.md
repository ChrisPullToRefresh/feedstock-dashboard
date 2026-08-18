# Phase 6 — Movement list and totals — Plan

Tasks run in order. Every feature task ships with its paired test task in the same
pull request.

The bottom of the stack comes first: the URL contract, then the formatting, then the
queries, then the arithmetic on top of them, then the components, then the page that
assembles them. The detail-page extraction is last, because it consumes the same
per-counterparty reads the movement page proves first — and because
`specs/roadmap.md` requires it to happen before totals are rendered into either page,
not after.

| #  | Feature task | Paired test task |
|----|--------------|------------------|
| 1  | The search-param contract in `src/lib/movement-data.ts` — read `direction`, `producer`, `site` and `limit` off `searchParams`, treat anything unrecognized as unset, and build the URL for one changed filter. `DEFAULT_LIMIT` is 100 | Vitest: an unknown direction, an unknown id and a non-numeric, negative or absurd `limit` each fall back to unset or to the default; changing one filter preserves the other two and drops `limit`; clearing every filter yields a bare `/` |
| 2  | `formatRecordedAt` in `src/lib/movement-data.ts` — an absolute date and time rendered in UTC with the zone labeled | Vitest: a known instant renders its expected string, and renders identically with the process `TZ` set to two different zones — the assertion that keeps this independent of where it runs |
| 3  | `listMovements` in `src/lib/movement-queries.ts` — filtered by direction, producer and site, newest first, reading `limit + 1` rows so the page can tell whether a **Show more** control belongs without a second count | Manual: `validation.md` § Manual steps 3–8. No database test harness exists before `specs/roadmap.md` Phase 7 |
| 4  | `listMovementsForTotals` — the same filters, every matching row, selecting only `direction`, `weightKg`, `producerId` and `sequestrationSiteId`, which is exactly `MovementForTotals` | Manual: `validation.md` § Manual step 9 — the totals are unchanged by **Show more**, which is the whole reason this query is separate |
| 5  | The filter option queries — the producers and the sequestration sites that have at least one movement, archived included, each carrying its `isActive` flag | Manual: `validation.md` § Manual steps 10–11, which archive a counterparty that has history and confirm it is still offered, still marked |
| 6  | `rankCounterpartyTotals` in `src/lib/totals.ts` — turns the `Map` from `totalByProducer` or `totalBySequestrationSite` into display rows carrying each counterparty's name and active flag, heaviest first | Vitest: heaviest first; equal weights fall back to name so the order is stable; a counterparty with no movements does not appear; an archived one appears with its flag; an empty map yields an empty array. Plus new cases on `totals.test.ts` for a filtered array and for exactness — `1250.5 + 0.001` comes back `1250.501` |
| 7  | `src/components/movement-list.tsx` — stacked rows on a phone, the shadcn `Table` from `md` up, both from one array. Time from task 2, direction as **Feedstock in** / **Feedstock out**, counterparty linked to its detail page, weight through `formatWeightKg` | React Testing Library: rows render in the order given; each direction renders its screen words; each counterparty name links to `/producers/<id>` or `/sites/<id>`; weights render grouped and unpadded; both layouts render the same row count from one array |
| 8  | `src/components/movement-filters.tsx` — a client component with three shadcn `Select`s that navigate on change, plus **Clear filters** once any is set | React Testing Library: changing each Select navigates with that parameter set and the other two preserved; **Clear filters** navigates to the bare path; with nothing set, no clear control renders; an archived option renders marked |
| 9  | The totals block above the table — inbound and outbound weight over the filtered set, from task 4's rows through `totalInboundKg` and `totalOutboundKg` | React Testing Library: both figures render from the rows given; a direction filter leaves the other total at zero rather than hiding it; no net figure is rendered |
| 10 | The two breakdown tables below the list — inbound by producer, outbound by sequestration site, from task 6, each name a link, archived names marked | React Testing Library: rows are heaviest first; each name links to its detail page; an archived name renders its marker; a breakdown with no rows renders its own empty line rather than a bare heading |
| 11 | **Show more** — a link raising `limit` by 100 in the current URL, rendered only when task 3 returned more rows than the limit | React Testing Library: `limit + 1` rows renders `limit` rows and the control; exactly `limit` rows renders no control; the totals rendered alongside are identical in both cases |
| 12 | The two empty states, both the shadcn `Empty` component — no movements at all links to `/record`; filters matching nothing offer **Clear filters** | React Testing Library: each renders its own message and its own action, and neither renders the table; a non-empty result renders neither |
| 13 | `/` assembled — a Server Component reading `searchParams` through task 1, running tasks 3, 4 and 5, and rendering tasks 7–12 in order, with `export const dynamic = "force-dynamic"`. `src/components/placeholder-page.tsx` is deleted, `/` being its last caller | React Testing Library: the page renders filters, totals, table and breakdowns from its queries, and passes the parsed filters to each; Vitest asserting `src/app/(app)/page.tsx` sets `dynamic = "force-dynamic"`, that no file imports `PlaceholderPage`, and that the file no longer exists |
| 14 | The per-counterparty reads in `src/lib/movement-queries.ts` — one counterparty's newest ten movements, and its rows for totals, both keyed on the column matching its direction | Manual: `validation.md` § Manual steps 12–13, which read a producer's page and a site's page against the movements recorded in steps 3–6 |
| 15 | `src/components/reference-detail.tsx` — the extracted detail page, taking name, description, edit path, confirm label, archive action, the counterparty's total, its recent movements and the **See all** href. Individual props, not a config object, as `reference-form.tsx` and `reference-list.tsx` already do it | React Testing Library, every assertion run for both entities: the name, description and confirm label render from props; the edit link and the **See all** link carry the given hrefs; the total renders formatted; the recent movements render through task 7's list; a counterparty with no movements renders an explanation rather than an empty table |
| 16 | `/producers/[id]` and `/sites/[id]` rewritten as thin routes over task 15 — each keeps its own query, its own `notFound`, its own archive action and its own words | React Testing Library: each route renders its own description, edit path and confirm label; each passes a **See all** href filtered to itself — `/?producer=<id>` and `/?site=<id>`; an unknown id still renders the not-found path; neither file duplicates the other's markup |

## Decisions

Every entry below answers a question put to the user in the session that wrote this spec.

**The movement list is `/`, replacing the `PlaceholderPage`.**

`NAV_DESTINATIONS` has pointed `/` at "Movements" since Phase 0 and the placeholder there
says "Arrives in Phase 6". Nothing in the nav or in `isActiveDestination` changes, and the
movement list becomes what a signed-in manager lands on.

A named `/movements` route with the nav updated was offered and declined: it leaves `/`
needing something else and reworks the `/` special case in `isActiveDestination` for a
tidier URL. `/movements` with `/` redirecting to it was offered and declined — an extra hop
on every visit to the home screen, and two addresses for one page to keep straight when
Phase 7 writes E2E against them.

The cost accepted: the app's landing page on a phone is the review surface rather than the
entry surface, on a phone-first product. The **Record** destination is one tap away in the
tab bar.

**Filters live in URL search parameters and are applied in the query.**

`/?direction=INBOUND&producer=<id>` is the entire state of the page. A filtered view
survives a reload, can be sent to someone, and can be linked into — which is what lets the
detail pages' **See all** work, and what gives Phase 7 an address to navigate straight to.
It also fits the `force-dynamic` rendering the constitution already binds these pages to.

Client-side filtering of rows already fetched was offered and declined: filter state would
die on reload, could not be linked, and the whole movement history would ship to the
browser on every visit. URL parameters wrapped in `useTransition`/`useOptimistic` was
offered and declined as more moving parts than the surface has earned before anyone has
used it.

The cost accepted: a server round trip on every filter change.

**The totals describe the filtered set, not the whole table.**

Filter to one producer and the totals are that producer's. The page answers one question
at a time, and the breakdowns below collapse to what is in view.

Totals that always cover every movement were offered and declined: a filtered table sitting
under totals that do not match it is how a report gets misread. Showing both — filtered
figures plus an all-time line — was offered and declined as two sets of numbers on one
screen, each needing a label good enough that nobody confuses them.

The cost accepted: the unfiltered grand total is only visible by clearing the filters.

**The table shows the newest 100, with a Show more link that raises a `limit` parameter.**

The query reads `limit + 1` rows, so the presence of the control is answered by the same
query rather than a second count. **Show more** is a `Link` to the same URL with the limit
raised by 100; changing a filter drops the parameter and starts over at 100.

Rendering every matching row was offered and declined, as was parking pagination as an open
question: the cap is cheap now and the page is the one screen in v0.1 whose size grows
without bound. A cursor parameter keyed to the oldest loaded row was offered and declined —
it pages correctly as new movements land, but it wants client state to accumulate rows,
which is more machinery than a growing limit. A client-side fetch-and-append was offered and
declined: the loaded set would stop being described by the URL, and it needs a loading state
to build and test.

The cost accepted: a full round trip and a re-render per tap, and scroll position is not
preserved across one.

**The totals come from a second query over every filtered row.**

The page runs two queries: the newest `limit + 1` full rows for the table, and a narrow
select — direction, weight, and the two counterparty ids — over every row the filters match,
for the arithmetic. That narrow shape is exactly the `MovementForTotals` type
`src/lib/totals.ts` already declares.

Summing only the loaded rows was offered and declined: the figures would move every time
someone tapped **Show more**, which is not what a running total means. It is also the
direct consequence of capping the table, which is why the question was asked separately
once the cap was chosen.

The cost accepted: two queries per page load, and the totals query still reads every
matching row even though it returns four columns of each.

**The totals arithmetic stays in `src/lib/totals.ts`, in JavaScript, over `Prisma.Decimal`.**

`totalInboundKg`, `totalOutboundKg`, `totalByProducer` and `totalBySequestrationSite` were
written in Phase 2 for this phase — the module's own header says so — and they sum through
`Decimal` because "a column of weights added as binary floats does not come back to the
number an operator would get on paper". This phase adds `rankCounterpartyTotals` beside
them and feeds all five from task 4.

SQL aggregation through Prisma's `groupBy` was offered and declined: it is the cheaper
answer at scale, but it would leave `totals.ts` as dead code and leave
`specs/roadmap.md` Phase 6's fourth bullet — "unit tests over the totals calculations" —
with nothing pure to test, moving the arithmetic somewhere Vitest cannot reach until Phase 7
builds a database harness. A split — `groupBy` for the page, the helpers for the detail
pages — was offered and declined as two implementations of one sum that can disagree with
nothing proving they do not.

The cost accepted: every matching row is summed in Node on every page load. The cap does not
bound this; only the totals query's narrow projection does.

**The page is filters, totals, table, then the two breakdowns.**

Inbound and outbound totals sit above the table as the summary; **Inbound by producer** and
**Outbound by sequestration site** sit below it, each name linking to its detail page.
Everything the roadmap's totals bullet asks for is on one page.

Putting the breakdowns only on the detail pages was offered and declined: the bullet says
the totals are "broken down by producer and by sequestration site", and no single screen
would then show that breakdown. Leading with all three tables before the movement list was
offered and declined — on a phone it puts three tables between the operator and the
movements themselves.

The cost accepted: a long page on a phone, and three responsive tables to lay out.

**The filter dropdowns offer every counterparty that has movements, archived included.**

`specs/roadmap.md` § After v0.1 already settles the visibility half: "Phase 6's totals still
show archived counterparties that carry movement history, so what is deferred here is
managing them, not seeing them." The filters follow the table — a name in the table that no
filter can isolate would be a table nobody can narrow. Archived entries render marked, so
nobody reads the list as what the entry forms offer.

Reusing `listActiveProducers` and `listActiveSites`, as the entry forms do, was offered and
declined: an archived producer's rows would appear in the table and its weight in the
breakdown with no way to filter to either. Offering the full reference lists regardless of
movements was offered and declined — dropdowns padded with names that filter to an empty
table.

The cost accepted: two more queries, and a second meaning of "the list of producers" in an
app that had one.

**The two detail pages become one `ReferenceDetail` component with two thin routes.**

`src/components/reference-detail.tsx` takes the name, the description, the edit path, the
confirm label, the archive action, the counterparty's total, its recent movements and the
**See all** href. Each route keeps its own query and its own `notFound` and renders it. This
is what `specs/roadmap.md` Phase 6 asks for, and it is the fourth time this project has
extracted a reference surface this way — `reference-form.tsx`, `reference-list.tsx` and
`archive-dialog.tsx` are the precedent.

A per-entity config object carrying the five differences was offered and declined: Phase 4
chose individual props deliberately — "the props are individual rather than a per-entity
config object, so the words stay next to the screen they appear on" — and this phase is not
where that gets reversed. A single dynamic `/[entity]/[id]` route was offered and declined:
it rewrites the URL structure and the proxy matcher two phases after `src/proxy.test.ts`
pinned them, and the branch on entity reappears inside every query.

The cost accepted: six props at each call site.

**A detail page shows the counterparty's total, its newest ten movements, and a link to the
filtered list.**

Ten is enough to show the shape of recent activity without the page becoming a second
movement list, and **See all** carries the filter to `/?producer=<id>` or `/?site=<id>`,
where the full history and its own paging already live.

The complete history on the detail page was offered and declined: the same unbounded table
would exist in two places, and the cap and its **Show more** would have to be built twice or
shared. Twenty-five was offered and declined as a long stacked list on a phone before the
edit and archive controls come back into reach; five was offered and declined as barely a
sample. Showing the total and no movements at all was offered and declined — the roadmap
bullet says this phase gives both pages "a counterparty's movements and totals".

The cost accepted: a manager reading one producer's page has to follow a link to see
everything.

**Stacked rows on a phone, the table from `md` up.**

Exactly what `src/components/reference-list.tsx` already does, for the reason recorded
there: "the stacked rows are the primary layout and the table is what replaces them once
there is room. Both render the same rows from the same array — one design at two widths, not
two designs."

A single table scrolling horizontally on a phone was offered and declined: horizontal
scrolling is what `specs/tech-stack.md` § Responsive strategy exists to avoid, and it
contradicts the pattern both reference lists set. Dropping columns at narrow widths was
offered and declined — information disappearing with no way to reach it, on the surface a
manager is most likely to open on a phone.

The cost accepted: every column has to earn its line in the stacked card, or the card gets
tall.

**Times render as an absolute date and time in UTC, labeled, formatted on the server.**

Server-side formatting means no hydration mismatch and no dependence on the reader's clock,
and the label means nobody mistakes the zone.

Formatting in the viewer's local timezone was offered and declined: a client component and a
hydration-safe render for what is otherwise static text, and two people comparing screens
would see different numbers for the same row. Relative time with the absolute on hover was
offered and declined — useless past a day or two, needs a client component to stay current,
and the hover fallback does not exist on a phone.

Naming the facility's timezone now was offered and declined, because nothing in this
constitution names a location and a guess would be baked into every rendered row. UTC with
the zone shown is the honest rendering until someone asks Arin;
`requirements.md` § Open questions carries that.

The cost accepted: an operator comparing a row against the yard clock does the offset
themselves.

**The filters are three shadcn `Select`s that navigate on change.**

Direction, producer and sequestration site, each pushing the new search parameters as it
changes, with **Clear filters** once any is set. `Select` is already in the project from
Phase 5, and `specs/tech-stack.md` § Application requires it over a hand-rolled control.

Three Selects inside a form with an **Apply** button was offered and declined: it saves a
round trip when setting two filters at once, but it costs an extra tap in the common case and
introduces a submit pattern no other screen in this app uses. Direction as segmented links
with the other two as Selects was offered and declined — two filter idioms on one toolbar.

The cost accepted: a client component wrapping controls that are otherwise static, and one
navigation per change.

**No net figure.**

Inbound total and outbound total, and nothing derived from them. The roadmap bullet asks for
"inbound and outbound weight overall", and in minus out would read as material currently on
site, which it is not — processing loss is not modeled anywhere in v0.1 and nothing defines
what the difference means.

Showing net alongside the two totals was offered and declined on that ground. Parking it for
Arin to rule on during Phase 8's walkthrough was offered and declined: it would leave a
question open on a page Phase 8 is otherwise only demoing.

The cost accepted: a manager who wants the difference computes it.

**Two distinct empty states, both the shadcn `Empty` component.**

No movements at all explains that and links to `/record`. Filters matching nothing say so and
offer **Clear filters**. `reference-list.tsx` and Phase 5's forms already render `Empty`.

One empty state for both was offered and declined: someone who has filtered into a corner
would be told the facility has no movements, which is false and offers no way back. An empty
table with a caption line was offered and declined — a dead end with no action, on the app's
landing page.

The cost accepted: two branches on the page to build and test.

**The breakdowns are ordered heaviest first, and counterparty names link everywhere they
appear.**

Weight descending, ties broken by name so the order is stable between renders. The
breakdown's job is to show where material comes from and goes to, and that is the first
question asked of it. Name order was offered and declined: it matches the two reference
lists, but it buries the answer. Heaviest first with archived counterparties grouped
beneath was offered and declined — an archived producer that dominated last year is not
less true.

Counterparty names in the movement table link to their detail pages, exactly as the
breakdown names do. Plain text in the table was offered and declined: the same name would be
a link in one table and not in another a few hundred pixels away.

The cost accepted: the breakdown reorders itself as weights accumulate, so it is not a
stable place to look one name up — that is what the filters are for. And a table of 100
rows is a table of 100 links, which the stacked phone layout has to keep readable as data.

**The new code extends the modules that already exist.**

Every query joins `src/lib/movement-queries.ts`, which already owns movement reads and the
append. The search-param contract and `formatRecordedAt` join
`src/lib/movement-data.ts`, and `rankCounterpartyTotals` joins `src/lib/totals.ts`. No new
`src/lib` module, and flat filenames — the layout `specs/2026-08-14-producers/plan.md`
§ Decisions chose and every phase since has kept.

A separate `movement-list-queries.ts` was offered and declined: two modules named for the
same table, with a boundary that has to be re-explained every time a query is added. Putting
the counterparty filter options on `producer-queries.ts` and `site-queries.ts` was offered
and declined — a query written for the movements page living in a module named for a
different one.

The cost accepted: `movement-queries.ts` roughly triples in size.

The split between the two movement modules is not cosmetic, and it decides where the
search-param code goes: `movement-data.ts` is what the client form imports, and anything
reaching `db` drags the Postgres driver into the browser bundle. Task 8's filter component
is a client component that has to build URLs, so the contract it reads belongs on the
client-safe side.

## Open questions

- **What timezone the facility keeps.** Deliberately not answered here. Timestamps render in
  UTC, labeled, and `requirements.md` § Open questions carries the question through to
  `specs/roadmap.md` Phase 8, where Arin is in the room.

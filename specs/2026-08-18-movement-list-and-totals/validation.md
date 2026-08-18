# Phase 6 — Movement list and totals — Validation

The phase is done when the movements recorded in Phase 5 appear in the desktop movement
list and are reflected in the totals. Automated tests prove the arithmetic and the
rendering; only the manual pass proves the two together against a real database on a real
screen, which is what the Done when line describes.

## Automated

### Unit and component (Vitest + React Testing Library)

**Unit — `src/lib/totals.test.ts`**

The Phase 2 file, extended for what this phase asks of it:

- `rankCounterpartyTotals` returns rows heaviest first
- Equal weights fall back to name order, so a render is not free to reorder them
- A counterparty with no movements does not appear in a breakdown
- An archived counterparty does appear, carrying its flag
- An empty map yields an empty array
- `1250.5 + 0.001` totals to `1250.501` — the exactness the `Decimal` sum exists for
- A filtered array totals to the filtered figure, with no leakage from rows not passed in
- An outbound row can never land under a producer, nor an inbound row under a site

**Unit — `src/lib/movement-data.test.ts`**

The search-param contract and the timestamp format:

- An unrecognized `direction`, an unknown counterparty id, and a `limit` that is
  non-numeric, negative, zero or absurd each fall back to unset or to `DEFAULT_LIMIT`
- Changing one filter preserves the other two
- Changing any filter drops `limit`, so a new filter starts at 100 rows
- Clearing every filter yields a bare `/`
- A known instant renders its expected UTC string, with the zone labeled
- The same instant renders identically with the process `TZ` set to two different zones

**Component — the shared pieces**

- `movement-list.tsx`: rows render in the order given; `INBOUND` renders **Feedstock in**
  and `OUTBOUND` renders **Feedstock out**; each counterparty name links to
  `/producers/<id>` or `/sites/<id>`; weights render through `formatWeightKg`, grouped and
  unpadded; the stacked and table layouts render the same rows from one array
- `movement-filters.tsx`: changing each Select navigates with that parameter set and the
  other two preserved; **Clear filters** navigates to the bare path; with nothing set, no
  clear control renders; an archived option renders marked
- `reference-detail.tsx`, every assertion run for both entities: name, description and
  confirm label render from props; the edit and **See all** links carry the given hrefs; the
  total renders formatted; recent movements render through the movement list; a counterparty
  with no movements renders an explanation rather than an empty table

**Component — the page**

- The totals block renders both figures from the rows given, leaves the other total at zero
  under a direction filter, and renders no net figure
- The breakdowns render heaviest first, mark archived names, link every name, and render an
  empty line rather than a bare heading when there is nothing in them
- `limit + 1` rows renders `limit` rows plus **Show more**; exactly `limit` rows renders no
  control; **the totals rendered alongside are identical in both cases** — this is the
  assertion that pins the second query's purpose
- With no movements at all, the page renders the `/record` empty state and no table; with
  filters matching nothing, it renders the **Clear filters** empty state and no table
- `/` renders filters, totals, table and breakdowns from its queries and passes the parsed
  filters to each
- `src/app/(app)/page.tsx` sets `dynamic = "force-dynamic"`, no file imports
  `PlaceholderPage`, and `src/components/placeholder-page.tsx` no longer exists
- `/producers/[id]` and `/sites/[id]` each render their own description, edit path and
  confirm label, and each **See all** link carries its own filter

The 100-row cap is proven here rather than on a screen: the boundary is a number, and
`limit + 1` against `limit` is the only interesting case. The manual pass below walks the
control itself with the limit lowered, which needs no bulk data.

## Manual

Run against the pull request's own Vercel preview deployment, signed in as
`chris@pulltorefresh.team`. `specs/tech-stack.md` § Hosting notes previews are
SSO-protected — a signed-in browser reaches them, `curl` does not. Steps 1 to 14 are on
desktop; steps 15 and 16 are the phone pass.

The preview has its own Neon branch seeded with reference data and no movements, so step 2
creates everything the rest of the pass reads. Nothing here touches production.

1. Open the preview and sign in. Expect `/` to be the movement list, not a placeholder, and
   with no movements yet expect the empty state explaining that and linking to `/record`.
   Follow the link and expect the Phase 5 chooser.
2. Record five movements through `/record`: **Feedstock in** `1250.5` and `800` from one
   producer, `300` from a second producer; **Feedstock out** `900` to one sequestration
   site and `250` to a second.
3. Return to `/`. Expect five rows, newest first — the `250` outbound at the top — each
   showing its recorded time in UTC with the zone labeled, its direction as **Feedstock in**
   or **Feedstock out**, its counterparty, and its weight in kilograms.
4. Expect the totals above the table to read `2,350.5 kg` in and `1,150 kg` out. Expect no
   net figure anywhere on the page.
5. Expect the breakdowns below the table: inbound by producer, the first producer's
   `2,050.5 kg` above the second's `300 kg`; outbound by site, `900 kg` above `250 kg`.
   Every name is a link.
6. Set the direction filter to **Feedstock in**. Expect three rows, an inbound total
   unchanged at `2,350.5 kg`, an outbound total of `0 kg` rather than a hidden one, and
   `direction` in the URL. Reload the page and expect the same view.
7. Clear direction and set the producer filter to the first producer. Expect two rows and
   totals describing that producer alone. Copy the URL into a new tab and expect an
   identical page.
8. Tap **Clear filters**. Expect all five rows and the step 4 totals back, and a bare URL.
9. Append `?limit=2` to the URL. Expect two rows and a **Show more** control — and expect
   the totals to still read `2,350.5` and `1,150`, unchanged from step 4 while only two
   rows are on screen. Tap **Show more**. Expect every row, no control, and the same two
   totals a third time.
10. Archive the first producer from `/producers`. Return to `/`. Expect its two rows still
    in the table, its `2,050.5 kg` still in the inbound breakdown, and its name marked as
    archived.
11. Open the producer filter. Expect that archived producer still listed and still marked,
    and expect selecting it to show its two rows. This is the filter reaching a name the
    entry forms no longer offer.
12. From a row, follow the second producer's name. Expect its detail page: the name, the
    inbound description, a total of `300 kg`, its one movement listed, an **Edit** link, and
    the archive control. Follow **See all** and expect `/` filtered to that producer.
13. Open a sequestration site's page the same way. Expect the same structure in outbound
    words, its own total, its own edit path, and the site wording in the archive dialog —
    open the dialog, read it, and cancel.
14. Set direction to **Feedstock out** and the producer filter to the second producer.
    Expect the filters-match-nothing empty state with **Clear filters** — not the
    no-movements one — and expect the control to restore every row.
15. On a real phone, sign in and walk steps 3 to 5. Expect stacked rows rather than a
    table, no horizontal scrolling, weights and times readable at a glance, and the whole
    page legible at both light and dark.
16. On the phone, set each filter in turn one-handed and confirm the dropdowns are readable
    and tappable, then repeat step 9's `?limit=2` and confirm **Show more** is reachable
    without stretching. Confirm the accent and the focus rings are visible at both themes.

## CI gate

Every check below must be green before the implementation pull request merges.
`specs/tech-stack.md` § CI/CD makes this a hard requirement. The job names are the real
ones in `.github/workflows/ci.yml`:

- **Commit convention** — the pull request title against Conventional Commits
- **Lint** — ESLint, zero warnings tolerated
- **Typecheck** — `tsc --noEmit`
- **Test** — Vitest, carrying everything under Automated above
- **Database** — migrations applied to an empty Postgres, seeded twice, row counts
  unchanged, and the append-only trigger refusing a rewrite

Phase 6 adds no migration and writes nothing, so **Database** is a regression guard here
rather than a check on new work.

Plus the Vercel preview deployment, which is what the manual pass runs against. There is no
Playwright job to wait on — `specs/roadmap.md` Phase 7 installs the suite and makes it a
required check, and this phase adds no E2E coverage.

## Open questions

None outstanding for validation. The timezone question in `requirements.md` § Open questions
does not change how this phase is proven: the manual steps read the zone off the label
rather than assuming one.

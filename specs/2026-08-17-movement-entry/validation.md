# Phase 5 — Movement entry — Validation

The phase is done when an inbound movement and an outbound movement recorded **on a
phone** are stored as append-only records. Automated tests cannot prove the phone half, so
the manual pass below is not optional here — it is the part of the Done when line nothing
else covers.

## Automated

### Unit and component (Vitest + React Testing Library)

**Unit — `src/lib/movement-data.test.ts`**

The weight schema, at its boundaries and one case per refusal:

- `""` is refused as empty
- `"abc"`, `"1e3"`, `"1,250"` and `"1250kg"` are refused as not a number
- `"0"` and `"-5"` are refused as not positive
- `"12.3456"` is refused as too precise; `"12.345"` is accepted
- `"1000000000"` is refused as too large; `"999999999.999"` is accepted
- `" 1250 "` is accepted and parses to `1250`
- Each refusal carries its own message, so the form never has to match on prose
- A movement with no counterparty id is refused; one with an id is accepted

**Component — `src/components/movement-form.test.tsx`**

Every assertion runs at both directions, as Phase 4's reference-component tests run at
both entities:

- Each of the five weight refusals renders its own message in the `FieldError`
- Submitting with no counterparty selected is refused and does not call the action
- A valid entry calls the action with the typed weight and the selected counterparty id
- A refusal leaves the typed weight on screen — the React 19 form-reset behavior
  `reference-form.tsx` documents applies here too
- Save is disabled and reads "Saving…" while the action is pending
- A returned success clears the weight and the counterparty and announces the weight and
  the counterparty name
- An error state renders no toast
- An archived-counterparty error renders its message on the form

**Component — the routes**

- `/record` renders both chooser links with their own labels and hrefs, and no longer
  renders `PlaceholderPage`
- `/record/inbound` renders the form with the producer label and only active producers as
  options; `/record/outbound` does the same for sequestration sites
- Each route wires its own direction to the form
- Both route files set `dynamic = "force-dynamic"`
- With an empty options list, each route renders the empty state and its create link, and
  renders no weight field

### End-to-end (Playwright)

Not applicable to this phase. `specs/roadmap.md` Phase 7 installs Playwright and makes the
job a required check; `specs/tech-stack.md` § CI/CD records it as not installed yet. The
E2E coverage of both movement entry flows is Phase 7's, and this phase adds none.

## Manual

Run against the pull request's own Vercel preview deployment, signed in as
`chris@pulltorefresh.team`. `specs/tech-stack.md` § Hosting notes previews are
SSO-protected — a signed-in browser reaches them, `curl` does not. Steps 1 to 13 are on a
real phone; steps 14 and 15 are the desktop pass.

The preview has its own Neon branch, so every write below is throwaway. Nothing here
touches production.

1. Open the preview on a phone and sign in. Tap **Record**. Expect the chooser: two large
   targets, **Feedstock in** and **Feedstock out**, both comfortably tappable.
2. Tap **Feedstock in**, then open the producer dropdown. Expect the active producers,
   name-ordered, each row readable and tappable one-handed. Switch the phone between light
   and dark and confirm both are legible.
3. Choose a producer, enter `1250.5`, tap **Save**. Expect a toast reading
   "1,250.5 kg recorded from &lt;producer&gt;", both fields cleared, and the same form still on
   screen.
4. Go back, tap **Feedstock out**, choose a sequestration site, enter `800`, tap **Save**.
   Expect the matching toast naming the site.
5. Return to **Feedstock in**, record `1250.5` from the same producer again. Expect a
   second toast and no duplicate warning — two trucks can weigh the same.
6. Connect to the preview's database (`vercel env pull` for the preview branch's
   `DATABASE_URL`, then `npx prisma studio` or `psql`). Expect three `movements` rows:
   two `INBOUND` carrying `producer_id` with `sequestration_site_id` null, one `OUTBOUND`
   carrying `sequestration_site_id` with `producer_id` null. Expect `weight_kg` to read
   exactly `1250.500`, `1250.500` and `800.000` — not a rounded neighbor. Expect
   `recorded_at` set on all three.
7. In the same session, run `UPDATE movements SET weight_kg = 1 WHERE id = '<one of them>';`.
   Expect the Phase 2 trigger to refuse it. This is the append-only half of the Done when
   line, proven against the row the form just wrote.
8. Archive the producer used in step 3, from `/producers`. Return to **Feedstock in** and
   open the dropdown. Expect that producer to be absent. Confirm in the database that its
   two movement rows are untouched and still resolve to it.
9. Open **Feedstock in** on the phone and leave the form on screen with a producer chosen.
   In a second browser, archive that producer. Back on the phone, enter a weight and tap
   **Save**. Expect a refusal naming the producer and saying it has been archived, the
   typed weight still on screen, and no new row in the database.
10. Without reloading, open the dropdown again. Expect the archived producer to be gone and
    the list refreshed. Choose another producer and save. Expect success.
11. On either form, enter each of these in turn and tap **Save**: nothing at all, `abc`,
    `0`, `-5`, `12.3456`, `1000000000`. Expect six different messages, each naming that
    specific reason, and no row written for any of them.
12. Choose no counterparty, enter `500`, tap **Save**. Expect a refusal and no write.
13. With both fields filled, tap **Save** twice in quick succession. Expect the button to
    go disabled and read "Saving…" after the first tap, and exactly one row in the
    database.
14. On desktop, narrow the viewport to a phone width and walk steps 1 to 4 again. Expect
    the layout to hold with no horizontal scrolling and no overlapping controls, at both
    light and dark.
15. On desktop at full width, confirm the chooser and both forms widen sensibly rather
    than stretching a phone layout across the screen, and that the emerald accent and
    focus rings are visible at both themes.

**The empty states** need a database with no active rows, which the preview will not have.
Check them locally instead: archive every producer (or point at an unseeded local
database), open `/record/inbound`, and expect the explanation and a working link to
`/producers/new` rather than a form. Repeat for `/record/outbound` and `/sites/new`.

## CI gate

Every check below must be green before the implementation pull request merges.
`specs/tech-stack.md` § CI/CD makes this a hard requirement. The job names are the real
ones in `.github/workflows/ci.yml`:

- **Commit convention** — the pull request title against Conventional Commits
- **Lint** — ESLint
- **Typecheck** — `tsc --noEmit`
- **Test** — Vitest, carrying everything under Automated above
- **Database** — migrations applied to an empty Postgres, seeded twice, row counts
  unchanged

Phase 5 adds no migration, so **Database** is a regression guard here rather than a check
on new work.

Plus the Vercel preview deployment, which is what the manual pass runs against. There is
no Playwright job to wait on — `specs/roadmap.md` Phase 7 adds it.

## Open questions

None outstanding for validation. The three open questions this phase carries are in
`requirements.md` § Open questions; none of them changes how Phase 5 is proven.

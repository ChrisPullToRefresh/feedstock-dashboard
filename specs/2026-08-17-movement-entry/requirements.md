# Phase 5 — Movement entry — Requirements

**Phase:** 5 in `specs/roadmap.md`
**Scope of this spec:** all five of the phase's roadmap bullets — the inbound form, the
outbound form, weight and counterparty validation, the append-only write, and component
tests over both forms

## Goal

Operators can record feedstock in and out on a phone.

This is the first phase that writes to the `movements` table. Phase 2 built it — the
`Direction` enum, the `Decimal(12, 3)` weight column, the check constraint that requires
exactly the counterparty matching the direction, and the trigger that refuses an UPDATE —
and Phases 3 and 4 filled the two dropdowns this phase reads from. Phase 5 is the surface
on top of them.

## Behavior

**The record surface is three routes.**

- `/record` — a chooser with two large tap targets, **Feedstock in** and **Feedstock out**.
- `/record/inbound` — weight in kilograms, plus a producer chosen from a dropdown.
- `/record/outbound` — weight in kilograms, plus a sequestration site chosen from a
  dropdown.

The nav keeps its single **Record** destination, pointing at `/record`. All three replace
the `PlaceholderPage` standing at `/record` today.

**Both forms are the same component.** They differ in the direction they write, the label
above the dropdown, and which table the options come from. Everything else — the weight
field, the refusals, the pending state, the confirmation — is written once.

**Recording a movement.**

1. The operator picks a counterparty. Nothing is preselected; the dropdown reads
   "Select a producer" or "Select a sequestration site" until they do.
2. The operator enters a weight in kilograms. The field raises a decimal keypad on a
   phone.
3. Tapping Save writes one `movements` row: the direction, the weight, the counterparty
   in the column matching the direction, and `recordedAt` from the database's own clock.
4. The form stays where it is, clears, and a toast says what was recorded — "1,250 kg
   recorded from Acme Farms".
5. The Save button is disabled while the write is in flight, so a double-tap writes once.

**Weights are refused for five reasons**, in the operator's words rather than the
database's: nothing entered, not a number, zero or negative, more than three decimal
places, and above 999,999,999.999 kg. `src/lib/weight.ts` already names these five cases;
this phase gives them messages and a form to appear in.

**A counterparty is required.** A form with no selection does not submit. A form holding a
counterparty that has since been archived, or one that does not exist, is refused by the
Server Action with a message naming what happened and a refreshed list.

**With no active counterparties there is no form.** `/record/inbound` with no active
producers renders an empty state — an explanation and a link to `/producers/new` — rather
than a dropdown with nothing in it. `/record/outbound` does the same against
`/sites/new`.

**Movements cannot be edited.** There is no edit route, no delete control, and no screen
in this phase that lists what was recorded. A mistake is corrected by recording an
adjusting entry — `specs/mission.md` § Constraints.

## Acceptance criteria

- [ ] An inbound movement and an outbound movement recorded on a phone are stored as
      append-only records
- [ ] `/record` renders the two-way chooser, and `/record/inbound` and `/record/outbound`
      render forms — none of the three renders `PlaceholderPage`
- [ ] The inbound form lists active producers only; the outbound form lists active
      sequestration sites only; archived rows appear in neither
- [ ] A weight that is empty, non-numeric, zero, negative, more precise than three decimal
      places, or above 999,999,999.999 is refused with a message naming that specific
      reason
- [ ] A form with no counterparty selected does not submit
- [ ] A submitted counterparty that is archived or unknown is refused by the Server
      Action, not written
- [ ] A successful save clears the form, keeps the operator on it, and announces the
      weight and the counterparty
- [ ] Save is disabled while a write is in flight
- [ ] With no active producers, `/record/inbound` shows an empty state linking to
      `/producers/new`; with no active sites, `/record/outbound` links to `/sites/new`
- [ ] Every stored weight is exact to the gram — no value is rounded between the field and
      the column
- [ ] Both forms are usable one-handed on a real phone

## Out of scope

- **Listing movements, and totals.** `specs/roadmap.md` Phase 6 owns both. Nothing in
  this phase displays a recorded movement after its toast.
- **Editing or deleting a movement.** Append-only, per `specs/mission.md` § Constraints.
- **An operator-entered timestamp.** `recordedAt` comes from the database default. See
  Open questions.
- **Playwright coverage.** `specs/roadmap.md` Phase 7 installs it and makes it a required
  check. `specs/tech-stack.md` § CI/CD records the E2E job as not installed yet.
- **Offline or queued entry.** `specs/mission.md` § Non-goals.
- **Roles.** `specs/tech-stack.md` § Auth: every authenticated user can record movements.

## Constraints inherited from the constitution

- **Kilograms only.** `specs/mission.md` § Constraints. No unit control, no conversion.
- **Movements are append-only.** `specs/mission.md` § Constraints, enforced in the
  database by the trigger Phase 2's migration installed.
- **Mobile-first.** `specs/mission.md` § Constraints and `specs/tech-stack.md`
  § Responsive strategy. The phone layout is the design; desktop widens from it.
- **shadcn/ui for all components.** `specs/tech-stack.md` § Application. `@shadcn/form`
  resolves to an empty stub under this project's `radix-nova` style, so Field is the form
  primitive here — `specs/roadmap.md` Phase 3.
- **Emerald accent, neutral everything else, in both themes.**
  `specs/tech-stack.md` § Application.
- **Server Actions re-validate.** A Server Action is a public endpoint; the browser's copy
  is for speed and the server's is what counts —
  `specs/2026-08-16-sequestration-sites/plan.md` § Decisions.
- **Pages that read the database render per request.**
  `specs/2026-08-16-sequestration-sites/plan.md` § Decisions binds this forward to Phase 5
  explicitly: "Phases 5 and 6 add pages that read the database, and the same prerendering
  applies to them unless they say otherwise."
- **One implementation pull request for the phase.**
  `specs/tech-stack.md` § Branching & pull request workflow.

## Open questions

None outstanding. All three were settled once the implementation existed, and are recorded
struck through rather than deleted so the reasoning stays with the phase that raised them.

- ~~**Whether the entry timestamp needs to be correctable.**~~ No. An editable timestamp
  was specified and then withdrawn before any of it was built, on the ground that the whole
  category is temporary: back-dating exists only because a person is typing after the fact,
  and `specs/roadmap.md` § After v0.1 has a machine reading the scale through the Viam API,
  which records the weighing and its time in the same moment. Building the control now
  means building what that work deletes. `recordedAt` stays the database's `now()`.
- ~~**Whether archived rows ever need a screen.**~~ Not in v0.1 — now deferred work in
  `specs/roadmap.md` § After v0.1. This phase's sharpening of the question is answered in
  the code rather than by a screen: a stale dropdown is refused by name and refreshed,
  which is what an operator holding an archived counterparty actually needs.
- ~~**Whether the detail page earns its place before Phase 6.**~~ It does.
  `specs/roadmap.md` Phase 6 extracts what the two detail pages duplicate rather than
  deleting either.

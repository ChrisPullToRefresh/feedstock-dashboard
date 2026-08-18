# Phase 5 — Movement entry — Plan

Tasks run in order. Every feature task ships with its paired test task in the same
pull request.

The bottom of the stack comes first: the schema, then the queries, then the Server
Actions, then the one form that all three routes render. The form is built before any
route exists, so its component tests fail for reasons in the form rather than reasons in
a page.

| #  | Feature task | Paired test task |
|----|--------------|------------------|
| 1  | `select` added from the shadcn registry under this project's `radix-nova` style, landing at `src/components/ui/select.tsx` | Manual: `validation.md` § Manual step 2 opens the dropdown on a phone and confirms the list is readable and tappable at both themes. It has no behavior of its own to unit-test |
| 2  | `src/lib/movement-data.ts` — the zod schema over an entered weight string carrying all five refusals, the required-counterparty rule, and the form-state type the action returns. Nothing server-only, because the client form imports it | Vitest: `""`, `"abc"`, `"0"`, `"-5"`, `"12.3456"` and `"1000000000"` are each refused with their own message; `"1250"`, `"1250.5"` and `"0.001"` are accepted; `"999999999.999"` is accepted and `"999999999.9991"` is not; a missing counterparty id is refused |
| 3  | `src/lib/movement-queries.ts` — `recordMovement`, writing one row with the counterparty in the column matching the direction, and a lookup that resolves a submitted counterparty id to an *active* producer or site | Manual: `validation.md` § Manual steps 3–8 exercise both writes and the archived-counterparty refusal through the app. No database test harness exists before `specs/roadmap.md` Phase 7 |
| 4  | Server Actions in `src/app/(app)/record/actions.ts` — one per direction, each re-running the task 2 schema, resolving the counterparty through task 3, writing through `recordMovement`, and returning a success state naming the weight and the counterparty | Manual: `validation.md` § Manual steps 3–5 for the success paths, and steps 9, 11 and 12 for the three refusal paths |
| 5  | `src/components/movement-form.tsx` — the one client form both directions render, taking the direction, the counterparty label, the options and the action. Weight on `type="text"` with `inputMode="decimal"`, counterparty on the task 1 Select with no preselection, submit-time validation through the task 2 schema, Save disabled while pending | React Testing Library, every assertion run at both directions: each of the five weight refusals renders its message, submitting with no counterparty selected is refused, a valid entry calls the action with the typed weight and the chosen id, a refusal leaves the typed weight on screen, the button reads "Saving…" and is disabled while pending, and a returned success clears both fields |
| 6  | The success announcement — the form fires the sonner toast from the action's success state and clears, with no navigation | React Testing Library: a success state renders a toast naming the weight and the counterparty, an error state renders none, and the same success state does not re-announce on a later unrelated render |
| 7  | `/record/inbound` and `/record/outbound` — Server Components reading the active producers and the active sites respectively, both `export const dynamic = "force-dynamic"`, each rendering the task 5 form with its own direction, label and action | React Testing Library: each route renders the form with its own counterparty label, passes only active rows as options, and wires its own direction; Vitest asserting both files set `dynamic = "force-dynamic"` |
| 8  | `/record` — the chooser, with **Feedstock in** and **Feedstock out** as two large tap targets, replacing the `PlaceholderPage` standing there today | React Testing Library: both links render with their own labels and hrefs; Vitest asserting `src/app/(app)/record/page.tsx` no longer renders `PlaceholderPage`, and that the shell test's remaining placeholder assertion covers `/` alone |
| 9  | The empty states — `/record/inbound` with no active producers and `/record/outbound` with no active sites render the shadcn `Empty` component with an explanation and a link to `/producers/new` or `/sites/new` instead of the form | React Testing Library at both routes: an empty options list renders the explanation and the create link and renders no weight field; a non-empty list renders the form and no empty state |
| 10 | The archived-counterparty refusal path — a submitted id that no longer resolves to an active row comes back as a message naming it, with the page's option list refreshed | React Testing Library: that error state renders its message on the form, plus `validation.md` § Manual steps 9–10 end to end |

## Decisions

Every entry below answers a question put to the user in the session that wrote this spec.

**The record surface is three routes: a chooser at `/record`, and a form at
`/record/inbound` and `/record/outbound`.**

Direction lives in the URL. That is what lets the post-save behavior stay on a page that
already knows which form it is, and it gives `specs/roadmap.md` Phase 7 two addresses to
link straight into rather than a control it has to click first. The nav keeps its single
**Record** destination from Phase 0.

`/record` redirecting straight to the inbound form, with a link across to outbound, was
offered and declined: it makes outbound permanently one tap further than inbound on a
judgment about relative frequency nobody has data for. A single `/record` page with a
segmented direction toggle was offered and declined — direction would not be in the URL,
so it would need a query parameter anyway to survive a save, which is the two-route shape
wearing a disguise.

The cost accepted: one extra tap to reach either form, on a surface the mission requires
to be fast at a scale.

**The counterparty dropdowns are shadcn/ui's `Select`.**

`specs/tech-stack.md` § Application: "If a UI need has a shadcn component, we use it
rather than hand-rolling one." Radix handles the keyboard and ARIA behavior, and it themes
from this project's tokens in both palettes.

A Tailwind-styled native `<select>` was offered and declined. It is the stronger mobile
answer on its face — phones raise the OS picker, which is easier to hit one-handed than a
custom popover list, and it ships no JavaScript. It was declined because it is a
deliberate exception to a binding rule, made for a form whose lists are five to fifty rows
long. shadcn's `Combobox` was offered and declined as premature: a typeahead search box is
friction while the lists are short, and Phase 6 is where list size becomes visible.

The cost accepted: on a phone the operator gets a custom list rather than the native wheel
picker, and `validation.md` § Manual step 2 exists to check that it is genuinely tappable
before the phase merges.

**A save keeps the operator on the form: the action returns a success state, the form
toasts and clears.**

No navigation at all. `useActionState` receives the success, sonner announces "1,250 kg
recorded from Acme Farms", and the fields empty for the next weighing. A truck is several
weighings, so the next entry is zero taps away.

Redirecting to `/` with a toast was offered and declined: `/` is a `PlaceholderPage` until
Phase 6, so it would send the operator to a screen showing nothing, and ten weighings
would mean ten round trips back. Redirecting back to the same route carrying `?toast=`
parameters — the pattern `src/app/(app)/sites/actions.ts` and `reference-toast.tsx` use —
was offered and declined as a full navigation to land on the page you were already on. An
inline "last recorded" line instead of a toast was offered and declined as a fourth way of
confirming something in an app that has one.

The cost accepted: the shared form grows a success branch, where the reference forms only
ever handle refusals — and the toast is the sole proof a movement saved, since nothing in
this phase lists movements.

**Both directions render one component, `src/components/movement-form.tsx`.**

It takes the direction, the counterparty label, the options and the action. This is what
`specs/roadmap.md` Phase 5 asks for — "sharing structure with the inbound flow where it
makes sense" — and it follows the precedent
`specs/2026-08-16-sequestration-sites/plan.md` § Decisions set with `reference-form.tsx`.

Two mirrored components was offered and declined. It is the choice Phase 4 made for the
*actions* modules, and the reasoning there does not transfer: those mirror because Prisma's
delegates are separate types and a factory would thread generics through the write path.
Here the two forms differ by three props. Shared field pieces composed by two thin
per-direction forms was offered and declined — three files where one does, with the
submit, pending and error handling having nowhere obvious to live.

The cost accepted: the per-direction words sit in props at the call site rather than in the
component, exactly as they do for the four reference screens.

**`recordedAt` is the database's `now()`. There is no timestamp field on the form.**

The column already carries `@default(now())` from Phase 2, and the phase's bullets name
two inputs: a weight and a counterparty.

An editable date and time defaulting to now was offered and declined: a third control on a
form the mission requires to be usable one-handed, plus a picker to build and test, for
work outside every Phase 5 bullet.

The cost is real: a weighing entered an hour after the fact is stamped with entry time,
not scale time, and because movements are append-only, nothing can correct it.

**That cost was reconsidered once the implementation existed, and the decision stands.**
An editable `datetime-local` field was specified in full — empty meaning now, future times
refused, native picker for one-handed use — and withdrawn before any of it was written, on
a better argument than the one that parked it. Manual entry is a v0.1 condition, not the
destination. Back-dating exists only because a person is typing after the fact, and
`specs/roadmap.md` § After v0.1 has a machine reading the scale through the Viam API,
which captures the weight and its time in the same moment. The control would be built now
and deleted by that work, having meanwhile put a third field on a form
`specs/mission.md` binds to one-handed use.

So the question is closed rather than parked, and `requirements.md` § Open questions
records it struck through.

**One zod weight schema, shared by both sides; `Prisma.Decimal` stays on the server.**

`src/lib/movement-data.ts` validates the entered string and carries all five refusals
`src/lib/weight.ts` already names. The browser runs it for immediate feedback; the Server
Action runs the same schema and only then hands the accepted string to `parseWeightKg` for
the exact `Decimal`. One rule in one place, and no decimal library in a phone's bundle.

Importing `parseWeightKg` directly into the client form was offered and declined: it
builds a `Prisma.Decimal`, so it drags the generated Prisma client into the bundle of the
one form that has to load fast in a yard. Server-only validation was offered and declined —
a mistyped weight would cost a round trip at the scale, and it breaks the two-layer pattern
`reference-form.tsx` established.

The cost accepted: the refusal *reasons* now exist in two modules — `weight.ts`'s
`WeightRejection` union and the schema's messages — and task 2's boundary cases are what
keep them agreeing.

**The weight field is `type="text"` with `inputMode="decimal"`.**

Raises the decimal keypad on iOS and Android, with no spinner and no way for an arrow key
or a scroll wheel to change a weight that has already been entered. Every refusal comes
from our own schema, in our own words, in the `FieldError`.

`type="number"` with `step="0.001"` was offered and declined: desktop spinners the
aesthetic does not want, silent mutation by wheel or arrow on a value about to be written
to an append-only table, and the browser's own validation bubble competing with `FieldError`
for the same message.

The cost accepted: nothing stops junk being typed before validation runs.

**The new modules mirror the split Phases 3 and 4 established.**

`src/lib/movement-data.ts` for the client-safe schema and form-state types,
`src/lib/movement-queries.ts` for the reads and the append,
`src/app/(app)/record/actions.ts` for the Server Actions, and
`src/components/movement-form.tsx` for the form. Flat filenames, no feature folder — the
layout `specs/2026-08-14-producers/plan.md` § Decisions chose and Phase 4 kept.

The split is not cosmetic: `src/lib/reference-data.ts` documents why it exists — anything
reaching `db` drags the Postgres driver into the browser bundle, and the client form
imports the schema.

Colocating schema, queries and actions under `src/app/(app)/record/` was offered and
declined: it puts the client-safe schema next to `"use server"` files, which is the exact
adjacency the `src/lib` split makes obvious, and Phase 6's totals would then import from a
route folder. Extending the existing modules — weight rules into `weight.ts`, option lists
onto the two query modules — was offered and declined: `weight.ts` would stop being pure
arithmetic with its own tests, and nothing would describe a movement in one place.

`listActiveProducers` and `listActiveSites` already exist in `producer-queries.ts` and
`site-queries.ts`; the routes read them directly rather than re-exporting them.

**With no active counterparties, the route renders an empty state instead of the form.**

`/record/inbound` with no active producers says so and links to `/producers/new`, using the
shadcn `Empty` component `reference-list.tsx` already renders. `/record/outbound` does the
same against `/sites/new`.

Rendering the form with an empty dropdown was offered and declined: a required control with
nothing in it, no explanation, and nothing to act on — the dead end Phase 4 called out for
archived names. Redirecting to the reference list was offered and declined: tapping Record
and landing on Producers reads as a bug, and it strands anyone arriving from a bookmark.

The cost accepted: a second branch on each route to build and test.

**Nothing is preselected in the counterparty dropdown.**

The Select shows "Select a producer" or "Select a sequestration site" until the operator
chooses, and the form refuses to submit without one — which is what the roadmap's
"require a counterparty" bullet asks for.

Preselecting the first option alphabetically was offered and declined: a distracted
operator would record against whoever sorts first, and the only correction available is a
second, adjusting entry. Remembering the last selection in the browser was offered and
declined — the fewest taps in the real workflow, but it needs client persistence, it goes
stale across shifts, and it carries the same wrong-counterparty risk.

The cost accepted: one tap on every entry, including repeat weighings from the same truck.

**A submitted counterparty that is archived or unknown is refused by the Server Action.**

The action re-reads the id and requires an *active* producer or site, refusing with a
message that names what happened — "Acme Farms has been archived — pick another producer" —
and re-rendering with a refreshed list. A form opened before someone archives a
counterparty still holds that id, and a Server Action is a public endpoint, so this is the
copy that counts.

Accepting it because the row still exists and the foreign key still resolves was offered
and declined: archived counterparties would keep accruing weight in Phase 6's totals from a
dropdown that no longer offers them. No check at all, letting a nonexistent id surface as a
raw Prisma error, was offered and declined — an unhandled exception reaching an operator on
a form they cannot recover without reloading.

The cost accepted: one extra query on every save.

**The screen says "Feedstock in" and "Feedstock out"; the URL and the enum say inbound and
outbound.**

The chooser's two buttons and each form's heading use the plain words; the routes stay
`/record/inbound` and `/record/outbound` and the `Direction` enum is untouched.

"Inbound" and "Outbound" on screen was offered and declined as the system's word rather
than the yard's. "Receive" and "Ship" was offered and declined: a third vocabulary for
something the constitution already names twice, and "ship" is wrong for material going to
a sequestration site.

The cost accepted: the words on screen differ from the URL, which is the trade Phase 4
already made when it kept `/sites` while writing "sequestration site" on the screen.

**The browser validates on submit, not as you type.**

`checkBeforeSubmit` and `preventDefault`, exactly as `src/components/reference-form.tsx`
does it. One validation moment across every form in the app, and no message appears while a
half-typed number is still being typed.

Validating on blur and then live once refused was offered and declined: a second validation
path in the shared form, diverging from every other form in the app. Validating on every
keystroke was offered and declined — "Enter a weight" would flash up the moment the field is
touched and cleared, and a partially typed "12." reads as invalid mid-entry.

The cost accepted: an operator who typed "12.3456" learns it is too precise only after
tapping Save.

**Duplicate protection is the pending flag and nothing more.**

Save is disabled and reads "Saving…" while the action is in flight, which is what
`reference-form.tsx` already does through `useActionState`. That covers the double-tap,
which is the realistic failure at a scale.

Warning on a near-duplicate — same direction, weight and counterparty within some window —
was offered and declined: a confirmation step in the fastest path, a time window nobody can
justify, and an extra tap for a genuine repeat weighing.

Two identical entries a minute apart are still both written, and that is correct: two
trucks can weigh the same.

## Open questions

- ~~**Whether the entry timestamp needs to be correctable.**~~ Settled: no. See the
  addition to § Decisions above, and `requirements.md` § Open questions.
- ~~**Whether archived rows ever need a screen.**~~ Settled: not in v0.1. Answered in
  `requirements.md` § Open questions.
- ~~**Whether the detail page earns its place before Phase 6.**~~ Settled: it does.
  Answered in `requirements.md` § Open questions.

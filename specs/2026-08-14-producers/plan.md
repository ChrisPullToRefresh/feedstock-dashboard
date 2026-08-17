# Phase 3 — Producers — Plan

Tasks run in order. Every feature task ships with its paired test task in the same
pull request.

The middleware fix is task 1 because this phase introduces the first dynamic route, and
`specs/roadmap.md` Phase 3 asks for it "before the first dynamic route exists".

| #  | Feature task | Paired test task |
|----|--------------|------------------|
| 1  | `src/middleware.ts` matcher narrowed to Clerk's documented form, excluding a named extension list rather than any path segment containing a dot | Vitest test over `config.matcher`: `/producers/acme.co` and `/producers/acme` are matched, `/favicon.ico` and a `/_next/static/…` asset are skipped |
| 2  | A case-insensitive unique index on `producers.name`, hand-written as `CREATE UNIQUE INDEX … ON producers (lower(name))` in a checked-in migration | Vitest test reading the checked-in migration SQL and asserting the index is still there — the guard the counterparty check constraint already uses. The task also records, in this file, whether `prisma migrate diff` reports the index as drift |
| 3  | `src/lib/producers.ts` exporting the zod schema for a producer name: required, trimmed, 1–100 characters — and nothing server-only, because the client form imports it | Vitest tests: empty, whitespace-only, and 101-character names are rejected; a padded name parses to its trimmed value; a 100-character name is accepted |
| 4  | `src/lib/producer-queries.ts` query helpers — list active producers by name, find one by id, find one by case-insensitive name | Manual: `validation.md` § Manual steps 2–9 exercise every helper through the app. No database test harness exists before `specs/roadmap.md` Phase 7 |
| 5  | Server Actions in `src/app/(app)/producers/actions.ts` to create, rename, archive and restore a producer, each re-validating with the task 3 schema | Manual: `validation.md` § Manual steps 2–9, plus the rejection paths in steps 10–11 |
| 6  | `src/components/producer-form.tsx` — one form used by both create and edit, built on shadcn/ui's Field: `@shadcn/form` is an empty stub under this project's `radix-nova` style, so the shared zod schema validates directly rather than through react-hook-form | React Testing Library tests: an empty name is refused, a whitespace-only name is refused, a 101-character name is refused, and a valid name submits |
| 7  | `/producers` list — active producers only, ordered by name, stacked rows on mobile and a shadcn/ui Table at desktop width, with an empty state that links to the create form | React Testing Library tests: producers render in name order, an archived producer is absent, and an empty list renders the explanation and the create link |
| 8  | `/producers/new` and `/producers/[id]/edit`, both rendering the task 6 form | React Testing Library tests: the create route renders an empty field, the edit route renders the producer's current name |
| 9  | `/producers/[id]` detail page showing the producer with Edit and Archive controls | React Testing Library test: the page renders the producer's name and both controls |
| 10 | Archive behind a shadcn/ui confirmation dialog naming the producer and saying what archiving does | React Testing Library tests: confirming invokes the archive action, dismissing does not |
| 11 | The restore path — creating a producer whose name matches an archived one offers to restore it instead of failing | React Testing Library test: when the action reports the collision, the form renders the restore offer rather than a bare error |
| 12 | A toast on successful create, rename, archive and restore, with the provider added to the app shell | Manual: `validation.md` § Manual steps 2, 4, 6 and 9 each name the toast they expect |
| 13 | The `/producers` placeholder replaced by the real list, and `PlaceholderPage` left in place for the routes that still use it | Vitest test asserting `src/app/(app)/producers/page.tsx` no longer renders `PlaceholderPage`, and the existing shell test still passes for `/record` and `/sites` |

## Decisions

Every entry below answers a question put to the user in the session that wrote this spec.

**Mutations go through Server Actions.**

Forms post to server functions rather than to a hand-built API. This is the App Router
idiom in the Next version `specs/tech-stack.md` pins, it needs no endpoint to secure or
version, and revalidation after a write is built in.

Route Handlers with client `fetch` were rejected as more code per surface — hand-rolled
loading and error states — paid again by Phases 4, 5 and 6. Starting with actions and
extracting an API later was rejected as deferring the choice rather than making it, since
those phases will have copied the pattern by the time anyone revisits it.

The cost accepted: a Server Action is invoked by framework convention rather than an
explicit HTTP contract, so exercising one outside the app is harder. That is also why
task 5's paired verification is manual rather than automated.

**Create and edit are dedicated routes, not dialogs.**

`/producers` lists, `/producers/new` creates, `/producers/[id]` shows one, and
`/producers/[id]/edit` renames it. Deep-linkable, back-button friendly, and a full screen
suits a phone better than a modal. `specs/roadmap.md` Phase 3 already names
`/producers/[id]` in its middleware bullet, so the roadmap assumes this shape.

Dialogs on the list page were rejected because they are cramped on the phone that
`specs/mission.md` makes the primary design target — and because with no dynamic route
the middleware bullet loses the trigger the roadmap wrote it for. A hybrid, creating
inline and editing on its own route, was rejected as two interaction models for one form.

**The list shows active producers only, and no screen lists archived ones.**

Archiving removes a producer from the app's surfaces entirely, not just from Phase 5's
dropdown.

An active-by-default list with a toggle revealing archived rows was offered and declined,
as was one list with archived rows badged and muted.

The cost accepted, and it is the sharpest trade in this phase: a producer archived by
mistake cannot be found again by browsing. The only route back is the restore path in the
next decision, which requires knowing the name. `requirements.md` § Open questions carries
this.

**A name that collides with an archived producer offers to restore it.**

`specs/2026-08-13-schema-and-migrations/plan.md` § Open questions parked "whether an
archived name should free itself for reuse" until there was a screen. This is the screen,
and the answer is that the name stays taken and the archived producer comes back instead,
movement history attached.

This exists because of the decision above. With archived producers unreachable, refusing
the name — whether the message names the conflict or not — leaves the user in a dead end:
told they cannot use a name, shown a list that does not contain it, and given nothing to
act on. Both refusal options were offered and declined for that reason.

Freeing the name by renaming the archived row on archive was rejected outright: it
rewrites data an operator entered, and `specs/mission.md` § Constraints keeps archived
records intact and resolvable.

The cost accepted: restoring is reachable only by typing a name you cannot see, which is
a poor discovery path for anyone who does not already know the producer existed.

**One zod schema, enforced in the browser and again in the Server Action.**

A Server Action is a public endpoint — anything that can reach the app can invoke one —
so the server copy is the one that counts and the client copy is for fast feedback.

Client-only validation with database constraints as the backstop was rejected because a
crafted request would write whatever the column type permits, and the user would see raw
constraint errors. Server-only validation was rejected because every keystroke-level
mistake would cost a round trip, on the one-handed-at-the-scale screen the design is
built around.

The cost accepted: the schema has to stay framework-agnostic enough to run in both
places.

**Producer names are unique regardless of case, enforced by an expression index.**

Phase 2 shipped `@unique` on `name`, which is case-sensitive, so `Cascade Timber Mill`
and `cascade timber mill` could both exist. `specs/roadmap.md` Phase 6 groups totals by
producer and Phase 5 puts producers in a dropdown, so two spellings of one producer would
split the numbers and mislead the operator.

A migration adds `CREATE UNIQUE INDEX … ON producers (lower(name))`, hand-written like
the counterparty check constraint, and guarded the same way by a test that reads the
checked-in SQL.

The `citext` column type was offered and declined: it would keep the constraint visible
to Prisma and remove the drift risk, at the cost of enabling a Postgres extension that
Prisma 7 gates behind an experimental config flag. A normalized lowercase companion
column was offered and declined as a second column to keep in step on every write, where
a wrong write silently permits a duplicate.

The cost accepted: the index is invisible to `prisma/schema.prisma`, so only the guard
test stands between a migration regenerated from the schema and a lost constraint.

Task 2 settled the drift question it was given. `prisma migrate diff` reports **no
drift** in either direction against a database carrying the index — Prisma ignores an
expression index the same way it ignores the check constraint and the trigger. So no
routine command will try to drop it, and the guard test covers the remaining case:
someone recreating the migration history from the schema.

**A producer name is required, trimmed, and 1–100 characters.**

Trimming happens before validation and before storage, so `" Acme "` and `"Acme"` cannot
become two rows that look identical on screen. The bound keeps the list and Phase 5's
dropdown readable on a phone.

No length limit was rejected because nothing would stop a pasted paragraph becoming a
producer that then renders in a dropdown. Storing exactly as typed was rejected because
trailing spaces defeat the unique constraint while looking identical.

The cost accepted: a name longer than 100 characters is refused, which no real producer
name should reach.

**Archiving asks for confirmation first.**

An Archive control opens a shadcn/ui confirmation dialog naming the producer and saying
what archiving does. Nothing else in v0.1 removes anything, and given that archived
producers are unreachable afterwards, archiving is effectively irreversible from inside
the app — which is when a confirm step earns its place.

Immediate archiving with an undo window was rejected because the undo would need an
unarchive path that the archived-rows decision otherwise rules out. Immediate archiving
with no confirmation was rejected because a misclick would permanently remove a producer
from the app.

**A successful write returns to the list and confirms with a toast.**

Redirecting alone was rejected because archiving would look identical to a failed click —
the row is gone either way — and a rename is easy to miss in a long list. Staying on the
form with an inline confirmation was rejected as an extra tap per producer with no
obvious sign the list changed.

The cost accepted: the toast component and a client-side provider are added to the app
shell.

**The list is ordered by name, with an empty state.**

Alphabetical, so an operator can find a producer by scanning, matching how Phase 5's
dropdown will be read. Newest-first was rejected because the order changes meaning as the
list grows. Shipping no empty state was rejected because the first thing a new operator
sees would be a blank screen.

**The list stacks on mobile and becomes a table on desktop.**

One shadcn/ui Table at desktop width; below the breakpoint the same data stacks into
tappable rows with the actions reachable by thumb. This follows the app shell's existing
pattern of one design widened rather than two designs built.

A single table at every width was rejected because reaching an Archive control would mean
horizontal scrolling, which is exactly the one-handed case `specs/mission.md` rules out.
Stacked rows at every width were rejected as wasting the desktop space managers reviewing
a long list would rather see filled.

The cost accepted: two presentations of the same list to keep in step.

**Files follow the repository's existing flat layout.**

Server Actions in `src/app/(app)/producers/actions.ts`, next to the routes that use them;
the zod schema in `src/lib/producers.ts`; the Prisma queries in
`src/lib/producer-queries.ts`; the shared form in `src/components/producer-form.tsx`.
Consistent with `navigation.ts`, `routes.ts`, `weight.ts` and the flat components already
in `src/components/`.

The schema and the queries were specified as one file and had to be split during
implementation. The form is a client component and imports the schema, so a single module
pulled `db.ts` and the Postgres driver into the browser bundle and the build failed on
`Can't resolve 'dns'`. Tests did not catch it — Vitest resolves Node modules happily — and
only `next build` did. Keeping one file was possible only by dropping client-side
validation or duplicating the rules, and both were offered and declined, because each
undoes the one-schema-on-both-sides decision above.

The cost accepted: two modules where the plan named one, and a rule that is invisible
until it is broken — anything importing `db` must stay out of `producers.ts`.

A `src/features/producers/` folder was offered and declined as a second organising
principle alongside the flat layout the repository already uses. Putting everything in
the route folder was rejected because Phase 4 needs the same shapes for sequestration
sites, and shared code would have to move anyway.

**A producer has a detail page.**

`/producers/[id]` shows the producer with Edit and Archive on it, and the list links
through. It shows one field today; it exists because `specs/roadmap.md` Phase 6 will want
somewhere to hang a producer's movements and totals.

Shipping only the list and the edit form was offered and declined.

The cost accepted: an extra screen and an extra tap now, displaying a single field, on a
guess about what Phase 6 wants. `requirements.md` § Open questions carries that.

## Open questions

- ~~**Whether the expression index reads as drift to Prisma.**~~ Answered by task 2: it
  does not, in either direction. Recorded in § Decisions.
- **Whether archived producers ever need a screen.** Carried in `requirements.md`
  § Open questions.
- **Whether the detail page earns its place before Phase 6.** Carried in
  `requirements.md` § Open questions.

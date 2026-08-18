# Phase 3 — Producers — Validation

## Automated

### Unit and component (Vitest + React Testing Library)

Nothing in this section touches a database. No database test harness exists before
`specs/roadmap.md` Phase 7, which is why the Server Actions and query helpers are proven
by the manual pass below rather than here.

**Route protection** (`src/proxy.ts`) — a test over `config.matcher`, which nothing
asserts today:

- `/producers/acme.co` is matched, so the middleware runs and protects it. This is the
  hole `specs/roadmap.md` Phase 3 measured at 200 with page content against `/producers/acme`
  at 307
- `/producers/acme` is still matched
- `/favicon.ico` is still skipped
- A `/_next/static/…` asset is still skipped

**Producer schema** (`src/lib/producers.ts`):

- An empty name is rejected
- A whitespace-only name is rejected
- A 101-character name is rejected
- A 100-character name is accepted
- A padded name parses to its trimmed value

**Migration shape** — a test reading the checked-in migration and asserting the
case-insensitive unique index on `lower(name)` is still present. Prisma cannot express an
expression index, so nothing regenerates it; this is the same guard the counterparty
check constraint uses. It asserts the SQL is present, not that it works — manual step 10
proves the behavior.

**The producer form** (`src/components/producer-form.tsx`):

- An empty name is refused
- A whitespace-only name is refused
- A 101-character name is refused
- A valid name submits
- When the action reports a collision with an archived producer, the form renders the
  restore offer rather than a bare error

**The producers list**:

- Producers render in name order
- An archived producer does not appear
- An empty list renders the explanation and the create link

**The routes**:

- `/producers/new` renders the form with an empty name field
- `/producers/[id]/edit` renders the form with the producer's current name
- `/producers/[id]` renders the producer's name with Edit and Archive controls
- `/producers` no longer renders `PlaceholderPage`

**The archive confirmation**:

- Confirming invokes the archive action
- Dismissing the dialog does not

### End-to-end (Playwright)

Not applicable. `specs/roadmap.md` Phase 7 installs Playwright and makes it a required
check; this phase predates it. The manual steps below are what prove the **Done when**
line until then.

## Manual

Run against this pull request's Vercel preview deployment, signed in, **on a real phone
and again on a desktop browser**. `specs/mission.md` § Constraints makes one-handed phone
use binding, so a desktop-only pass does not prove this phase.

Record which device each step was run on.

1. **The list replaces the placeholder.** Open `/producers`. It shows the seeded
   producers ordered by name — `Blue Mountain Forestry` first, `Willamette Orchard
   Cooperative` last — not the "Arrives in Phase 3" placeholder. On the phone the rows are
   stacked and every control is reachable with one thumb; on desktop the same data is a
   table.
2. **Create a producer.** Tap Create, enter `Aspen Ridge Timber`, submit. You return to
   the list, a toast confirms the creation, and `Aspen Ridge Timber` appears first in the
   list because it sorts before `Blue Mountain Forestry`.
3. **An empty name is refused.** Open the create form, submit with the field empty. The
   form refuses it and says why. Nothing is created — the list is unchanged behind it.
4. **Rename a producer.** Open `Aspen Ridge Timber`, choose Edit, change the name to
   `Aspen Ridge Timber Co`, submit. You return to the list, a toast confirms the change,
   and the new name is in place.
5. **A name is stored trimmed.** Create a producer named `  Larch Hollow  ` with leading
   and trailing spaces. It is stored as `Larch Hollow` and sorts under L, not under a
   space.
6. **Archive asks first.** Open `Larch Hollow`, choose Archive. A dialog names the
   producer and says what archiving does. Dismiss it — the producer is still in the list.
   Choose Archive again and confirm. You return to the list, a toast confirms it, and
   `Larch Hollow` is gone from the list.
7. **The archived producer is unreachable.** There is no screen anywhere in the app that
   lists archived producers, and no filter or toggle reveals `Larch Hollow`.
8. **The archived row still exists.** In the Neon console's SQL Editor against the
   preview branch, `SELECT name, is_active FROM producers WHERE name = 'Larch Hollow';`
   returns one row with `is_active` false. Nothing deleted it.
9. **A colliding name offers to restore.** Create a producer named `larch hollow` — the
   same name in different case. The form says the name belongs to an archived producer and
   offers to restore it. Accept. You return to the list, a toast confirms the restore, and
   `Larch Hollow` is back with its original name and casing.
10. **Case-insensitive uniqueness holds at the database.** In the SQL Editor, run
    `INSERT INTO producers (id, name, updated_at) VALUES ('t1', 'LARCH HOLLOW', now());`.
    Postgres refuses it with a unique violation naming the `lower(name)` index. No
    application surface attempts this, so the SQL Editor is the only place it can be
    proven.
11. **A dotted path is protected.** In a private window, signed out, open
    `/producers/acme.co` on the preview deployment. You are redirected to sign in. Before
    this phase it returned 200 with page content. Confirm `/producers/acme` also redirects,
    and that the app's styling and icons still load when signed in — proof the matcher did
    not over-correct and start sending Next's build output through Clerk.
12. **Clean up.** Archive `Aspen Ridge Timber Co` and `Larch Hollow`, and delete the
    `t1` row if step 10 somehow created it.

## CI gate

These GitHub Actions checks must be green before the implementation pull request merges,
and are required on `main` — `specs/tech-stack.md` § CI/CD:

- `Commit convention`
- `Lint`
- `Typecheck`
- `Test`
- `Database`

The `Vercel` deployment check must also be green, which is what produces the preview the
manual steps run against.

This phase adds no CI job. `Database` already applies every checked-in migration to an
empty database on each pull request, so the task 2 migration is covered by the job that
exists.

## Open questions

- **Whether the expression index reads as drift to Prisma.** Carried in `plan.md`
  § Open questions; task 2 answers it and records the answer there.
- **Nothing automated covers the Server Actions.** Steps 2 to 9 prove them by hand, once.
  `specs/roadmap.md` Phase 7's Playwright suite is what covers these flows per pull
  request, and it is the phase that should pick this up.

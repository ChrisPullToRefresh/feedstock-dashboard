# Tech Stack

Decisions below are binding for v0.1. See `specs/mission.md` for scope and
`specs/roadmap.md` for the order this gets built in.

## Application

- **Framework:** Next.js, App Router, latest stable.
- **Language:** TypeScript, strict mode.
- **Styling:** Tailwind CSS. We will never write a raw CSS file. Styling lives in
  Tailwind classes and in the shadcn/ui theme tokens.
- **Components:** shadcn/ui for all components. If a UI need has a shadcn component, we
  use it rather than hand-rolling one. One exception, and it does not generalise: Clerk's
  own `<SignIn />` renders the sign-in surface, because authentication is a protocol
  rather than a widget and rebuilding those flows is where it goes subtly wrong. It is
  themed through Clerk's `appearance` prop from this project's tokens. Everything else
  around authentication — the sign-out control included — is shadcn. See
  `specs/2026-08-13-auth/plan.md` § Decisions for the full reasoning.
- **Icons:** lucide-react, which ships with shadcn/ui.
- **Font:** Inter, loaded from Google Fonts via `next/font`. Chosen for legibility on
  phones and for tabular numerals, so columns of weights align.
- **Accent color:** Emerald. This is the only accent. Every other surface, border, and
  text color is neutral gray. The shade differs by theme so both clear WCAG AA:
  `emerald-700` in light with white on it (5.37:1), `emerald-500` in dark with near-black
  on it (8.03:1). `emerald-600` is not used for text or for fills under text — it
  measures 3.67:1 on white, below AA's 4.5:1 — and is reserved for non-text roles such as
  focus rings and borders, where the bar is 3:1. Phase 0 shipped `emerald-600`
  throughout; Phase 1 replaced it with the pair above and left it on the focus rings
  alone.
- **Accent hover:** `emerald-800` in light (7.61:1 with white on it), `emerald-400` in
  dark (10.21:1 with near-black on it), carried by `--primary-hover`. Hover moves the
  fill away from the background — darker in light, lighter in dark. An alpha fill such as
  `bg-primary/80` washes toward the background instead, which measured 3.72:1 under a
  white label and failed AA.
- **Theme:** light and dark, chosen by the operating system through
  `prefers-color-scheme`. v0.1 has no in-app toggle and stores no per-user preference, so
  there is nothing to persist and no flash of the wrong palette to guard against. Both
  palettes are the same neutral grays and the same single accent; only the shade differs,
  per the accent entry above. Every color decision has to hold in both, which is why the
  accent is specified as a pair.
- **Aesthetic:** clean and minimal, consistent spacing, generous whitespace, Tailwind's
  default type scale, rounded corners, subtle shadows.
- **Responsive strategy:** mobile-first. Movement entry is designed for a phone at the
  scale; desktop layouts are widened from that, never the reverse.

## Data

- **Database:** Neon Postgres, provisioned through the Vercel Marketplace so connection
  environment variables are wired into the project automatically.
- **ORM:** Prisma. The schema lives in `prisma/schema.prisma` and is the single source of
  truth for the data model.
- **Migrations:** Prisma Migrate. Every schema change ships as a checked-in migration.
  We will not edit the database by hand.
- **Units:** weights are stored in kilograms. See the constraint in
  `specs/mission.md`.
- **Immutability:** movement records are append-only. Producers and sequestration sites
  are editable.

## Auth

v0.1 has real authentication. Internal staff only — no external producer or
sequestration-site logins.

- **Provider:** Clerk, using its Next.js middleware to gate the app.
- **User provisioning:** via the Clerk Backend API — `npm run provision -- <email>`.
  Accounts are created deliberately by someone with access to the Clerk instance, and
  there is no self-service sign-up, which is what internal-staff-only access
  (`specs/mission.md` § Non-goals) requires. Clerk's invitation flow is not used and has
  not been tried on this application; adopting it later would be a fresh decision rather
  than the resumption of one.
- **Roles:** not modeled in v0.1. Every authenticated user can record movements and
  manage reference data.

## Hosting & deployment

- **Host:** Vercel, under the company-owned Vercel team.
- **Preview deploys:** every pull request gets a Vercel preview deployment.
- **Production:** deploys from `main` after a PR merges.
- **Note for agents:** Vercel, GitHub, and the browser-automation Chrome profile are all
  the same account — `chris@pulltorefresh.team`. Preview deployments are SSO-protected, so
  `curl` gets Vercel's login wall, but a signed-in browser reaches them. Verify previews
  in the browser or via the Vercel CLI. An earlier version of this file said the accounts
  were separate and ruled out browser automation; that was imported from another project
  and is no longer true here.

## Testing

- **Unit and component tests:** Vitest with React Testing Library.
- **E2E tests:** Playwright, with full coverage in v0.1 — every page, both movement entry
  flows, both CRUD surfaces, and validation paths. At least one E2E run exercises a
  mobile viewport, because mobile field entry is a binding constraint.
- **Coverage enforcement:** none. Tests must pass; there is no numeric coverage
  threshold and CI will not fail on a percentage.
- **Test data:** E2E runs against an ephemeral or preview database, never production.

## CI/CD

- **Runner:** GitHub Actions.
- **On every pull request, CI runs:**
  1. Lint — ESLint
  2. Typecheck — `tsc --noEmit`
  3. Unit and component tests — Vitest
  4. E2E tests — Playwright. Not installed yet: `specs/roadmap.md` Phase 7 adds the suite
     and makes the job a required check. Until then the workflow runs the other four.
  5. Commit convention — the pull request title is checked against Conventional Commits.
     The title is what the squash merge writes onto `main`, so it is the thing worth
     gating; branch commits are squashed away and are not checked.
- **Merge gate:** green CI is a hard requirement. A pull request with any failing check
  does not merge, including a failing E2E job.
- **Build:** Vercel builds each PR as a preview deployment alongside the Actions run.

## Branching & pull request workflow

> Work is never committed directly to `main`.

- **Branch naming:** the roadmap phase number plus a short kebab-case description,
  e.g. `2-schema-and-migrations`. Every branch traces to a numbered phase in
  `specs/roadmap.md`.
- **Pull requests:** every change goes through a pull request. No exceptions, including
  documentation and configuration edits.
- **Scope:** one pull request per phase. Every phase in `specs/roadmap.md` ships as
  exactly one pull request — never two phases in one, and never one phase split across
  two. A phase whose pull request is too large to review is a phase that was drawn too
  large; the fix is to split the phase in `specs/roadmap.md`, not to split its pull
  request. This keeps a phase's **Done when** line provable in one place, and keeps the
  branch, the spec folder, and the pull request in one-to-one correspondence.
- **Review:** AI review first — run `/code-review` on the branch and address its findings
  — then the author self-merges. No second human approver is required.
- **Merge style:** squash merge. `main`'s history is one commit per shipped pull request.
- **Commit format:** Conventional Commits 1.0.0. Every commit message and **every pull
  request title** is `<type>(<scope>): <subject>`.
  - **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`,
    `chore`, `revert`. Anything that changes app behavior is `feat` or `fix`; everything
    else describes the kind of work, not its importance.
  - **Scope:** optional, lower case, naming the area touched — `shell`, `auth`, `schema`,
    `movements`, `ci`. Omit it rather than invent one.
  - **Subject:** imperative mood, lower case, no trailing period, 72 characters or fewer.
    "add the inbound movement form", not "added" or "adds".
  - **Breaking changes:** a `!` before the colon and a `BREAKING CHANGE:` footer
    explaining the migration.
  - **Trailers:** keep the `Co-Authored-By` trailer on agent-written commits.
  - Pull request titles carry the same weight as commit messages because the repository
    squashes with `PR_TITLE` as the commit subject and `PR_BODY` as the body. The title
    you write is the message that lands on `main` and stays there; the per-commit messages
    on the branch are squashed away. Write the pull request body as the commit body you
    want in the history, not as notes to the reviewer.
- **Branch protection:** enabled on `main`. Direct pushes are blocked and passing CI
  checks are required.
- **Cleanup:** merged branches are deleted automatically on the remote. Locally, expect
  `git branch -d` to refuse: a squash merge replays the branch as one new commit, so the
  branch's own commits are never ancestors of `main` and the safety check cannot see them.
  Confirm nothing is lost first with `git diff <branch> main --stat`, which must come back
  empty, then delete with `git branch -D`. Never reach for `-D` without that diff — it
  skips the check that just fired.

## Open questions

None outstanding for the tech stack.

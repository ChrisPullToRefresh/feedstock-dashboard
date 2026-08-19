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
  text color is neutral gray, apart from the destructive red below. The shade differs by
  theme so both clear WCAG AA:
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
- **Destructive color:** red, and the only non-neutral besides the accent. It marks the
  one irreversible control in v0.1 — archiving. Like the accent it is a theme-dependent
  pair on a solid fill, carried by `--destructive` and `--destructive-foreground`: white
  on the light red (4.76:1), near-black on the dark red (6.84:1). White in dark measures
  2.89:1 and is not used. A tinted fill under the label — `bg-destructive/10` — is not
  used either: it measured 4.39:1 in light and 3.16:1 in dark, below AA's 4.5:1.
- **Destructive hover:** `--destructive-hover`, darker in light (6.42:1 with white on it)
  and lighter in dark (8.50:1 with near-black on it), moving the fill away from the
  background exactly as the accent hover does.
- **Field border:** `--input`, the boundary of a text input and a select trigger.
  Both render `bg-transparent` in light, so the border is the only thing marking where
  the control is, and WCAG 2.1 SC 1.4.11 puts that at 3:1. Light is `oklch(0.65 0 0)`
  (3.23:1 on the background); dark keeps `oklch(1 0 0 / 15%)`, which already measured
  3.82:1. It is deliberately darker than `--border`, which the two shared until a
  critique measured the pair at 1.26:1 — `--border` rules table rows and separators,
  which carry no information the criterion covers, and stays where it is.
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
  truth for the data model. Connection URLs and the seed command live in
  `prisma.config.ts` rather than in the schema, and the client is constructed with the
  `pg` driver adapter — both are Prisma 7 requirements. See
  `specs/2026-08-13-schema-and-migrations/plan.md` § Decisions.
- **Migrations:** Prisma Migrate. Every schema change ships as a checked-in migration.
  We will not edit the database by hand.
- **Units:** weights are stored in kilograms. See the constraint in
  `specs/mission.md`.
- **Immutability:** movement records are append-only. Producers and sequestration sites
  are editable, and archived rather than deleted — deletion is soft everywhere, so no row
  a movement references can be removed.

## Auth

v0.1 has real authentication. Internal staff only — no external producer or
sequestration-site logins.

- **Provider:** Clerk, gating the app from `src/proxy.ts`, Next's proxy file convention.
- **User provisioning:** via the Clerk Backend API — `npm run provision -- <email>`.
  Accounts are created deliberately by someone with access to the Clerk instance, and
  there is no self-service sign-up, which is what internal-staff-only access
  (`specs/mission.md` § Non-goals) requires.
- **Roles:** not modeled in v0.1. Every authenticated user can record movements and
  manage reference data.

## Hosting & deployment

- **Host:** Vercel, under the company-owned Vercel team.
- **Preview deploys:** every pull request gets a Vercel preview deployment.
- **Production:** deploys from `main` after a PR merges.
- **Note for agents:** Vercel, GitHub, and the browser-automation Chrome profile are all
  the same account — `chris@pulltorefresh.team`. Preview deployments are SSO-protected, so
  `curl` gets Vercel's login wall, but a signed-in browser reaches them. Verify previews
  in the browser or via the Vercel CLI.

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
  1. Lint — ESLint, then Prettier in `--check` mode. One job, because
     `eslint-config-prettier` switches off every rule Prettier owns, so ESLint
     deliberately checks no formatting and something has to.
  2. Typecheck — `tsc --noEmit`
  3. Unit and component tests — Vitest
  4. E2E tests — Playwright. The full suite, in a desktop and a mobile Chromium project,
     against a `postgres:17` service container that is empty at the start of every run.
     Playwright's global setup applies the migrations, seeds the reference data and signs
     in the dedicated CI account over a Backend API ticket, so the local run and the CI
     run take one path. See `specs/2026-08-18-end-to-end-coverage/`.
  5. Commit convention — the pull request title is checked against Conventional Commits.
     The title is what the squash merge writes onto `main`, so it is the thing worth
     gating; branch commits are squashed away and are not checked.
  6. Database — applies every checked-in migration to an empty Postgres service
     container, seeds it twice, fails if the row counts moved, and inserts a movement to
     require the append-only trigger to refuse both an UPDATE and a DELETE. That last
     assertion is the one no search over the migration SQL can make.
- **Merge gate:** green CI is a hard requirement. A pull request with any failing check
  does not merge, including a failing E2E job.
- **Build:** Vercel builds each PR as a preview deployment alongside the Actions run.

## Branching & pull request workflow

> Work is never committed directly to `main`.

- **Branch naming:** phase work is the roadmap phase number plus a short kebab-case
  description, e.g. `2-schema-and-migrations`. Work that implements no roadmap bullet —
  corrections to shipped phases, agent skills, tooling, dependency bumps — is
  `maint-<short-kebab-description>`, e.g. `maint-branch-naming`. The number is the audit
  trail, so never borrow one for work that does not belong to that phase.
- **Pull requests:** every change goes through a pull request. No exceptions, including
  documentation and configuration edits.
- **Scope:** a phase ships in two pull requests — its spec, then its implementation.

  The **spec** pull request is what `/feature-spec` opens: the dated
  `specs/YYYY-MM-DD-<feature-name>/` folder and nothing else. It is reviewed and merged on
  its own, before any application code is written, so the plan is settled in `main` before
  the work starts.

  The **implementation** pull request is the one the one-per-phase rule governs. Every
  phase in `specs/roadmap.md` implements in exactly one pull request — never two phases in
  one, and never one phase's implementation split across two. A phase whose implementation
  is too large to review is a phase that was drawn too large; the fix is to split the phase
  in `specs/roadmap.md`, not to split the pull request. This keeps a phase's **Done when**
  line provable in one place.

  Both use the same phase-numbered branch name, so the branch, the spec folder, and the
  phase stay in correspondence — the spec branch is deleted on merge and the
  implementation branches from `main` under the same name.

  A maintenance pull request traces to no phase and does not consume a phase's
  implementation pull request. It must not carry phase work: a change that implements a
  roadmap bullet belongs in that phase's implementation. If maintenance keeps accumulating
  feature work, that work belongs on the roadmap as a phase.
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
  branch's own commits are never ancestors of `main`. Confirm the merge from the pull
  request — after `git fetch --prune` the local branch reads `[origin/<branch>: gone]` —
  then delete with `git branch -D`. Do not diff against `main` to check this: it compares
  tips, so it is non-empty for any branch older than the last merge.

  The branch's Neon database branch is pruned in the same pass. Vercel's Neon integration
  creates one per preview deployment as a required step, and deleting the git branch does
  not take it with it. They accumulate silently against the Free plan's cap, and the
  symptom lands on an unrelated pull request: the next new branch's first preview fails
  before the build starts, with "Branch limit reached" and no build log, which reads as a
  broken pull request rather than a full database. Phase 5's spec branch is where this
  first bit. `.claude/skills/pr-merged-branch-deleted/prune-neon-branch.sh <git-branch>`
  deletes it, over a project-scoped `NEON_API_KEY` in `.env.local`; it refuses the default
  and protected branches, so it cannot take `main` — that is production — and it matches
  the git branch's own name or Vercel's `preview/` form of it, never a loose substring.

## Open questions

None outstanding for the tech stack.

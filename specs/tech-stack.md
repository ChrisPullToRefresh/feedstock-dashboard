# Tech Stack

Decisions below are binding for v0.1. See `specs/mission.md` for scope and
`specs/roadmap.md` for the order this gets built in.

## Application

- **Framework:** Next.js, App Router, latest stable.
- **Language:** TypeScript, strict mode.
- **Styling:** Tailwind CSS. We will never write a raw CSS file. Styling lives in
  Tailwind classes and in the shadcn/ui theme tokens.
- **Components:** shadcn/ui for all components. If a UI need has a shadcn component, we
  use it rather than hand-rolling one.
- **Icons:** lucide-react, which ships with shadcn/ui.
- **Font:** Inter, loaded from Google Fonts via `next/font`. Chosen for legibility on
  phones and for tabular numerals, so columns of weights align.
- **Accent color:** Emerald (Tailwind `emerald-600`). This is the only accent. Every
  other surface, border, and text color is neutral gray.
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
- **User provisioning:** via the Clerk Backend API. Clerk's invitation flow is currently
  broken for this account and a support ticket is open, so we will not depend on
  invitations until that is resolved.
- **Roles:** not modeled in v0.1. Every authenticated user can record movements and
  manage reference data.

## Hosting & deployment

- **Host:** Vercel, under the company-owned Vercel team.
- **Preview deploys:** every pull request gets a Vercel preview deployment.
- **Production:** deploys from `main` after a PR merges.
- **Note for agents:** the Vercel account and the browser-automation Chrome profile are
  different accounts, so preview deployments cannot be verified via browser automation.
  Verify previews manually or via the Vercel CLI.

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
  4. E2E tests — Playwright
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
- **Scope:** a phase may take several pull requests. Keep each one to a coherent slice of
  a single phase — never span two phases in one pull request.
- **Review:** AI review first — run `/code-review` on the branch and address its findings
  — then the author self-merges. No second human approver is required.
- **Merge style:** squash merge. `main`'s history is one commit per shipped pull request.
- **Branch protection:** enabled on `main`. Direct pushes are blocked and passing CI
  checks are required.
- **Cleanup:** merged branches are deleted automatically.

## Open questions

None outstanding for the tech stack.

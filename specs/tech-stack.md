# Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Application framework | Next.js (React, TypeScript) | Full-stack React framework with strong responsive/mobile support, fitting VISION.md's requirement that the app be mobile-friendly for both field data entry and mobile-primary data analysis. |
| Database | Neon (Postgres, on Vercel) | Relational store for feedstock suppliers, sequestration sites, and weight transactions; supports the mass-balance/yield-style reporting implied by tying incoming and outgoing weights together. Pairs natively with Vercel hosting. |
| Hosting | Vercel | Native deploy target for Next.js; integrates directly with Neon for the database. |
| Auth | Clerk, with roles stored in per-user metadata (not Clerk Organizations) | Individual accounts with roles (e.g. scale operator vs. admin) give auditability of who recorded each transaction, and support the future need to manage feedstock supplier/site creation separately from day-to-day entry. |
| Unit/component testing | Vitest + React Testing Library | Fast, native ESM/TypeScript support with minimal config against the Next.js App Router; RTL exercises component behavior (e.g. entry forms) rather than implementation detail. |
| End-to-end testing | Playwright | Cross-browser with real mobile-viewport emulation, first-class GitHub Actions support, and parallel runs — matches mission.md's mobile-first field entry flows better than the alternatives. |
| CI/CD | GitHub Actions | Runs on every PR: lint + typecheck, unit/component tests, E2E tests, and a production build (`next build`), so every feature ships with automated coverage rather than relying on manual QA alone. Deploys via Vercel's native GitHub integration on merge to `main`. |
| Commit conventions | Conventional Commits, enforced by commitlint | Consistent, machine-readable commit history (`type(scope): summary`) that's cheap to lint automatically, both locally and in CI. |

## Testing & CI/CD Practices

- **Every feature is tested.** Each functional item in a phase's checklist gets at least a
  unit/component test; anything user-facing (a page, a form, a workflow) also gets a
  Playwright E2E test covering the primary flow.
- **Required PR checks (GitHub Actions):** lint + typecheck, unit/component tests, E2E
  tests, production build, and commit-message lint (see Commit Message Conventions below).
  All five must be green before merge.
- **Merge gate:** all CI checks green **and** at least one review approval. No merging on
  green CI alone.
- **PRs are opened as drafts** and marked ready for review only once the GitHub Actions
  run is green and the PR description's test plan is filled in.
- **Workflow practices:** cache dependencies (`actions/setup-node` with `cache: npm`/`pnpm`),
  use a concurrency group per-PR to cancel superseded runs, pin action versions, and keep
  secrets (e.g. Neon/Clerk test credentials) in repo/environment secrets — never hard-coded
  in the workflow file.

## Commit Message Conventions

- **Format:** [Conventional Commits](https://www.conventionalcommits.org/) —
  `type(scope): summary`, imperative mood, summary line ≤72 characters. Allowed types:
  `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `ci`, `build`, `perf`. Scope is
  optional but encouraged for clarity (e.g. `feat(auth): add Clerk sign-in flow`).
- **Enforcement — both layers, not just one:**
  - **Locally:** a Husky `commit-msg` hook runs `commitlint` (with
    `@commitlint/config-conventional`) on every commit, so malformed messages are rejected
    before they exist in history.
  - **In CI:** GitHub Actions re-lints the PR's full commit range as a required check —
    catches commits made with `--no-verify`, from a machine without the hook installed, or
    edited/added through GitHub's web UI, none of which the local hook can see.
- **Rationale:** a consistent, machine-readable history is cheap to lint and stays useful
  as the project grows (e.g. changelog generation later), and checking it in both places
  means the local hook is a fast-fail convenience, not the only line of defense.

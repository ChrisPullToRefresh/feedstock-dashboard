# Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Application framework | Next.js (React, TypeScript) | Full-stack React framework with strong responsive/mobile support, fitting VISION.md's requirement that the app be mobile-friendly for both field data entry and mobile-primary data analysis. |
| Database | Neon (Postgres, on Vercel) | Relational store for producers, sequestration sites, and weight transactions; supports the mass-balance/yield-style reporting implied by tying incoming and outgoing weights together. Pairs natively with Vercel hosting. |
| Hosting | Vercel | Native deploy target for Next.js; integrates directly with Neon for the database. |
| Auth | Clerk with role-based access control (RBAC) | Individual accounts with roles (e.g. scale operator vs. admin) give auditability of who recorded each transaction, and support the future need to manage producer/site creation separately from day-to-day entry. |
| Unit/component testing | Vitest + React Testing Library | Fast, native ESM/TypeScript support with minimal config against the Next.js App Router; RTL exercises component behavior (e.g. entry forms) rather than implementation detail. |
| End-to-end testing | Playwright | Cross-browser with real mobile-viewport emulation, first-class GitHub Actions support, and parallel runs — matches mission.md's mobile-first field entry flows better than the alternatives. |
| CI/CD | GitHub Actions | Runs on every PR: lint + typecheck, unit/component tests, E2E tests, and a production build (`next build`), so every feature ships with automated coverage rather than relying on manual QA alone. Deploys via Vercel's native GitHub integration on merge to `main`. |

## Testing & CI/CD Practices

- **Every feature is tested.** Each functional item in a phase's checklist gets at least a
  unit/component test; anything user-facing (a page, a form, a workflow) also gets a
  Playwright E2E test covering the primary flow.
- **Required PR checks (GitHub Actions):** lint + typecheck, unit/component tests, E2E
  tests, and production build. All four must be green before merge.
- **Merge gate:** all CI checks green **and** at least one review approval. No merging on
  green CI alone.
- **PRs are opened as drafts** and marked ready for review only once the GitHub Actions
  run is green and the PR description's test plan is filled in.
- **Workflow practices:** cache dependencies (`actions/setup-node` with `cache: npm`/`pnpm`),
  use a concurrency group per-PR to cancel superseded runs, pin action versions, and keep
  secrets (e.g. Neon/Clerk test credentials) in repo/environment secrets — never hard-coded
  in the workflow file.

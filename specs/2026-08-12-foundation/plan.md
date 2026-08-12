# Phase 0 — Foundation — Plan

Tasks run in order. Every feature task ships with its paired test task in the same
pull request.

The test runner lands at task 3, earlier than its position in the roadmap's bullet list,
so that every task after it can be paired with a real automated test rather than a
manual check. The roadmap fixes what Phase 0 contains, not the order it is built in.

| #  | Feature task | Paired test task |
|----|--------------|------------------|
| 1  | Next.js App Router project scaffolded with TypeScript in strict mode | Manual: `npx tsc --noEmit` exits zero and `tsconfig.json` sets `"strict": true` |
| 2  | ESLint and Prettier configured, with `lint` and `typecheck` npm scripts | Manual: `npm run lint` and `npm run typecheck` both exit zero, and a deliberately introduced lint violation makes `npm run lint` exit non-zero |
| 3  | Vitest and React Testing Library configured, with a `test` npm script | A sanity test that renders a trivial component and asserts on its output, proving both the runner and RTL work |
| 4  | Tailwind CSS installed and shadcn/ui initialized, with the Button component added | RTL test rendering the shadcn Button and asserting it applies its variant classes |
| 5  | Inter loaded via `next/font` and applied document-wide from the root layout | Unit test asserting the root layout applies the Inter font class to the document body |
| 6  | shadcn/ui theme set to a neutral gray palette with `emerald-600` as the single accent | Manual: open the shell in a browser and confirm every surface, border, and text color is neutral gray and the only non-neutral color is `emerald-600` |
| 7  | App shell with a fixed bottom tab bar on mobile widening to a persistent left sidebar on desktop | RTL test asserting the shell renders each navigation destination exactly once, each with an accessible name |
| 8  | GitHub Actions workflow running lint, typecheck, and Vitest on every pull request | Manual: this pull request shows all three jobs running, and a temporary commit containing a failing test turns the run red |
| 9  | Branch protection on `main` requiring the CI checks, with auto-delete of merged branches | Manual: a direct `git push origin main` is rejected, the merge button is disabled while checks are red, and a merged branch disappears from the branch list |
| 10 | Repository connected to the Vercel team, with per-pull-request preview deployments | Manual: this pull request shows a Vercel preview URL, and opening it renders the app shell — verified by hand or the Vercel CLI, never by browser automation (see `specs/tech-stack.md` § Hosting & deployment) |

## Decisions

**App shell navigation: bottom tab bar on mobile, left sidebar on desktop.**

`specs/mission.md` makes one-handed phone use at the scale a binding constraint, and a
fixed bottom tab bar puts every destination in the thumb zone. The desktop layout widens
that same set of destinations into a persistent left sidebar, which keeps the responsive
direction mobile-first as `specs/tech-stack.md` requires.

The alternatives were a top header with a hamburger drawer, and shadcn/ui's sidebar
component collapsed off-canvas on mobile. Both were rejected for the same reason: they
put primary navigation in the top corner, the weakest reach zone one-handed, and the
second inverts the mobile-first strategy by deriving the phone layout from the desktop
one.

The cost accepted: two navigation renderings to keep in sync, and a fixed bottom bar that
later phases' forms must not collide with.

## Open questions

- **Which Vercel team.** `specs/tech-stack.md` says the company-owned Vercel team, but
  the Vercel account in use for this work is a personal one. Confirm the target team
  before task 10 connects the repository, since moving a project between teams after
  environment variables are wired is disruptive.
- **Bottom bar clearance on forms.** The fixed bottom tab bar will sit over the bottom of
  scrolled pages. The padding and safe-area inset that keep it clear of Phase 4's submit
  buttons are not decided here; Phase 4 owns that once real forms exist.

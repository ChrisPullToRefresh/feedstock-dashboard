# Phase 0 — Foundation — Requirements

**Phase:** 0 in `specs/roadmap.md`
**Scope of this spec:** all eight of Phase 0's roadmap bullets, in one pull request.
Nothing is deferred to a follow-up spec. Phase 0's **Done when** condition requires the
CI workflow, the Vercel preview deployment, and branch protection to be in place
together, so splitting the phase would leave it unprovable until a second pull request.

## Goal

A deployed, themed, empty Next.js app with CI gating every pull request.

There is no feature work in this phase. The deliverable is the scaffold every later
phase builds inside: the project, the theme, the app shell, the test runner, the CI
workflow, the merge gate, and the Vercel connection.

## Behavior

**The app shell.** A visitor to the deployed app sees an empty but themed application
shell — Inter type, neutral gray surfaces, `emerald-600` as the only accent. Navigation
is present and reachable but its destinations are placeholders; the pages behind them
arrive in Phases 3 to 6.

On a phone, navigation is a fixed bottom tab bar, within thumb reach. On desktop, the
same destinations render as a persistent left sidebar. See `## Decisions` in `plan.md`
for why.

**The pull request gate.** Opening a pull request against `main` starts a GitHub Actions
run that lints, typechecks, and runs the Vitest suite, and starts a Vercel preview
deployment. A pull request whose Actions run is red cannot be merged. A commit pushed
directly to `main` is rejected.

**Nothing else.** No database, no auth, no data entry. Those are Phases 1, 2, and 5.

## Acceptance criteria

- [ ] A pull request to `main` runs lint, typecheck, and unit tests in GitHub Actions,
      gets a Vercel preview deployment, and cannot merge while red.
- [ ] `npm run lint`, `npm run typecheck`, and `npm run test` each exist and pass on a
      clean checkout.
- [ ] TypeScript runs in strict mode and `tsc --noEmit` reports no errors.
- [ ] The app builds and serves an app shell with no runtime or hydration errors in the
      browser console.
- [ ] Inter is loaded through `next/font` and applied to the whole document.
- [ ] The shadcn/ui theme uses a neutral gray palette, and `emerald-600` is the only
      accent color anywhere in the shell.
- [ ] At a phone viewport the shell renders a bottom tab bar; at a desktop viewport it
      renders a left sidebar; the same navigation destinations appear in both.
- [ ] A deliberately broken commit — a lint error, a type error, or a failing test —
      turns the pull request red and blocks the merge button.
- [ ] Direct pushes to `main` are rejected by branch protection.
- [ ] Merged branches are deleted automatically.
- [ ] The repository is connected to the company-owned Vercel team and the pull request
      shows a preview deployment URL.

## Out of scope

- Playwright and any E2E test. `specs/roadmap.md` places Playwright in Phase 7, and
  Phase 0's CI workflow runs lint, typecheck, and unit tests only.
- Clerk, authentication, and route protection — Phase 1.
- Neon, Prisma, and any schema — Phase 2.
- Producer and sequestration site pages — Phases 3 and 4.
- Movement forms, the movement table, and totals — Phases 5 and 6.
- Promoting `main` to a production Vercel deployment — Phase 8.
- Real navigation destinations. The shell's nav points at placeholders until Phases 3 to 6
  and 4 fill them in.

## Constraints inherited from the constitution

- Next.js App Router, latest stable, TypeScript in strict mode
  (`specs/tech-stack.md` § Application).
- Tailwind CSS only. No raw CSS file is ever written; styling lives in Tailwind classes
  and shadcn/ui theme tokens (`specs/tech-stack.md` § Application).
- shadcn/ui for all components. If a UI need has a shadcn component, we use it rather
  than hand-rolling one (`specs/tech-stack.md` § Application).
- Icons come from lucide-react (`specs/tech-stack.md` § Application).
- Inter via `next/font`; `emerald-600` is the single accent, everything else neutral gray
  (`specs/tech-stack.md` § Application).
- Mobile-first responsive strategy. Desktop layouts are widened from the mobile design,
  never the reverse (`specs/tech-stack.md` § Application, `specs/mission.md` §
  Constraints).
- Vitest with React Testing Library for unit and component tests. No coverage threshold
  (`specs/tech-stack.md` § Testing).
- GitHub Actions runs lint, typecheck, and unit tests on every pull request; green CI is
  a hard merge requirement (`specs/tech-stack.md` § CI/CD).
- Vercel under the company-owned Vercel team, with a preview deployment per pull request
  (`specs/tech-stack.md` § Hosting & deployment).
- Work is never committed directly to `main`; branches are the phase number plus a short
  kebab-case description (`specs/tech-stack.md` § Branching & pull request workflow).
- Preview deployments are SSO-protected: `curl` receives Vercel's login wall, while a
  signed-in browser and the Vercel CLI reach them
  (`specs/tech-stack.md` § Hosting & deployment).

## Open questions

None. All three questions this spec was built from were answered in session, and the
constitution settles the rest.

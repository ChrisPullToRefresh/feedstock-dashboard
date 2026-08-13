# Phase 0 — Foundation — Validation

## Automated

### Unit and component (Vitest + React Testing Library)

Four automated tests, matching tasks 3, 4, 5, and 7 in `plan.md`:

1. **Runner sanity.** Renders a trivial component and asserts on its output. Its only
   job is to prove Vitest and React Testing Library both execute, in the terminal and in
   GitHub Actions. Without this, a CI run that silently discovers no tests looks green.
2. **shadcn/ui is wired.** Renders the shadcn Button and asserts it applies its variant
   classes, proving Tailwind and the shadcn theme tokens reach rendered components.
3. **Root layout applies Inter.** Asserts the `next/font` Inter class lands on the
   document body.
4. **App shell navigation.** Asserts the shell renders each navigation destination
   exactly once, each with an accessible name.

No coverage threshold. `specs/tech-stack.md` § Testing sets none, and CI will not fail on
a percentage.

Breakpoint behavior is deliberately **not** asserted in jsdom. A test there can only
check class names, not real layout, so the mobile-versus-desktop rendering is verified
by hand below instead.

## Manual

Run these against the pull request's Vercel preview deployment, not `localhost`. Per
`specs/tech-stack.md` § Hosting & deployment, the Vercel account and the
browser-automation Chrome profile are different accounts, so every step here is done by
a person or via the Vercel CLI — never by browser automation.

1. Open the pull request on GitHub. **Expect:** a Vercel preview deployment with a URL,
   and a GitHub Actions run listing a lint job, a typecheck job, and a test job.
2. Open the preview URL on a phone, held in one hand. **Expect:** the app shell renders,
   with a fixed tab bar across the bottom of the screen.
3. Reach every tab in the bottom bar using only the thumb of the hand holding the phone.
   **Expect:** every destination is reachable without shifting grip.
4. Scroll the page to its bottom. **Expect:** the bottom tab bar stays fixed and does not
   cover page content or sit under the phone's home indicator.
5. Open the same preview URL on a desktop browser at full width. **Expect:** a persistent
   left sidebar carrying the same destinations as the mobile tab bar, and no bottom bar.
6. Narrow the desktop browser window to a phone width. **Expect:** the sidebar gives way
   to the bottom tab bar, with no layout break in between.
7. Look at the shell on both devices. **Expect:** Inter throughout, neutral gray
   surfaces, borders, and text, and `emerald-600` as the only non-neutral color.
8. Open the browser console on the preview. **Expect:** no errors and no hydration
   warnings.
9. Push a commit to this branch that breaks the build in one of three ways — a lint
   violation, a type error, or a failing test. **Expect:** the corresponding Actions job
   turns red and the merge button is disabled. Revert the commit afterwards.
10. From a clean checkout of `main`, attempt `git push origin main`. **Expect:** the push
    is rejected by branch protection.
11. After this pull request merges, check the branch list. **Expect:** `0-foundation` has
    been deleted automatically.

Steps 9, 10, and 11 are what actually prove the roadmap's **Done when** line. Steps 10
and 11 can only be run once branch protection is configured in task 9.

## CI gate

**No workflow files exist in `.github/workflows/` today.** This phase is the one that
creates them, so the merge gate for this pull request is the gate it installs on itself.
The jobs the workflow must define, from `specs/tech-stack.md` § CI/CD, are:

1. **Lint** — ESLint
2. **Typecheck** — `tsc --noEmit`
3. **Test** — Vitest

All three must be green, and all three must be marked as required checks in `main`'s
branch protection, before this pull request leaves draft.

Playwright is the fourth job `specs/tech-stack.md` requires, but `specs/roadmap.md`
places it in Phase 7. It is not part of this gate and no E2E check is claimed here.

The Vercel preview deployment must also succeed. It runs alongside the Actions run and
is not one of its jobs.

**Since shipped:** `.github/workflows/ci.yml` defines those three jobs, and Lint,
Typecheck, and Test are required checks in `main`'s branch protection.

## Open questions

None beyond the two parked in `plan.md` § Open questions, neither of which changes how
this phase is validated.

# Validation: Phase 1 — Foundation & Auth

## Success criteria (roadmap.md)

A logged-in user can reach an empty authenticated shell of the app on both
mobile and desktop, and a PR against `main` runs the full CI pipeline
(lint, typecheck, unit tests, E2E tests, build, commit-message lint)
automatically and must pass before merge.

## Merge gates (tech-stack.md, required verbatim)

- [ ] Lint + typecheck check green
- [ ] Unit/component tests (Vitest + React Testing Library) check green
- [ ] E2E tests (Playwright) check green
- [ ] Production build (`next build`) check green
- [ ] Commit-message lint (commitlint, Conventional Commits) check green
- [ ] At least one review approval (CI green alone is not sufficient to
      merge)

## Automated coverage checklist

- [x] Vitest smoke test passes (Group 2 tooling proof)
- [x] Playwright smoke test passes (Group 2 tooling proof)
- [x] Database connection module unit test passes (Group 3)
- [x] Auth middleware unit test passes: signed-out → redirected to sign-in,
      signed-in → allowed through (Group 4)
- [x] Auth E2E test passes: unauthenticated → sign-in redirect → sign in →
      authenticated shell (Group 4)
- [x] No-public-sign-up E2E test passes: `/sign-up` redirects unauthenticated
      visitors to sign-in and 404s for signed-in users (Group 4)
- [x] Layout/nav shell component test passes (Group 5)
- [x] Shell E2E test passes at both mobile-viewport and desktop-viewport
      Playwright device profiles (Group 5)
- [x] Commitlint config test passes: accepts well-formed Conventional
      Commits messages, rejects malformed ones (Group 6)
- [x] Husky `commit-msg` hook blocks a malformed commit locally (Group 6,
      manual/local check — not something CI can observe about itself)
- [ ] GitHub Actions commit-message lint check is green on this phase's PR
      commit range (Group 6)

## Manual verification (this phase's validation answer)

- [ ] **Vercel preview review (Group 5):** open the actual deployed Vercel
      preview URL for the PR (not just localhost/CI) and confirm sign-in
      and the empty shell work against the real deployment — catches
      deploy/env misconfiguration (e.g. Clerk redirect URLs, Neon
      connection string) that localhost-based automated tests can't.
      Deferred to Group 5: there's no shell to review yet, only the
      default Next.js starter page behind sign-in — not required to land
      or mark ready any PR that covers Group 4 alone.
- [ ] **Real mobile-device check:** open the Vercel preview URL on an
      actual phone/tablet and confirm sign-in and the shell render and
      behave correctly, in addition to Playwright's emulated mobile
      viewport — mission.md's primary persona works one-handed on a real
      device in the field, not in a browser's device emulator.

## Ready-for-review criteria

Per tech-stack.md: the PR stays in draft until all merge gates above are
green and this validation checklist's automated coverage is filled in with
actual results, then it's marked ready for review.

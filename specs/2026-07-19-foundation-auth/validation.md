# Validation: Phase 1 — Foundation & Auth

## Success criteria (roadmap.md)

A logged-in user can reach an empty authenticated shell of the app on both
mobile and desktop, and a PR against `main` runs the full CI pipeline
(lint, typecheck, unit tests, E2E tests, build) automatically and must pass
before merge.

## Merge gates (tech-stack.md, required verbatim)

- [ ] Lint + typecheck check green
- [ ] Unit/component tests (Vitest + React Testing Library) check green
- [ ] E2E tests (Playwright) check green
- [ ] Production build (`next build`) check green
- [ ] At least one review approval (CI green alone is not sufficient to
      merge)

## Automated coverage checklist

- [x] Vitest smoke test passes (Group 2 tooling proof)
- [x] Playwright smoke test passes (Group 2 tooling proof)
- [ ] Database connection module unit test passes (Group 3)
- [ ] Auth middleware unit test passes: signed-out → redirected to sign-in,
      signed-in → allowed through (Group 4)
- [ ] Auth E2E test passes: unauthenticated → sign-in redirect → sign in →
      authenticated shell (Group 4)
- [ ] Layout/nav shell component test passes (Group 5)
- [ ] Shell E2E test passes at both mobile-viewport and desktop-viewport
      Playwright device profiles (Group 5)

## Manual verification (this phase's validation answer)

- [ ] **Vercel preview review:** open the actual deployed Vercel preview
      URL for the PR (not just localhost/CI) and confirm sign-in and the
      empty shell work against the real deployment — catches deploy/env
      misconfiguration (e.g. Clerk redirect URLs, Neon connection string)
      that localhost-based automated tests can't.
- [ ] **Real mobile-device check:** open the Vercel preview URL on an
      actual phone/tablet and confirm sign-in and the shell render and
      behave correctly, in addition to Playwright's emulated mobile
      viewport — mission.md's primary persona works one-handed on a real
      device in the field, not in a browser's device emulator.

## Ready-for-review criteria

Per tech-stack.md: the PR stays in draft until all merge gates above are
green and this validation checklist's automated coverage is filled in with
actual results, then it's marked ready for review.

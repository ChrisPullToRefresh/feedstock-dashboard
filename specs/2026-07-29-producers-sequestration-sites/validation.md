# Validation: Phase 2 — Producers & Sequestration Sites

## Success criteria (roadmap.md)

An admin can create and view feedstock producers and sequestration sites, which then
populate dropdown lists. (Per requirements.md's Key Decisions: "admin" here describes the
expected user in practice — Phase 2 doesn't technically gate these pages to the admin role,
since that enforcement is deferred to Phase 4.)

## Merge gates (tech-stack.md, required verbatim)

Per tech-stack.md, these apply to every PR. Following Phase 1's precedent, this phase is
expected to ship as one PR per task group rather than a single PR spanning the whole phase,
so each PR is independently required to satisfy all gates below before merging:

- Lint + typecheck check green
- Unit/component tests (Vitest + React Testing Library) check green
- E2E tests (Playwright) check green
- Production build (`next build`) check green
- Commit-message lint (commitlint, Conventional Commits) check green
- At least one review approval (CI green alone is not sufficient to merge)

## Automated coverage checklist

- [x] Producer data-access unit tests pass: `create` and `list` (Group 1)
- [x] Sequestration site data-access unit tests pass: `create` and `list` (Group 1)
- [x] Producer creation form component test passes (Group 2)
- [x] Producer list view component test passes (Group 2)
- [x] Producer E2E test passes: create a producer via the form, confirm it appears on the
      list view (Group 2)
- [ ] Sequestration site creation form component test passes (Group 3)
- [ ] Sequestration site list view component test passes (Group 3)
- [ ] Sequestration site E2E test passes: create a site via the form, confirm it appears on
      the list view (Group 3)

## Manual verification

Per this spec's validation answer: none beyond the merge gates above. Unlike Phase 1's
Clerk/shell work, this phase doesn't touch auth config or deployment-sensitive env wiring,
so no additional manual Vercel-preview or real-device check is required before marking a PR
ready for review.

## Ready-for-review criteria

Per tech-stack.md: each of this phase's PRs stays in draft until all merge gates above are
green for that PR and this validation checklist's automated coverage for the task group(s)
it covers is filled in with actual results, then it's marked ready for review.

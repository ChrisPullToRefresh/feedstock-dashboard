# Validation: Phase 3 — Weight Recording

These gates belong to the **implementation PR(s)** that build this phase's task groups, not
to this spec PR. This spec PR only adds markdown under `specs/` — there is no code yet for
lint, typecheck, unit tests, E2E tests, or a production build to run against.

## Success criteria (roadmap.md)

A scale operator can record an incoming or outgoing weight transaction end-to-end from a
mobile device in under a few taps.

## Merge gates (tech-stack.md, required verbatim)

Per tech-stack.md, these apply to every PR. Following Phase 1 and Phase 2's precedent, this
phase is expected to ship as one PR per task group, so each PR is independently required to
satisfy all gates below before merging:

- Lint + typecheck check green
- Unit/component tests (Vitest + React Testing Library) check green
- E2E tests (Playwright) check green
- Production build (`next build`) check green
- Commit-message lint (commitlint, Conventional Commits) check green
- At least one review approval (CI green alone is not sufficient to merge)

## Automated coverage checklist

To be checked off as each task group's implementation lands:

- [x] Transactions data-access unit tests pass: `create` (both directions) and `list` (Group 1)
- [x] Transaction history view component test passes: renders both directions correctly, plus
      empty state (Group 2)
- [x] Transaction history E2E test passes: seeded `'in'` and `'out'` transactions both render
      correctly (Group 2)
- [x] Incoming-entry form component test passes: producer dropdown renders, baseline
      validation rejects bad input (Group 3)
- [x] Incoming-entry E2E test passes: submitted entry appears on the transaction history view
      (Group 3)
- [ ] Outgoing-entry form component test passes: site dropdown renders, baseline validation
      rejects bad input (Group 4)
- [ ] Outgoing-entry E2E test passes: submitted entry appears on the transaction history view
      (Group 4)

## Manual verification

Per this spec's validation answer — beyond the merge gates above, this phase also requires:

- [ ] **Real-device entry-speed spot-check:** on an actual phone (not just Playwright's
      emulated mobile viewport), record one incoming and one outgoing transaction end-to-end
      and confirm the flow is fast/low-friction per roadmap.md's stated success criterion
      ("under a few taps") — Playwright's emulated viewport proves layout and functional
      correctness but not real-device feel (touch target size, numeric keyboard behavior,
      perceived speed). This is a lighter, entry-speed-focused check, distinct from Phase 4's
      later "Basic QA pass across core flows on real mobile devices," which is a comprehensive
      pass across all core flows and remains Phase 4's responsibility, not this phase's.

## Ready-for-review criteria

Per tech-stack.md: each of this phase's implementation PRs stays in draft until all merge
gates above are green for that PR and this validation checklist's automated coverage for the
task group(s) it covers is filled in with actual results, then it's marked ready for review.

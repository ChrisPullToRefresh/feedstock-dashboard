# Validation: Phase 4 — Mobile Polish & Version 1.0

These gates belong to the **implementation PR(s)** that build this phase's task groups, not
to this spec PR. This spec PR only adds markdown under `specs/` — there is no code yet for
lint, typecheck, unit tests, E2E tests, or a production build to run against.

## Success criteria (roadmap.md)

Facility staff can reliably use the app in the field for day-to-day intake and outflow
recording. This marks version 1.0.

## Merge gates (tech-stack.md, required verbatim)

Per tech-stack.md, these apply to every PR. Following Phases 1–3's precedent, this phase is
expected to ship as one PR per task group, so each PR is independently required to satisfy
all gates below before merging:

- Lint + typecheck check green
- Unit/component tests (Vitest + React Testing Library) check green
- E2E tests (Playwright) check green
- Production build (`next build`) check green
- Commit-message lint (commitlint, Conventional Commits) check green
- At least one review approval (CI green alone is not sufficient to merge)

## Automated coverage checklist

To be checked off as each task group's implementation lands:

- [ ] `getUserRole()` unit test passes: returns the header's role, `undefined` when missing
      (Group 1)
- [ ] Role-gating E2E test passes: admin reaches `/producers/new` and `/sites/new` and can
      submit; operator is redirected away from both (Group 1)
- [ ] Per-form component tests pass: field-level errors render against the correct field,
      zero/negative weight rejected, submit failure surfaces a message (Group 2, all four
      forms)
- [ ] Extended E2E specs pass: `producers.spec.ts`, `sites.spec.ts`, `incoming-entry.spec.ts`,
      `outgoing-entry.spec.ts` each confirm inline field-error display on invalid input
      (Group 2)
- [ ] `Shell` nav component test passes: reworked structure renders correct roles/labels, all
      five destination links present and correctly `href`-ed (Group 3)
- [ ] Mobile nav E2E test passes on the `Mobile Chrome` project: toggle (if added)
      opens/closes, every destination reachable (Group 3)

## Manual verification

Per this spec's validation answer — beyond the merge gates and automated coverage above,
this phase requires a real-device QA checklist (Group 4), executed on an actual phone rather
than Playwright's emulated mobile viewport, covering every core flow now shipped:

- [ ] Create a feedstock producer, signed in as the admin test account
- [ ] Create a sequestration site, signed in as the admin test account
- [ ] Confirm a non-admin (operator) account is redirected away from both `/producers/new`
      and `/sites/new`
- [ ] Record an incoming feedstock transaction end-to-end
- [ ] Record an outgoing processed feedstock transaction end-to-end
- [ ] View the transaction history and confirm both recorded entries appear correctly
- [ ] Confirm the reworked mobile nav (Group 3) is usable one-handed throughout the above —
      touch targets, numeric keyboard behavior, and nav reachability all feel field-usable,
      not just functionally correct

This supersedes Phase 3's narrower single-flow entry-speed spot-check with the comprehensive
pass roadmap.md's Phase 4 item explicitly calls for.

## Ready-for-review criteria

Per tech-stack.md: each of this phase's implementation PRs stays in draft until all merge
gates above are green for that PR and this validation checklist's automated coverage for the
task group(s) it covers is filled in with actual results, then it's marked ready for review.
Group 4's PR (if it is its own PR) additionally stays in draft until the manual verification
checklist above is fully checked.

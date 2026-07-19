---
name: feature-spec
description: Scaffold the spec for the next unstarted phase on the roadmap — reads specs/roadmap.md, specs/mission.md, and specs/tech-stack.md, then asks exactly 3 grouped questions (scope, key decisions, validation) via AskUserQuestion before writing anything. Creates a branch and specs/YYYY-MM-DD-feature-name/{requirements,plan,validation}.md, ensures every feature task pairs with a test task, commits, pushes, and opens a draft PR gated on the project's GitHub Actions CI checks. Use only when called directly.
user-invocable: true
---

# feature-spec

Turns the next unstarted phase on `specs/roadmap.md` into a spec folder: a branch plus
`requirements.md`, `plan.md`, and `validation.md` under `specs/YYYY-MM-DD-feature-name/`,
committed and opened as a draft PR. `specs/mission.md` and `specs/tech-stack.md` inform the
advice given (users, constraints, framework/infra choices) but the roadmap phase drives what
gets speced.

**Hard rule: never call Write on any spec file, create a branch, or touch git until
AskUserQuestion has been called once with exactly 3 questions — scope, key decisions,
validation — and the answers are folded into the drafts.** Don't guess at scope or
tradeoffs the phase's checklist leaves open; ask instead. This applies even if the roadmap
phase looks self-explanatory.

## Workflow

1. **Read the constitution.** Load `specs/roadmap.md`, `specs/mission.md`, and
   `specs/tech-stack.md`. If any is missing, tell the user and stop rather than inventing
   content — suggest running `create-constitution` first.

2. **Determine the next phase.** Scan `specs/roadmap.md` top to bottom for the first
   `## Phase N: <name>` section that still has at least one unchecked `- [ ]` item. That's
   the target phase. If every phase is fully checked, tell the user the roadmap looks
   complete and ask whether to pull the next item from `## Later (Not Yet Scheduled)`
   instead of silently picking one.

3. **Check for a prior spec on this phase.** Slugify the phase name (strip the `Phase N:`
   prefix, lowercase, hyphenate — e.g. "Foundation & Auth" → `foundation-auth`) and look for
   an existing `specs/*-<slug>/` folder. If one exists, tell the user and ask whether this is
   a refresh (read the existing files and treat answers as updates) or a deliberate re-spec,
   rather than silently overwriting.

4. **Check git state.** Run `git status`. If there are uncommitted changes, surface them and
   ask how to proceed (stash, commit first, abort) rather than branching over them. Confirm
   the working tree is on an up-to-date base (typically `main`) before branching.

5. **Ask exactly 3 questions in one AskUserQuestion call**, one per topic, options grounded
   in the specific phase content (its checklist items, success criteria, and anything
   `mission.md`/`tech-stack.md` implies) rather than generic placeholders:
   - **Scope** — which of the phase's checklist items are in for this spec, and what's
     explicitly deferred. If the phase checklist maps cleanly to items, offer them as
     options (multiSelect) plus an "all of the above" framing; otherwise ask the
     in/out boundary directly.
   - **Key decisions** — the real tradeoff(s) this phase forces given `tech-stack.md` (e.g.
     which library, how to model a relationship, sync vs. async, how strict validation
     should be). Ground options in the actual stack choices already recorded, don't invent
     new tech.
   - **Validation** — how success will be verified and what "ready to merge" means (e.g.
     automated tests, manual QA on a real device per `mission.md`'s field-use context,
     preview deployment review, specific success criteria from the roadmap phase).

   Do not proceed past this step without answers.

6. **Create the branch and folder.**
   - Branch name: `spec/YYYY-MM-DD-<slug>` using today's actual date.
   - Folder: `specs/YYYY-MM-DD-<slug>/` (same date/slug).
   - `git checkout -b` the branch before writing files.

7. **Write the three files**, built from the answers (never from assumptions the user
   wasn't asked about):
   - **requirements.md** — phase name and goal (from roadmap), scope in/out (from the
     scope answer), key decisions and their rationale (from the decisions answer), and
     context pulled from `mission.md` (why this matters to the primary persona) and
     `tech-stack.md` (relevant constraints).
   - **plan.md** — numbered task groups covering the in-scope checklist items, sequenced
     sensibly (e.g. data model before UI before polish), each group naming the relevant
     stack piece (Next.js route, Neon migration, Clerk role check, etc.) where applicable.
     **Every feature task group must pair with a test task**, per `tech-stack.md`'s Testing
     & CI/CD Practices: a Vitest + React Testing Library unit/component test for the unit,
     and — if the task is user-facing (a page, a form, a workflow) — a Playwright E2E test
     covering its primary flow. A task group with no corresponding test task is incomplete;
     don't write one. If the phase itself is the one standing up the test/CI tooling (per
     roadmap.md, e.g. Phase 1), sequence that setup as task group 1 so later groups' test
     tasks have something to run against.
   - **validation.md** — a checklist of how to verify the implementation can be merged,
     built from the validation answer plus the phase's stated "Success criteria" line from
     roadmap.md. Always include, verbatim as merge gates (from `tech-stack.md`): all four
     required GitHub Actions checks (lint + typecheck, unit/component tests, E2E tests,
     production build) green, plus at least one review approval before merge. Add any
     phase-specific manual verification (e.g. real-device QA) on top of, not instead of,
     these gates.

8. **Commit, push, open a draft PR.**
   - `git add` the new spec folder only.
   - Commit message summarizing the phase being speced.
   - Push with `-u` to origin.
   - `gh pr create --draft` with a title referencing the phase and a body with a `## Summary`
     (scope and key decisions) and a `## Test plan` section listing the unit/E2E tests
     plan.md commits to and the CI checks from validation.md — so the PR is legible against
     the GitHub Actions run before it's marked ready for review. Leave it in draft; per
     `tech-stack.md` it only moves to ready once CI is green and it has a reviewer.

9. **Report** the branch name, PR URL, and file paths, plus a one-line summary of the
   biggest judgment calls made from the answers so the user can spot anything to correct.

## Notes

- Keep every sentence in the three files traceable to roadmap.md/mission.md/tech-stack.md or
  an explicit answer from step 5 — if it's neither, that's the signal to have asked instead.
- Don't mark the roadmap phase's checkboxes done here — this skill scaffolds the spec, it
  doesn't implement or close out the phase.
- If `.github/workflows/` doesn't exist yet and this phase isn't the one tasked with adding
  it (per roadmap.md), say so in requirements.md as a blocking dependency rather than
  writing a validation.md that assumes CI checks will run — the merge gates in
  `tech-stack.md` only bite once the workflow exists.

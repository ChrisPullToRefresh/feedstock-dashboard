---
name: feature-spec
description: Scaffold the spec for the next unstarted phase on specs/roadmap.md — a dated specs/ folder holding requirements.md, plan.md, and validation.md — then branch, commit, push, and open a draft pull request gated on CI. Use only when called directly.
disable-model-invocation: true
allowed-tools: Read, Write, Glob, Grep, AskUserQuestion, Bash
---

# Feature Spec

Turn the next unstarted phase of `specs/roadmap.md` into a working spec and an open
draft pull request.

This skill produces exactly one directory:

```
specs/YYYY-MM-DD-<feature-name>/
├── requirements.md   — what we are building this phase and how we know it is right
├── plan.md           — the ordered task list, every feature task paired with a test task
└── validation.md     — how we prove it works before the pull request leaves draft
```

It does not write application code. It ends with a draft pull request that a later
session picks up.

## Core rules

**Read the constitution first, ask second, write third.** `specs/mission.md`,
`specs/tech-stack.md`, and `specs/roadmap.md` are binding. Nothing in the spec you write
may contradict them. Where they already decide something, quote them — never re-ask.

**Exactly one AskUserQuestion call, carrying exactly three questions**, in this order:
scope, key decisions, validation. Not two rounds, not four questions. Everything you
need from the user has to fit that one call, which means reading the constitution
carefully enough to know what is genuinely undecided.

**Nothing is written to disk before the user answers.** No branch, no files, no commit.

**Every feature task pairs with a test task.** This is the plan's structural invariant,
enforced in step 5.

## Procedure

### 1. Read the constitution and locate the phase

Read all three of `specs/roadmap.md`, `specs/mission.md`, and `specs/tech-stack.md`. If
any is missing, stop and tell the user to run `/create-constitution` first.

Then determine the **next unstarted phase**. The roadmap carries no status markers, so
infer it from the repository, cheapest signal first:

```bash
date +%F                                    # the real date for the folder name
ls -d specs/*/ 2>/dev/null                  # phases already scaffolded
git branch -a --format='%(refname:short)'   # branches named <phase>-<description>
gh pr list --state all --limit 50 --json number,title,headRefName,state 2>/dev/null
```

A phase is **started** if a spec folder, a branch, or a pull request already exists for
it. The next unstarted phase is the lowest-numbered phase with none of the three.
Phase numbering and branch naming both come from `specs/tech-stack.md`: a branch is the
phase number plus a short kebab-case description, e.g. `2-schema-and-migrations`.

If the lowest-numbered unstarted phase looks partially done — a branch exists but no spec
folder, or a merged pull request covers only some of its tasks — say so plainly in the
question text of Q1 rather than guessing. The user redirects you with "Other" if you
picked wrong.

Also read `.github/workflows/*.yml` if any exist, and note the job names. You need them
in step 7.

### 2. Draft the spec in your head before asking

Work out what you would write with no further input: the phase's tasks from the roadmap,
the stack decisions that constrain them, the acceptance criteria implied by the phase's
**Done when** line. The three questions exist to resolve what that draft *cannot*
settle — not to make the user restate the roadmap.

### 3. Ask the three questions

One `AskUserQuestion` call. Three questions. Name the detected phase and its **Goal**
line in the first question's text so a wrong detection is obvious immediately.

Rules for all three: 2–4 options each, your recommendation first and labeled
`(Recommended)`, and a description on every option saying what it means and what it
costs. Lead with the option the constitution points at.

- **Q1 — Scope** (`header: "Scope"`). The phase may be more than one pull request;
  `specs/tech-stack.md` says to keep each one a coherent slice of a single phase. Ask
  which slice this spec covers. Options are concrete task groupings drawn from the
  phase's roadmap bullets — "all of it", or a named subset with the rest deferred to a
  follow-up spec. Never offer a slice that spans two phases.

- **Q2 — Key decisions** (`header: "Decisions"`). The one open technical choice this
  phase turns on that the constitution does not already make — a data-shape question, a
  library choice inside an already-chosen stack, a UI pattern, a migration strategy.
  Pick the decision that would be most expensive to reverse after the code exists. If
  the constitution genuinely settles everything, ask instead about the riskiest
  assumption in your draft and offer the alternatives.

- **Q3 — Validation** (`header: "Validation"`). What proves this phase done, beyond the
  roadmap's **Done when** line. Options span the test levels `specs/tech-stack.md`
  defines — Vitest unit, React Testing Library component, Playwright E2E, manual
  device check — as combinations, not a menu of one. Respect the roadmap's own timing:
  do not propose E2E for a phase that lands before Playwright exists.

Anything the user declines to decide goes under `## Open questions` in the file it
belongs to. A guess never gets dressed up as a decision.

### 4. Create the branch

Only now. Derive `<feature-name>` as short kebab-case from the phase and the scope
answer — `schema-and-migrations`, not `phase-2-work`. Then:

```bash
git checkout main && git pull --ff-only
git checkout -b <phase-number>-<feature-name>
```

The dated folder is `specs/$(date +%F)-<feature-name>/`, using the real date from step 1.
The branch name has no date; the folder does.

Never branch from a dirty tree. If `git status --short` is non-empty, stop and ask.

### 5. Write the three files

**`requirements.md`** — what and why, in the user's terms:

```markdown
# <Phase N> — <Feature Name> — Requirements

**Phase:** <N> in `specs/roadmap.md`
**Scope of this spec:** <the Q1 answer, and what it explicitly defers>

## Goal
## Behavior
## Acceptance criteria
## Out of scope
## Constraints inherited from the constitution
## Open questions
```

Acceptance criteria are checkbox lines, each one observable in the running app. The
roadmap's **Done when** condition appears here verbatim as one of them.

**`plan.md`** — the ordered task list, and the place the pairing rule is enforced:

```markdown
# <Phase N> — <Feature Name> — Plan

Tasks run in order. Every feature task ships with its paired test task in the same
pull request.

| # | Feature task | Paired test task |
|---|--------------|------------------|
| 1 | <outcome>    | <the test that proves it> |

## Decisions
<the Q2 answer and its rationale>

## Open questions
```

The table is the invariant: **no row may have an empty right column.** If a task
genuinely cannot be tested — a config change, a dashboard click-through, a credential
added to Vercel — the right column says how it is verified instead, prefixed `Manual:`.
Silence is never acceptable. Before moving on, re-read the table and confirm every row
has both columns filled.

Name tasks for the outcome they produce (`Check in the initial migration`), never for an
activity (`do the migration work`). Keep the table flat — no sub-tasks, no nesting.

**`validation.md`** — how the phase gets proven, from the Q3 answer:

```markdown
# <Phase N> — <Feature Name> — Validation

## Automated
### Unit and component (Vitest + React Testing Library)
### End-to-end (Playwright)
<omit this section entirely if the phase predates Playwright>

## Manual
Numbered steps someone follows on a real device or browser, with the expected
result after each.

## CI gate
The GitHub Actions checks that must be green before this leaves draft.

## Open questions
```

Manual steps are specific enough for someone who has not read the code: which page,
which input, what number, what they should see.

### 6. Commit and push

Only the new spec folder. Nothing else — if other files are dirty, leave them.

```bash
git add specs/<dated-folder>
git commit -m "Add Phase <N> spec: <feature name>"
git push -u origin <branch>
```

Commit messages end with the project's `Co-Authored-By` trailer.

### 7. Open the draft pull request

```bash
gh pr create --draft --base main --title "Phase <N> — <Feature Name>" --body "<body>"
```

The body contains: the goal, the scope and what it defers, the acceptance criteria as
checkboxes, a link to the three spec files, and a **Merge gate** section listing the
GitHub Actions job names read in step 1 — the real ones from `.github/workflows/`, not
invented names.

If no workflow files exist yet, say so explicitly in the body under **Merge gate**:
name it as blocked on the phase that adds CI, and do not claim a gate that is not there.

`specs/tech-stack.md` makes green CI a hard merge requirement and blocks direct pushes to
`main`. The pull request stays **draft** — this skill scaffolds a spec, it does not ship a
phase. Do not mark it ready, and do not merge.

### 8. Report

Plain text: the branch, the three file paths, the pull request URL, the decisions the
user made in the three questions, every item parked under `## Open questions`, and the
CI checks that gate the merge. If you deferred part of the phase in Q1, say what is left
and that it needs its own spec later.

## Writing style

- Short declarative sentences. These files get read mid-task by agents and humans.
- Every claim traces to the constitution, the roadmap, or an answer given in this session.
- Cross-reference the constitution rather than restating it.
- No invented dates, metrics, library names, or version numbers.
- Use the phase number and the release label exactly as `specs/roadmap.md` writes them.

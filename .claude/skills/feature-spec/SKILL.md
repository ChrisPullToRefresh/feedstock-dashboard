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

**Ask about every choice the constitution does not already settle.** There is no cap on
how many questions you ask or how many `AskUserQuestion` calls it takes. Ask them in
this order — scope, then decisions, then validation — batching up to four per call
because that is the tool's limit, and opening the next call once the previous is
answered. Stop when nothing consequential is left unasked, not when you have hit a
number.

**A choice you make yourself is a guess, whatever you call it.** If the constitution
does not settle it and you did not ask, it does not go in `## Decisions` with a
rationale attached. It goes under `## Open questions`, or you ask. This is the rule the
rest of the skill exists to protect: a spec's authority comes from the user having
chosen, and a well-argued paragraph is exactly what makes an unasked choice hard to
spot later.

**Nothing is written to disk until the questions are answered.** No branch, no files, no
commit.

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
scope question's text rather than guessing. The user redirects you with "Other" if you
picked wrong.

Also read `.github/workflows/*.yml` if any exist, and note the job names. You need them
in step 7.

### 2. Draft the spec in your head before asking

Work out what you would write with no further input: the phase's tasks from the roadmap,
the stack decisions that constrain them, the acceptance criteria implied by the phase's
**Done when** line.

Then list every point where that draft had to choose and the constitution did not choose
for it — where a file lands, how a route renders, what a test asserts, which of two
libraries inside the already-chosen stack. That list is your question list. It is
usually longer than it first appears, because the choices that feel obvious while
drafting are the ones that get written down as decisions without anyone agreeing to
them. The questions exist to resolve what the draft cannot settle — not to make the user
restate the roadmap.

### 3. Ask

Work through the list from step 2 in this order: scope first, then every decision, then
validation. Four questions per `AskUserQuestion` call; open the next call once the
previous is answered. Name the detected phase and its **Goal** line in the first
question's text so a wrong detection is obvious immediately.

Rules for every question: 2–4 options, your recommendation first and labeled
`(Recommended)`, and a description on every option saying what it means and what it
costs. Lead with the option the constitution points at. Offer "park it as an open
question" wherever the honest answer is that nobody needs to decide yet — but do not
offer it as a way to avoid asking properly.

Do not pad. A question whose options are all the same work in different words teaches
the user to skim, and a skimmed question is worse than one you never asked.

- **Scope** (`header: "Scope"`). A spec covers exactly one phase, and that phase ships as
  exactly one pull request — `specs/tech-stack.md` § Branching & pull request workflow.
  So this question is not "which slice"; never offer a subset of a phase's bullets or a
  follow-up spec for the remainder. Ask instead whether the phase you detected is the
  right one and whether its bullets are still the work: list them back, and offer the
  alternatives that actually exist — proceed with all of them, or the roadmap needs
  changing first, because a phase too large for one reviewable pull request is a phase
  drawn too large, and the fix is to split it in `specs/roadmap.md` before any spec is
  written.

- **Decisions** (`header: "Decisions"`). One question per open technical choice the
  constitution does not already make — a data-shape question, a library choice inside an
  already-chosen stack, a UI pattern, a migration strategy, where a new file lands, what
  a paired test actually asserts. Order them by how expensive they are to reverse once
  the code exists, most expensive first, so the questions that matter get a fresh reader.

  Ask about the small ones too. "Which directory" and "what does this test assert" feel
  beneath a question while you are drafting and read as unilateral once they are in the
  file. If the constitution settles it, quote it and move on; if it does not, it is a
  question.

- **Validation** (`header: "Validation"`). What proves this phase done, beyond the
  roadmap's **Done when** line. Options span the test levels `specs/tech-stack.md`
  defines — Vitest unit, React Testing Library component, Playwright E2E, manual
  device check — as combinations, not a menu of one. Respect the roadmap's own timing:
  do not propose E2E for a phase that lands before Playwright exists.

Anything the user declines to decide goes under `## Open questions` in the file it
belongs to, in their words, not recast as a decision you would have made.

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
**Scope of this spec:** <all of the phase's roadmap bullets — a spec covers one whole
phase and defers none of it>

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
<every decision the user made, with the rationale and the rejected alternatives>

## Open questions
```

`## Decisions` records answers, never inferences. Before you write an entry, name the
question the user answered to produce it. If you cannot, it belongs under
`## Open questions` instead.

The table is the invariant: **no row may have an empty right column.** If a task
genuinely cannot be tested — a config change, a dashboard click-through, a credential
added to Vercel — the right column says how it is verified instead, prefixed `Manual:`.
Silence is never acceptable. Before moving on, re-read the table and confirm every row
has both columns filled.

Name tasks for the outcome they produce (`Check in the initial migration`), never for an
activity (`do the migration work`). Keep the table flat — no sub-tasks, no nesting.

**`validation.md`** — how the phase gets proven, from the validation answers:

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

The body contains: the goal, the phase's bullets, the acceptance criteria as
checkboxes, a link to the three spec files, and a **Merge gate** section listing the
GitHub Actions job names read in step 1 — the real ones from `.github/workflows/`, not
invented names.

If no workflow files exist yet, say so explicitly in the body under **Merge gate**:
name it as blocked on the phase that adds CI, and do not claim a gate that is not there.

**This draft is the phase's pull request — the only one it gets.** `specs/tech-stack.md`
§ Branching & pull request workflow gives each phase exactly one, and `/feature-implement`
works the plan onto this same branch and marks this same pull request ready. Merging it
before the implementation lands costs the phase its single pull request and forces a
second one. Say so in the body, so nobody merges it out of tidiness.

`specs/tech-stack.md` makes green CI a hard merge requirement and blocks direct pushes to
`main`. The pull request stays **draft** — this skill scaffolds a spec, it does not ship a
phase. Do not mark it ready, and do not merge.

### 8. Report

Plain text: the branch, the three file paths, the pull request URL, every decision the
user made and where it is recorded, every item parked under `## Open questions`, and the
CI checks that gate the merge. The spec covers the whole phase, so there is no remainder
to hand to a later spec — if you found yourself wanting one, the phase is too large and
`specs/roadmap.md` is what needs changing.

Then say plainly whether anything in the spec is yours rather than theirs. If a choice
got made without a question — because you missed it in step 2 — name it here rather than
letting the user find it in the file.

## Writing style

- Short declarative sentences. These files get read mid-task by agents and humans.
- Every claim traces to the constitution, the roadmap, or an answer given in this session.
- Cross-reference the constitution rather than restating it.
- No invented dates, metrics, library names, or version numbers.
- Use the phase number and the release label exactly as `specs/roadmap.md` writes them.

---
name: feature-implement
description: Implement the phase described by the active spec — work plan.md's task table in order, honor requirements.md's scope and decisions, and verify against validation.md before reporting the phase done. Use only when called directly.
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion, TaskCreate, TaskUpdate
---

# Feature Implement

Turn an existing spec into shipped code on its branch.

This skill is the second half of `/feature-spec`. That skill wrote
`specs/YYYY-MM-DD-<feature-name>/` and opened a draft pull request. This one works the
plan, proves it, and takes the pull request out of draft.

It reads three files and treats them as binding:

```
specs/YYYY-MM-DD-<feature-name>/
├── requirements.md   — the scope, the acceptance criteria, what is out of bounds
├── plan.md           — the ordered task table and the decisions already made
└── validation.md     — what has to be true before this phase is called done
```

It does not merge.

## Core rules

**The spec is the contract.** `requirements.md` § Out of scope is a hard boundary — a
task that would build into a later phase does not get done early, however small. The
decisions in `plan.md` § Decisions are settled; do not relitigate them mid-task.
`specs/mission.md` and `specs/tech-stack.md` still bind everything the spec left unsaid.

**Work the table in order, one row at a time.** Each row of `plan.md`'s task table is a
unit: the feature task and its paired test task land in the same commit. Never batch
several rows into one commit, and never commit a feature task with its test deferred.

**A `Manual:` row is not yours to check off.** Rows whose right column starts with
`Manual:` describe a verification a person performs. Do the feature work, then collect
the manual check for the handoff in step 8. Never report a manual check as passed.

**Green before done.** Every automated test in `validation.md` runs and passes, and the
CI gate it names is green, before you call the phase implemented.

**Never push to `main` and never merge.** `specs/tech-stack.md` blocks direct pushes and
makes the author the one who self-merges. This skill stops at a pull request that is
ready for review.

**If reality contradicts the spec, say so — do not quietly rewrite it.** A task that
turns out to be impossible, or a decision the code disproves, is reported to the user.
Only edit a spec file when the user directs the change, and record the reason in
`plan.md` § Decisions when you do.

## Procedure

### 1. Locate the active spec

```bash
git branch --show-current
git status --short
ls -d specs/*/ 2>/dev/null
gh pr list --state open --json number,title,headRefName,isDraft --limit 20
```

The active spec is the `specs/` folder whose feature name matches the current branch —
branch `0-foundation` pairs with `specs/2026-08-12-foundation/`. The branch carries no
date; the folder does.

- **On a phase branch with a matching folder:** that is the spec. Proceed.
- **On `main`:** find the open draft pull request, check out its head branch, and pair it
  the same way. If there is more than one, ask which with `AskUserQuestion`.
- **No spec folder for this branch:** stop. Tell the user to run `/feature-spec` first.
  This skill implements a spec; it does not invent one.

A dirty tree that predates this session is not yours to commit. If `git status --short`
shows changes unrelated to the spec, name them to the user and leave them alone.

### 2. Read the spec and the constitution

Read all three spec files in full, then `specs/mission.md`, `specs/tech-stack.md`, and
the phase's entry in `specs/roadmap.md`. Read `.github/workflows/*.yml` if any exist —
you need the real job names in step 7.

Read `plan.md` § Open questions and `requirements.md` § Open questions before writing any
code. An open question that blocks a specific task blocks it now, not after you have
built on top of a guess. If one does, raise it in step 5 when you reach that row.

### 3. Work out what is already done

The phase may be partly built by an earlier session. Establish the real state before
touching anything:

```bash
git log --oneline main..HEAD
git diff --stat main..HEAD
```

Then check the repository for each row's actual artifact — the file, the script, the
config, the test. A commit message claiming a task is weaker evidence than the artifact
existing and its test passing. Where they disagree, trust the repository.

Run the test suite once here if one exists. A red suite you inherited is the first thing
to fix, and it is not a new task — it is the previous row, unfinished.

### 4. Track the table

Create one task per row of `plan.md`'s table, in table order, using the row's own
wording. Mark the rows step 3 found complete as done. This list is the phase's progress
and the thing you report against — keep it current as you go rather than at the end.

### 5. Implement, row by row

For each incomplete row in order:

1. **Write the feature.** The smallest change that produces the outcome the row names.
2. **Write the paired test**, or perform the paired setup for a `Manual:` row.
3. **Run the checks the repository already has** — `npm run lint`, `npm run typecheck`,
   `npm run test`, or whichever of them exist at this point in the phase. Early rows in a
   foundation phase may predate their own tooling; run what exists.
4. **Commit the row**, feature and test together:

   ```bash
   git add <the files this row touched>
   git commit -m "<outcome the row names>"
   ```

   Commit messages name the outcome, not the activity, and end with the project's
   `Co-Authored-By` trailer. Stage only what the row touched.

Follow `specs/tech-stack.md` as you write: Tailwind classes and shadcn/ui theme tokens
only — never a raw CSS file — shadcn/ui components rather than hand-rolled ones,
lucide-react for icons, TypeScript in strict mode, mobile-first. Match the conventions
already in the repository over your own defaults.

Stop and ask the user when — and only when — a row needs a decision the spec does not
make and the constitution does not settle, or when a row cannot be done as written. Do
not stop to report routine progress.

Rows that depend on something outside the repository — a GitHub setting, a Vercel
connection, a dashboard toggle, a credential — are done as far as the CLI reaches
(`gh api`, `vercel`), and the remainder goes to the handoff in step 8. Note that
`specs/tech-stack.md` § Hosting & deployment puts the Vercel account and the
browser-automation Chrome profile on different accounts: never verify a preview
deployment by browser automation.

### 6. Run the automated validation

With every row complete, work `validation.md` § Automated top to bottom. Each test it
names must exist and pass — a test the spec describes but the suite does not contain is
an unfinished row, not an optional extra.

Then check `requirements.md` § Acceptance criteria one by one and note, for each, the
thing that proves it: a passing test, a command's output, or a manual step from
`validation.md`. A criterion with nothing behind it is not met.

### 7. Push and confirm CI

```bash
git push
gh pr checks --watch
```

Every job the pull request runs must be green, and they must be the jobs
`validation.md` § CI gate names. A red job is fixed here, in a commit on this branch, not
explained away.

Then run `/code-review` on the branch and address its findings, as
`specs/tech-stack.md` § Branching & pull request workflow requires before review.

### 8. Hand off the manual validation

List, as numbered steps with their expected results, everything a person still has to
check: `validation.md` § Manual in full, plus every `Manual:` row from the plan table
that only a person or an external dashboard can confirm. Copy the expected result from
the spec — do not paraphrase it into something vaguer.

Then ask the user, with `AskUserQuestion`, whether those steps pass. Only if they say yes:

```bash
gh pr ready
```

If they report a failure, fix it on the branch and return to step 6. If they decline to
run the steps now, leave the pull request in draft and say plainly that it is waiting on
manual validation — an unrun step is not a passed one.

### 9. Report

Plain text:

- The branch, the pull request URL, and its draft state.
- Every table row, with what proves it — the test name, or the manual step it waits on.
- Any acceptance criterion in `requirements.md` not yet met, and what it is waiting for.
- The CI jobs and their result.
- Manual steps still outstanding, and who has to run them.
- Anything you found that contradicts the spec, and anything still parked under
  `## Open questions` in either file.

If the spec deferred part of the phase to a follow-up, say so and say that the next slice
needs its own `/feature-spec` run.

## Writing style

- Short declarative sentences. Say what happened, not how hard it was.
- Report the phase done only when the tests pass, CI is green, and the manual steps have
  been confirmed by the user. A qualified pass is stated with its qualification.
- Name files as paths and tests by their real names, so the user can go and look.

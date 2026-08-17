---
name: align
description: Audit the constitution — mission.md, tech-stack.md, roadmap.md — and every feature spec under specs/ for contradictions, stale claims, and scope drift, then resolve each finding with the user. Use only when called directly.
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
---

# Align

Check that the specs still describe the project that exists.

`specs/mission.md`, `specs/tech-stack.md`, and `specs/roadmap.md` bind every phase, and
each `specs/YYYY-MM-DD-<feature-name>/` folder binds the phase it belongs to. They are
written at different times, by different sessions, and the repository moves underneath
them. This skill finds where they have come apart and puts each disagreement in front of
the user.

It does not decide anything on its own. It reads, it verifies, it asks, and it applies
only what the user chooses.

## Core rules

**The user resolves every finding.** Never edit a spec because the fix looks obvious. A
contradiction between a document and the code has two valid resolutions — change the
document, or change the code — and which one is right is a product decision.

**Every finding quotes its evidence.** File path, line number, and the exact sentence.
A finding the user cannot check in five seconds is noise, and a claim you cannot quote is
one you have not verified.

**A shipped phase's spec is a record, not an instruction.** Specs for merged phases
describe what was true when written. Past tense is not staleness, and rewriting history
is not alignment. Flag only what would mislead someone acting *today* — chiefly an
`## Open questions` entry that has since been answered, or a constraint later phases
inherit that is no longer true.

**Report nothing rather than pad.** If the specs are aligned, say so and stop. A skill
that always finds something teaches the user to ignore it.

**Never touch `main`.** `specs/tech-stack.md` blocks direct pushes and requires a pull
request for every change, documentation included.

## What counts as a finding

Three kinds, each found a different way. Do not conflate them — the resolution differs.

**Contradiction.** Two documents that cannot both be followed, or a document that
contradicts itself. Found by reading documents against each other. *Example: the stack
names one accent color, and a phase's requirements name a different one.*

**Stale claim.** A document asserts something about the repository that is no longer
true. Found only by checking the assertion against the repository — never by reading
alone. *Example: a validation file states no CI workflow exists, and
`.github/workflows/` now holds one. Example: an open question asks to confirm something
before a task that has since shipped.*

**Scope drift.** Work has accumulated somewhere it does not belong. Found by reading a
phase's bullets against its own **Goal** line. *Example: a phase whose goal is
authentication carrying a color-palette task and a CI-configuration task.*

## Procedure

### 1. Read everything

```bash
ls specs/
ls -d specs/*/ 2>/dev/null
```

Read `specs/mission.md`, `specs/tech-stack.md`, and `specs/roadmap.md` in full, then
every `requirements.md`, `plan.md`, and `validation.md` under each dated folder, then
`README.md`. If the constitution is missing, stop and tell the user to run
`/create-constitution`.

`README.md` describes the repository as it is today and restates parts of the
constitution, so it goes stale in both directions — a renamed file in its layout block,
or a workflow rule the constitution has since changed.

Read them completely before forming any finding. Most apparent contradictions dissolve in
a sentence two paragraphs further down.

### 2. Establish what is actually true

A stale claim cannot be found by reading. Before the second pass, gather the repository's
own answer to what the documents assert:

```bash
git log --oneline -15
git branch -a --format='%(refname:short)'
gh pr list --state all --limit 30 --json number,title,headRefName,state
ls .github/workflows/ 2>/dev/null
cat package.json
gh api repos/{owner}/{repo} --jq '{allow_squash_merge, allow_merge_commit, delete_branch_on_merge}'
gh api repos/{owner}/{repo}/branches/main/protection --jq '{checks: .required_status_checks.contexts, enforce_admins: .enforce_admins.enabled}' 2>/dev/null
```

Extend this to whatever the documents actually claim. If a spec asserts a script exists,
run it. If it names a dependency, check `package.json`. If it names a required check,
read the protection rules. Verify the specific claims in front of you rather than
collecting facts by habit.

### 3. Run the three passes

**Pass A — document against document.** Constitution files against each other, then each
spec folder against the constitution, then spec folders against each other where a later
phase inherits from an earlier one. The constitution wins by default; a spec that
contradicts it is the finding, unless the spec records a decision the user made later.

**Pass B — document against repository.** Every factual assertion, against what step 2
found. Weight these by whether a reader acting today would be misled. An
`## Open questions` entry answered three phases ago is a finding; a completed phase's
validation file describing the state at the time is not.

**Pass C — phase against its own charter.** For each phase in `specs/roadmap.md`, read
its bullets against its **Goal** line, and each spec folder's tasks against its
`requirements.md` § Goal. A bullet that no reasonable reading of the goal covers is
drift. Deferred work parked deliberately is not drift if the document says why.

### 4. Rank

Order findings by what they would cost the next session, not by how wrong they look:

1. Anything that would cause the next phase to be built incorrectly.
2. Anything that makes a shipped phase's acceptance criteria unprovable.
3. Anything merely untidy — a stale sentence in a closed spec, a duplicated constraint.

Drop anything you cannot quote. Drop anything where the "contradiction" is you having
misread. Say plainly how many findings survived.

### 5. Ask

One `AskUserQuestion` call per batch, up to four findings per call, highest-ranked first.
Do not open a second batch until the first is answered.

Each question names the finding, quotes both sides with their file paths, and offers the
resolutions that actually apply — usually drawn from:

- **Amend the document** — the repository is right and the spec is out of date.
- **Change the repository** — the spec is right and the code drifted from it.
- **Record it as an open question** — it is a real disagreement that nobody is ready to
  settle. It goes under `## Open questions` in the file it belongs to.
- **Leave it** — intentional, and the skill should stop reporting it. Ask what note would
  make that obvious to the next reader, and write that note.

Put your recommendation first, labeled `(Recommended)`, and say what each option costs.
Where a finding has only one sane resolution, say so in the description rather than
padding the list with options you would argue against.

### 6. Apply what the user chose

Only the chosen resolutions. Nothing else, however tempting.

Edits to a spec follow the conventions already in these files: the constitution is
cross-referenced rather than restated, and a decision the user made in this session is
recorded with its reason — in `plan.md` § Decisions for a phase spec, inline for a
constitution file. Never delete the history of why something was decided; supersede it
and say what superseded it.

If a resolution is "change the repository", that is a code change belonging to a phase.
Do not write it here. Record it as a roadmap bullet under the phase that will carry it,
and say so in the report.

### 7. Branch, commit, and open the pull request

Only if the user chose at least one edit. Never branch from a dirty tree — if
`git status --short` shows unrelated changes, name them to the user and stop.

```bash
git checkout main && git pull --ff-only
git checkout -b <phase-number>-<short-kebab-description>
git add specs/ README.md
git commit
git push -u origin <branch>
gh pr create --base main
```

Branch naming, commit format, and pull request titles all come from
`specs/tech-stack.md` § Branching & pull request workflow — read it rather than assuming,
because it is one of the files this skill audits and it may have changed. Commit only the
files this run touched.

Do not merge.

### 8. Report

Plain text:

- How many findings survived ranking, by category.
- Each finding, its resolution, and the file now carrying it.
- Anything newly parked under `## Open questions`, and in which file.
- Anything recorded as a roadmap bullet for a later phase to carry.
- Findings the user chose to leave, and the note now marking them intentional.
- The branch and pull request URL, or a plain statement that nothing needed changing.

## Writing style

- Short declarative sentences. Quote the specs; do not paraphrase them into something
  vaguer.
- Name files as paths and phases exactly as `specs/roadmap.md` writes them.
- Describe a finding by what it would cause, not by how bad it is.
- No invented dates, versions, or line numbers. If you did not read it, do not cite it.

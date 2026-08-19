---
name: plan-new-version
description: Plan the next version from a feedback folder — synthesize the feedback into discrete proposed changes, decide each one with the user, then update the constitution (specs/mission.md, specs/tech-stack.md, specs/roadmap.md) to carry them. Takes the feedback folder as its argument, e.g. specs/vision0.2/. Use only when called directly.
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
---

# Plan New Version

Turn a folder of feedback into the next version's plan.

`/create-constitution` seeded the constitution from a vision before anything existed.
This skill re-plans it after a version has shipped and someone has responded to it. The
input is a folder — `specs/vision0.2/`, `specs/v2_docs`, whatever it is called — holding
the feedback in whatever form it arrived: an email, meeting notes, a transcript, a list.

The output is edits to `specs/mission.md`, `specs/tech-stack.md`, and `specs/roadmap.md`.
Nothing else.

## Argument

The feedback folder path: `/plan-new-version specs/vision0.2`.

If no argument was given, list `specs/vision*/` and any other candidate folders and ask
which one. If the named folder does not exist or holds no readable files, stop and say
so — do not fall back to planning a version out of the roadmap alone.

## Core rules

**Every question goes through `AskUserQuestion`. This is not optional.** Not a question
in prose, not a list of options in your reply, not "let me know which you prefer" — the
tool, every time, and then wait for the answer. A question asked in plain text is one the
user scrolls past, and an unanswered question becomes an assumption you wrote into the
constitution. If you catch yourself typing a question mark outside a tool call, stop and
make the call instead.

**One proposed change, one question.** Every `AskUserQuestion` call in the walk carries
exactly one proposed change. Never batch two into one call, even when they look related
and even when the tool would allow four. Each one changes what gets built; batching
invites skimming, and a skimmed scope decision costs a phase.

**Every proposed change quotes the feedback.** The file it came from and the sentence
itself. A change the user cannot trace back in five seconds is one you invented.

**The feedback is a request, not a decision.** The author of the feedback is not
necessarily the person answering the questions. Take nothing into the version because it
was asked for confidently.

**The constitution only.** Do not create or edit `specs/YYYY-MM-DD-<feature>/` folders,
and do not write application code. `/feature-spec` turns each new roadmap phase into an
implementable spec, one phase at a time, when that phase comes up. Leave it the room to
ask its own questions — decide here only what a phase's *scope* is, not how it is built.

**Nothing is written to disk until the whole walk is answered.** No edits, no branch, no
commit, mid-walk.

**Shipped history is not rewritten.** The previous release's Definition of done stays
where it is, checked. Phases already numbered keep their numbers — branches, spec
folders, and merged pull requests are named after them.

**Never touch `main`.** `specs/tech-stack.md` requires a pull request for every change,
documentation included.

## What counts as a proposed change

One decision, landing in one place. The kinds, because the resolution differs:

**Feature.** New behavior the product does not have. Lands as a roadmap phase, or as
bullets inside one.

**Change to shipped behavior.** Alters something the shipped release already does —
a default, a screen's layout, what a control means. Lands as a roadmap phase, and
usually moves a line in `specs/mission.md` too.

**Terminology.** A rename that ripples through all three constitution files, the code,
and often the database. One proposed change covering every occurrence — never one per
file.

**Stack change.** A new dependency, a new data capability, a new test layer, a changed
merge gate. Lands in `specs/tech-stack.md`.

**Deferred item.** The feedback's "eventually" and "after that" items. Lands under
`## After <RELEASE>`, unordered and unlabeled — not as a phase.

**Scope boundary.** Something the feedback rules out, tucks away, or de-emphasizes.
Lands as a non-goal or as a phase task that demotes it.

Split when accepting half of it would still be coherent. Merge when the user cannot
answer one without deciding the other in the same breath.

Do not propose what is already true, and do not propose what the roadmap already carries
for the next version — see step 2.

## Procedure

### 1. Read the feedback and the constitution

```bash
ls -la <feedback-folder>
```

Read every file in the folder, in full. Then read `specs/mission.md`,
`specs/tech-stack.md`, and `specs/roadmap.md` in full. If the constitution is missing,
stop and tell the user to run `/create-constitution` first.

Then read the vision folder the shipped release was built from — `specs/vision*/` — so
you can tell a new request apart from one that was always in scope, and read the
roadmap's `## After <previous release>` section closely. Feedback most often promotes
exactly what is already parked there.

Do not read every dated spec folder. This skill is not an audit; `/align` is. Open a
phase's spec only when a proposed change turns on what that phase decided, and quote it
when you do.

### 2. Establish what is already planned and what already shipped

The roadmap may already carry an unfinished section for the next version, written before
this feedback arrived. Find it. Its items are **not** proposed changes — they are the
existing plan, and the only question they raise is where the feedback's work sits
relative to them.

Then check what has actually shipped, cheaply, so you do not propose last week's work:

```bash
git log --oneline -20
ls -d specs/*/ 2>/dev/null
gh pr list --state merged --limit 20 --json number,title 2>/dev/null
```

Verify anything the feedback implies is missing but might not be. A request to "add" what
already exists is a finding for the report, not a phase.

### 3. Name the version

Ask before synthesizing anything else, via `AskUserQuestion`, one question per call:

1. **The release label.** If the roadmap already names the next version, lead with that
   label as `(Recommended)` and say you are matching the roadmap. Otherwise offer the
   obvious successors to the shipped label and a free-text answer.
2. **Where this work sits**, but only if step 2 found an existing next-version section:
   does the feedback's work join that section, or does it become the version after it,
   leaving that one to ship first?

Whatever the user picks is `<RELEASE>`, used verbatim in all three files — headings,
scope lines, non-goals, phase names. Never renumber or relabel the shipped release.

### 4. Synthesize the proposed changes

Turn the feedback into a numbered list. Each entry:

- the change stated in one sentence
- the quote that produced it, with its file
- which constitution files it touches
- where it lands — a phase, a mission section, a tech-stack section, or deferred

Order by dependency first, then by the feedback's own priority: a rename before the
screens that use the renamed thing, a data-model change before the view built on it,
anything marked "next" before anything marked "eventually".

Every substantive ask in the feedback appears exactly once. Anything you are dropping as
already-true appears in the list too, marked as such with the evidence from step 2, so
the user can overrule you.

**Print the whole numbered list as plain text before asking anything.** The user decides
the first item better for having seen the shape of the whole version. Say how many there
are, and say roughly how many phases it looks like.

### 5. Walk the list, one at a time

One `AskUserQuestion` call per proposed change, in list order — the tool, not prose. Do
not open the next call until the current one is answered. Do not combine. Do not skip a
change because its answer looks obvious: the walk is the entire point of this skill, and
a change nobody was asked about is a change nobody chose.

Each question names the change, quotes the feedback, and says what taking it costs —
which files move, whether it touches the schema or behavior that already shipped, and
whether it is a phase of its own or a bullet inside one.

Lead with your recommendation, labeled `(Recommended)`, and say why. The resolutions
that usually apply:

- **Take it into `<RELEASE>`** — it becomes a phase or a phase's task.
- **Take it, but not now** — it goes under `## After <RELEASE>`, deferred and unlabeled.
- **Take a narrower version** — say exactly what narrower means, in the option itself.
- **Decline** — it is written into `specs/mission.md` § Non-goals with the reason, so it
  does not come back as a surprise request.
- **Park it** — a real question nobody is ready to settle, recorded under
  `## Open questions` in the file it belongs to.

Where a change forks on a genuine product choice — what archiving does to existing
records, what a delete removes — make the options *those choices*, not accept/reject.
Ask only what the constitution has to decide, and say in the question that the rest is
left to `/feature-spec`.

Hold every answer. Write nothing yet.

### 6. Write the roadmap

Continue phase numbering from the highest existing phase. Never renumber what is already
there.

New phases take the roadmap's existing shape exactly:

```markdown
## Phase N — <name>

**Goal:** one sentence.

**Done when:** one observable condition.

- <task>
- <task>
```

Aim for 4–8 phases and prefer more small ones over few large ones. Each is independently
verifiable, states its goal in one sentence, and is a few days of work. Two levels only —
phase, then a flat list of 3–8 tasks named for the outcome they produce. If a phase wants
sub-headings, it is two phases.

Then:

- Add `## <RELEASE> — Definition of done`, a checklist true only when every new phase is
  complete. Leave the shipped release's checklist above it untouched and still checked.
- Rewrite `## After <previous release>` as `## After <RELEASE>`: carry forward what is
  still deferred, add the feedback's "eventually" items, and remove anything now planned
  as a phase.
- If the version changes testing or CI/CD — a new end-to-end surface, a new required
  check — that is an explicit task in the phase that introduces it, not implied
  background work.

### 7. Write mission and tech-stack

Edit only what the accepted changes actually move. Both files are cross-referenced by
every spec in the repository; a gratuitous rewrite invalidates quotes elsewhere.

`specs/mission.md`:

- Retarget `## What success looks like for <previous release>` to `<RELEASE>`. The old
  criteria are not lost — the roadmap's Definition of done keeps them, checked.
- Add declined requests to `## Non-goals` with the reason given in the walk.
- Update `## What we're building` and `## Constraints` only where an accepted change
  contradicts what they say today.

`specs/tech-stack.md`: only what an accepted change requires — a dependency, a data
capability, a test layer, a changed merge gate.

A terminology change is applied across all three files in one pass **and** recorded as a
roadmap task: the documents are renamed here, but the code, routes, and database columns
still carry the old word, and that rename is a phase's work.

### 8. Branch, commit, and open the pull request

Never branch from a dirty tree — if `git status --short` shows unrelated changes, name
them to the user and stop.

```bash
git checkout main && git pull --ff-only
git checkout -b <branch>
git add specs/
git commit
git push -u origin <branch>
gh pr create --base main
```

Branch naming, commit format, and pull request title all come from `specs/tech-stack.md`
§ Branching & pull request workflow — read it rather than assuming. Commit only the files
this run touched. Do not merge.

### 9. Report

Plain text:

- `<RELEASE>`, and how many proposed changes the walk covered.
- Each change, its resolution, and the file and section now carrying it.
- Declined requests and the non-goal now recording each.
- Anything parked under `## Open questions`, and in which file.
- The phases added, by number and name.
- The branch and pull request URL.
- That `/feature-spec` is what turns Phase N into an implementable spec — this skill
  wrote no spec folder and no code.

## Writing style

- Short declarative sentences. The constitution decides things; write it that way.
- Every claim traces to the feedback or to an answer the user gave in this session.
- Quote the feedback; do not paraphrase a request into something vaguer than it was.
- Cross-reference between the three files rather than repeating content.
- No invented dates, versions, vendor names, or metrics.
- `<RELEASE>` is the label the user chose, identical in all three files, with the angle
  brackets gone.

---
name: create-constitution
description: Bootstrap a project's constitution — specs/mission.md, specs/tech-stack.md, and specs/roadmap.md — seeded from specs/vision0.1/VISION.md. Together these three files ARE the constitution; there is no separate CONSTITUTION.md. Use only when called directly.
disable-model-invocation: true
allowed-tools: Read, Write, Glob, Grep, AskUserQuestion, Bash
---

# Create Constitution

Bootstrap the three files that make up this project's constitution:

- `specs/mission.md` — what we are building, for whom, and why
- `specs/tech-stack.md` — what we build it with, including testing and CI/CD
- `specs/roadmap.md` — what order we build it in, as small ordered phases

**These three files ARE the constitution.** Do not create `CONSTITUTION.md` or any
umbrella file. Do not create additional spec files beyond these three.

## Core rule: ask, never invent

`specs/vision0.1/VISION.md` is a seed, not a specification. It will be silent on most of what
the constitution needs. Every gap is a question for the user, asked with
**AskUserQuestion** — never an assumption you quietly fill in.

Before writing each file, run an AskUserQuestion round covering that file's gaps.
Three files, so at least three rounds. Rules for the rounds:

- Confirm scope for **every** file, even one VISION.md seems to cover well —
  at minimum confirm what you extracted before committing it to disk.
- Max 4 questions per call, 2–4 options each. Split into extra rounds when needed;
  do not drop questions to fit.
- Lead each question's options with your recommendation, labeled `(Recommended)`,
  and say *why* in the description. The user picks fast when the tradeoff is visible.
- Anything the user declines to decide goes into the file under
  `## Open questions` — never a guess dressed up as a decision.
- Do not ask about anything VISION.md states plainly. Quote it back instead.

## Procedure

### 1. Read the seed

Read `specs/vision0.1/VISION.md`. If it is missing, stop and tell the user this skill needs it
first — do not interview a constitution out of thin air.

Check whether `specs/mission.md`, `specs/tech-stack.md`, or `specs/roadmap.md` already
exist. If any do, read them and ask whether to replace, extend, or leave them alone
before touching anything.

Then split VISION.md into two lists and hold onto both:

- **Stated** — facts you may write down as-is (product purpose, named frameworks,
  named constraints, named people and their asks).
- **Unstated** — everything the constitution needs that VISION.md never says.
  This list is your question queue.

### 2. Round 1 → write `specs/mission.md`

**Ask for the first release label before anything else in this round.** All three
files refer to the first shipped version constantly, and the label has to be the
user's choice, not yours. Ask what to call it — for example `v1.0`, `v0.1`,
`MVP`, or `Milestone 1` — and offer a free-text answer for anything else. If
VISION.md already names a version (e.g. "post version 1.0"), lead with that as the
recommended option and say you are matching VISION.md.

Whatever they pick becomes `<RELEASE>`. Use it verbatim everywhere in mission.md,
tech-stack.md, and roadmap.md — headings, scope lines, non-goals, phase names. Never
mix in `v1.0` out of habit once a different label is chosen, and never silently
renumber it later in the session.

Then ask about the gaps that decide what the product *is*. Typical unknowns:

- Who the primary users are, and who the buyer/sponsor is if different
- What problem it replaces (spreadsheet? paper? nothing?)
- What "done and working" looks like for `<RELEASE>` — the success signal
- Explicit non-goals — the things people will ask for that `<RELEASE>` will not do
- Scale and environment: how many users, how much data, online-only or offline-tolerant

Then write `specs/mission.md`:

```markdown
# Mission

## What we're building
## Who it's for
## The problem it solves
## What success looks like for <RELEASE>
## Non-goals
## Constraints
## Open questions
```

### 3. Round 2 → write `specs/tech-stack.md`

Confirm what VISION.md names, then fill the gaps. **Testing tools and CI/CD are
mandatory dimensions of this file — ask about them even when VISION.md is silent,
which it usually is.**

Cover at least:

- **Language, framework, styling** — confirm what VISION.md names; ask for versions
  and anything it omits
- **Component/UI library** — confirm named choices; ask about icons, fonts, theming
- **Data layer** — database, ORM/query layer, migrations, hosting
- **Auth** — whether `<RELEASE>` needs it at all, and if so, which provider
- **Hosting/deploy target**
- **Testing tools (mandatory)** — unit/component runner, E2E, and whether E2E is in
  `<RELEASE>` or deferred. Ask what level of coverage they actually want enforced.
- **CI/CD (mandatory)** — **confirm a default of GitHub Actions**; offer alternatives
  (provider-native CI such as Vercel's own pipeline, GitLab CI, none for now) but make
  GitHub Actions the recommended option. Then ask what the pipeline must run on every
  PR (lint, typecheck, unit, E2E, build) and what gates merge.

**Branching and PR workflow (mandatory).** The constitution must state that
**work is never committed directly to `main`.** Interview the user on the workflow
they actually want, then write down their answers — do not assume a house style:

- Branch naming convention (`feature/*`, initials prefix, ticket ID, roadmap phase
  number, free-form)
- **How a roadmap phase maps to pull requests** — one pull request per phase, or several.
  Ask it explicitly; it is the item most often left unstated, and unstated it decays into
  "as many as it takes". Recommend one per phase: it keeps branch, spec folder, and pull
  request in one-to-one correspondence, keeps the phase's **Done when** line provable in
  one place, and turns pull request size into pressure to split the *phase* rather than
  pressure to split the review. Whatever they choose, write it down as a rule with its
  consequence, not as a preference.
- Whether every change goes through a pull request, or trivial fixes can skip one
- Who reviews — solo project with self-merge, required teammate approval, or
  AI-assisted review before human approval
- Whether CI passing is a hard merge gate
- Merge style: squash, rebase, or merge commit
- Whether `main` gets branch protection turned on, and deletion of merged branches

Then write `specs/tech-stack.md`:

```markdown
# Tech Stack

## Application
## Data
## Auth
## Hosting & deployment
## Testing
## CI/CD
## Branching & pull request workflow
> Work is never committed directly to `main`.
## Open questions
```

### 4. Round 3 → write `specs/roadmap.md`

Ask how they want the work sequenced. Typical unknowns:

- What the smallest useful shippable slice is
- Which features are in `<RELEASE>` vs deferred
- Whether infrastructure (auth, CI, deploy) comes before or after the first feature
- Anything VISION.md marks as coming after the first release — confirm it stays out
  of scope, and ask what that later version should be labeled if they want it named
- Rough sizing: is this a weekend, a month, a quarter?
- Phase granularity — see below. Propose your split and let the user adjust it.

**Testing and CI/CD are mandatory items on the roadmap**, not implied background work.
Ask when the test harness lands and when the CI pipeline lands, and place both as
explicit milestone entries with their own scope.

#### Shape: small ordered phases

The roadmap covers **only the work up to and including `<RELEASE>`**. Everything after
it is one short forward-looking section, not planned phases.

That road to `<RELEASE>` is broken into **many small phases** — aim for 4–8, and prefer
more small phases over few large ones. Each phase:

- is independently verifiable — you can tell it is done without waiting on a later phase
- has a single goal you can state in one sentence
- is roughly a few days of work, not weeks. If a phase needs a paragraph to explain its
  goal, it is two phases.
- builds on the phases before it; phases are ordered, not parallel tracks

Under each phase, list its concrete tasks as bullets — 3–8 per phase. Name each task for
the outcome it produces (`Check in the initial migration`, `Add the PR workflow`), not
for an activity (`coding`, `testing`).

**Two levels only: phase → task.** Do not group tasks, do not add sub-headings inside a
phase, and do not nest bullets below a task. If a phase's task list is getting long
enough to want grouping, that is the signal to split the phase in two.

Then write `specs/roadmap.md`:

```markdown
# Roadmap

All phases below lead to <RELEASE>. Work proceeds in order.

## Phase 0 — Foundation
**Goal:** one sentence.
**Done when:** one observable condition.

- <task>
- <task>
- <task>

## Phase 1 — …
(same shape: goal, done when, flat task list)

## <RELEASE> — Definition of done
Checklist that is true only when every phase above is complete.

## After <RELEASE>
Deferred items, unordered. No phases, no tasks.

## Open questions
```

Number phases from 0 so they can be referred to by number elsewhere in the project.

`<RELEASE>` is the label the user chose in Round 1. Substitute it literally in the
headings — do not leave the angle brackets in the written files.

### 5. Report

Summarize in plain text: the three file paths written, the decisions the user made
that shaped them, and every item parked under `## Open questions`. Do not commit —
committing is a separate, explicitly requested action.

## Writing style for all three files

- Short declarative sentences. These files get read by agents and humans mid-task.
- Every claim traces to VISION.md or to an answer the user gave in this session.
- Prefer "we will" / "we will not" over hedged prose. A constitution decides things.
- Cross-reference between the three files rather than repeating content.
- No invented dates, headcounts, budgets, metrics, vendor names, or version numbers.
- The release label is whatever the user chose — identical across all three files.
